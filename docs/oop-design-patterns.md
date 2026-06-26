# OOP Design Patterns in SkyDrive Project

A complete map of every design pattern applied across the codebase.

---

## 🏗️ Creational Patterns

### 1. Builder Pattern
The most heavily used pattern in the project — used across **entities, DTOs, and responses**.

| Where Used | How |
|---|---|
| `DriveFile.java` | `DriveFile.builder().originalName(...).owner(...).build()` |
| `ShareLink.java` | `ShareLink.builder().token(...).file(...).isPublic(true).build()` |
| `FileVersion.java` | `FileVersion.builder().file(...).versionNumber(...).build()` |
| `ActivityLog.java` | `ActivityLog.builder().user(...).activityType(...).build()` |
| `User.java` | `User.builder()...build()` |
| `FileResponse` / `ShareLinkResponse` | Response DTOs built via `.builder()` |
| `ErrorResponse` | `ErrorResponse.builder().timestamp(...).status(...).build()` |
| `PresignedUrlResponse` | `PresignedUrlResponse.builder().url(...).expiresInMinutes(15).build()` |
| `MinioClient` (MinioConfig) | `MinioClient.builder().endpoint(url).credentials(...).build()` |
| `PutObjectArgs`, `GetObjectArgs` etc. | All MinIO SDK args are built via `.builder().bucket(...).build()` |

> **Lombok's `@Builder`** annotation is used on all entities and response DTOs, generating the builder boilerplate automatically.

**Example from `FileService.java`:**
```java
DriveFile driveFile = DriveFile.builder()
    .originalName(file.getOriginalFilename())
    .storedName(storedName)
    .contentType(file.getContentType())
    .size(file.getSize())
    .owner(currentUser)
    .folder(folder)
    .build();
```

---

### 2. Factory Method Pattern (via Spring `@Bean`)
`MinioConfig.java` and `SecurityConfig.java` use the `@Bean` factory method pattern — Spring delegates object creation entirely to these factory methods.

```java
// MinioConfig.java — factory method creates and configures the MinioClient
@Bean
public MinioClient MinioClient() {
    return MinioClient.builder()
        .endpoint(url)
        .credentials(accessKey, secretKey)
        .build();
}

// SecurityConfig.java — factory method creates the password encoder
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

---

### 3. Singleton Pattern (via Spring IoC)
Every class annotated with `@Service`, `@Repository`, `@Component`, or `@Configuration` is a **Spring-managed Singleton** — only one instance exists per application context.

| Class | Annotation |
|---|---|
| `FileService` | `@Service` |
| `ActivityLogService` | `@Service` |
| `VirusScanService` | `@Service` |
| `TrashCleanupService` | `@Service` |
| `MinioStorageService` | `@Service` |
| `FileRepository` | `@Repository` (via Spring Data) |
| `MinioConfig` | `@Configuration` |
| `SecurityConfig` | `@Configuration` |

---

## 🧱 Structural Patterns

### 4. Strategy Pattern
`FileStorageService.java` defines a **storage strategy interface**. `MinioStorageService.java` is the concrete strategy. You could swap in S3, GCS, or local disk without changing any consumer code.

```
FileStorageService  (interface / strategy)
       │
       └── MinioStorageService  (concrete strategy)
```

```java
// FileService.java injects the strategy — not the concrete class
private final FileStorageService fileStorageService;

// Call is to the interface — storage provider is swappable
String storedName = fileStorageService.upload(file);
```

---

### 5. Façade Pattern
`FileService.java` acts as a **façade** over many subsystems: storage, virus scanning, activity logging, repository access, share link generation. The controller only talks to `FileService` and doesn't know anything about the internals.

```
FileController
      │
      ▼
  FileService  ◄── FAÇADE
   ├── FileStorageService   (MinIO operations)
   ├── VirusScanService     (ClamAV scanning)
   ├── ActivityLogService   (audit trail)
   ├── FileRepository       (DB persistence)
   ├── FolderRepository
   ├── ShareLinkRepository
   └── FileVersionRepository
```

---

### 6. Proxy / Decorator Pattern (via Spring AOP)
Two Spring features apply proxy-based cross-cutting concerns transparently:

- **`@CacheEvict`** on `FileService` methods — Spring wraps the method in a caching proxy that clears `my-files` and `file-search` caches after mutations.
- **`JwtAuthenticationFilter`** — a filter proxy that intercepts every HTTP request to validate JWT tokens before the actual handler runs.

```java
// FileService.java — Spring caching proxy auto-applied
@CacheEvict(value = {"my-files", "file-search"}, allEntries = true)
public FileResponse uploadFile(...) { ... }
```

---

### 7. Repository Pattern
All data access is abstracted behind repository interfaces that extend Spring Data's `JpaRepository`. Business logic never writes raw SQL or uses `EntityManager` directly.

| Repository | Entity |
|---|---|
| `FileRepository` | `DriveFile` |
| `FolderRepository` | `Folder` |
| `UserRepository` | `User` |
| `ShareLinkRespoistory` | `ShareLink` |
| `FileVersionRepository` | `FileVersion` |
| `ActivityLogRepository` | `ActivityLog` |

---

## 🎭 Behavioral Patterns

### 8. Chain of Responsibility Pattern (Filter Chain)
The Spring Security filter chain is a classic **Chain of Responsibility**. Each filter processes the request, then passes it to the next.

```
HTTP Request
    │
    ▼
CorsFilter → JwtAuthenticationFilter → UsernamePasswordAuthenticationFilter → Controller
```

`JwtAuthenticationFilter.java` is a custom link in this chain that validates the Bearer token.

---

### 9. Template Method Pattern (via `@PrePersist`)
Each entity defines a `prePersist()` hook that is triggered by JPA before saving — a classic **template method** where the framework defines the algorithm (persist lifecycle) and the subclass fills in a step.

```java
// DriveFile.java
@PrePersist
public void prePersist() {
    uploadedAt = LocalDateTime.now();
    if (deleted == null) { deleted = false; }
}

// User.java
@PrePersist
public void prePresist() {
    createdAt = LocalDateTime.now();
    if (storageLimit == null) { storageLimit = 1073741824L; }
}
```

---

### 10. Observer Pattern (via `@Scheduled`)
`TrashCleanupService.java` is scheduled with `@Scheduled(cron = "0 0 2 * * *")`. Spring's task scheduler acts as the **subject/publisher** that notifies (triggers) the `cleanupTrash()` method every day at 2 AM — following the observer/event-listener pattern.

---

### 11. Null Object / Guard Clause Pattern
Across services, a consistent **guard clause** pattern is used to fail fast on missing or unauthorized resources before any business logic runs.

```java
// FileService.java — consistent pattern across all methods
DriveFile file = fileRepository.findById(fileId).orElseThrow();
if (!file.getOwner().getId().equals(currentUser.getId())) {
    throw new AccessDeniedException("Access denied");
}
```

---

### 12. Exception Shielding — Chain of Responsibility (via `@ControllerAdvice`)
`GlobalExceptionHandler.java` uses `@ControllerAdvice` + `@ExceptionHandler` — a centralized error-handling pattern where each handler is a link in a chain matched by exception type. The client always receives a clean `ErrorResponse`, never a raw stack trace.

| Exception | HTTP Status |
|---|---|
| `ResourceNotFoundException` | 404 Not Found |
| `AccessDeniedException` | 403 Forbidden |
| `StorageLimitExceededException` | 400 Bad Request |
| `VirusDetectedException` | 400 Bad Request |
| `MethodArgumentNotValidException` | 400 Bad Request |
| `Exception` (catch-all) | 500 Internal Server Error |

---

## 📦 Architectural Patterns

### 13. Layered Architecture (MVC + Service Layer)
The project follows a clean **3-tier layered architecture**:

```
Controller Layer   →  Handles HTTP, request/response mapping
      │
Service Layer      →  Business logic, orchestration
      │
Repository Layer   →  Data access, persistence
```

### 14. DTO Pattern (Data Transfer Object)
Domain entities (`DriveFile`, `User`, etc.) are **never returned directly** to the client. Dedicated DTO/Response classes are used to decouple the API contract from the internal data model.

```
DriveFile (Entity)   →  mapToResponse()      →  FileResponse (DTO)
FileVersion (Entity) →  mapVersionResponse() →  FileVersionResponse (DTO)
ActivityLog (Entity) →  lambda map           →  ActivityLogResponse (DTO)
```

---

## 🗂️ Summary Table

| # | Pattern | Category | Where Applied |
|---|---|---|---|
| 1 | **Builder** | Creational | All entities, DTOs, MinIO SDK args |
| 2 | **Factory Method** | Creational | `MinioConfig`, `SecurityConfig` `@Bean` methods |
| 3 | **Singleton** | Creational | All `@Service`, `@Repository`, `@Configuration` beans |
| 4 | **Strategy** | Structural | `FileStorageService` interface + `MinioStorageService` |
| 5 | **Façade** | Structural | `FileService` over storage/scan/log/DB subsystems |
| 6 | **Proxy / Decorator** | Structural | `@CacheEvict` (AOP proxy), `JwtAuthenticationFilter` |
| 7 | **Repository** | Structural | All `JpaRepository` interfaces |
| 8 | **Chain of Responsibility** | Behavioral | Spring Security Filter Chain |
| 9 | **Template Method** | Behavioral | `@PrePersist` hooks in all entities |
| 10 | **Observer / Event** | Behavioral | `@Scheduled` in `TrashCleanupService` |
| 11 | **Guard Clause** | Behavioral | Fail-fast auth checks in all service methods |
| 12 | **Exception Shielding** | Behavioral | `GlobalExceptionHandler` with `@ControllerAdvice` |
| 13 | **Layered Architecture** | Architectural | Controller → Service → Repository |
| 14 | **DTO** | Architectural | All response/request mapping |
