# SkyDrive

A modern, full-stack file storage and management application with real-time collaboration features, built with Spring Boot and Next.js.

![SkyDrive Demo](./skydrive_demo.webp)

## Overview

SkyDrive is a cloud file storage platform that allows users to securely upload, organize, share, and manage their files. It features user authentication, file versioning, activity tracking, and a responsive web interface.

## Features

- 🔐 **User Authentication** - Secure login and registration
- 📁 **File Management** - Upload, download, delete, and organize files
- 🗂️ **Folder Organization** - Create and manage folder hierarchies
- 📤 **File Sharing** - Share files with other users
- 📝 **Activity Tracking** - Monitor file access and modifications
- 🕐 **Version History** - Track file versions and restore previous versions
- 🎨 **Dark Mode Support** - Theme toggle for user preference
- 🗑️ **Trash Management** - Soft delete with recovery
- 🦠 **Virus Scanning** - Integrated ClamAV antivirus file scanning on upload
- ⚡ **Direct-to-S3 Uploads** - Bypasses backend server memory/bandwidth using secure Presigned PUT URLs
- 📦 **Chunked Uploads** - Automatic 10MB parallel/sequential chunking for files larger than 10MB
- 📡 **Real-Time Scan Updates** - Server-Sent Events (SSE) push background virus scan results to the frontend instantly
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

### Backend
- **Spring Boot 3.x** - Java web framework
- **PostgreSQL** - Relational database
- **MinIO** - Object storage (S3-compatible)
- **ClamAV** - Open-source antivirus engine for file scanning
- **Spring Security** - Authentication and authorization
- **JPA/Hibernate** - ORM

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS
- **Axios** - HTTP client
- **Zustand** - State management

## Prerequisites

- Java 17+ (Java 21 class files require Java 21)
- Node.js 18+
- PostgreSQL 12+
- MinIO (optional, for local S3-like storage)
- Docker & Docker Compose (optional, for containerized setup)

## Local Setup

### 1. Environment Configuration

Copy the environment variable template to create your local configurations:

```bash
# In the root directory
cp .env.template .env
```

You can customize the `.env` file with your database, security, and MinIO credentials.

### 2. Database Setup

PostgreSQL should be running on port 5433 (or configured via `DB_URL` in `.env`):

```bash
# Start a local PostgreSQL container using Docker
docker run -d \
  --name skydrive-postgres \
  -e POSTGRES_DB=skydrive \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:17
```

### 3. MinIO Setup (Optional)

Start a local MinIO object storage container:

```bash
docker run -d \
  --name skydrive-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password123 \
  minio/minio server /data --console-address ":9001"
```

### 4. Backend Setup

```bash
# From project root
./mvnw clean install

# Start the Spring Boot application
./mvnw spring-boot:run
```

The backend API will be available at `http://localhost:8080`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Docker Setup

To run the entire stack with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Spring Boot backend (port 8080)
- Next.js frontend (port 3000)
- PostgreSQL (port 5433)
- MinIO (port 9000)

## Production Upload & Scanning Architecture

SkyDrive uses a high-performance production architecture for handling uploads:

1. **Direct-to-Storage Uploads:** File uploads bypass the Spring Boot backend server entirely. The frontend requests a temporary **Presigned PUT URL** from the backend, and uploads the bytes directly from the desktop browser to MinIO/S3.
2. **Chunked Resumable Uploads:** Files larger than 10MB are sliced into 10MB chunks on the frontend. The browser uploads these chunks directly to MinIO/S3. On completion, the backend merges the chunks sequentially and cleans up the temporary parts.
3. **Asynchronous Virus Scanning:** Files are scanned by ClamAV asynchronously in a background thread. While scanning is underway, files display a `Scanning...` status and are protected from download/share actions.
4. **Real-Time Push Notifications:** The backend broadcasts scan completion notifications (`CLEAN` or `VIRUS_DETECTED`) to connected browsers via **Server-Sent Events (SSE)**, causing the UI to refresh immediately.
5. **Orphaned Upload Sweeper:** A scheduled hourly task automatically purges database entries and temporary objects for uploads that were initiated but abandoned.

### Architecture Design Rationale

| Strategy | Why We Chose It |
| :--- | :--- |
| **Direct-to-Storage (Presigned URLs)** | Bypasses the application server for raw file uploads. Traditional file uploads buffer the file bytes in the application server's memory or temp disc, creating a major CPU/Memory/Bandwidth bottleneck. Direct-to-Storage saves server resources, scales horizontally, and allows uploading multi-gigabyte files. |
| **Chunked Resumable Uploads** | Handles large uploads reliably over unstable network connections. If a 1GB upload fails at 90%, the user must restart from 0%. With chunked uploads, we split files and can retry individual failed chunks. It also avoids JVM memory exhaustion during merge by merging streams sequentially. |
| **Asynchronous Virus Scanning** | Decouples heavy computational tasks (ClamAV scan) from the user request thread. If scanning was synchronous, the user upload request would hang for minutes while ClamAV scans the file, resulting in gateway timeouts (504). By scanning asynchronously, the file is saved instantly as `PENDING_SCAN` and checked in a background thread. |
| **Server-Sent Events (SSE)** | Real-time user experience without wasteful network polling. WebSockets are bi-directional but have higher overhead. SSE is lightweight, uses standard HTTP/1.1 or HTTP/2, handles auto-reconnection out of the box, and is perfect for unidirectional server-to-client push updates (like "Scan complete"). |
| **Orphaned Upload Sweeper** | Prevents storage leakages. When a client initiates a direct upload but loses connection or closes the tab, the database has an orphan record in `UPLOADING` state and MinIO has partial/abandoned chunks. The sweeper automatically cleans these up to maintain data consistency. |

## Configuration

### Backend (`application.properties`)

- `server.port=8080` - Server port
- `spring.datasource.url` - PostgreSQL connection
- `spring.jpa.hibernate.ddl-auto=update` - Auto schema update
- `spring.profiles.active` - Profile selection (default or docker)

### Frontend Environment Variables

Create `.env.local` in the `frontend` directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Project Structure

```
├── src/                        # Spring Boot (Backend) Source Code
│   ├── main/
│   │   ├── java/com/skydrive/skydrive/
│   │   │   ├── controller/    # REST API Controllers
│   │   │   ├── service/       # Business Logic Services
│   │   │   ├── entity/        # JPA Entities / Models
│   │   │   ├── repository/    # JPA Repositories (Database access)
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── config/        # Spring Security / Swagger / S3 Configs
│   │   │   └── exception/     # Global Error Handling
│   │   └── resources/
│   │       ├── application.properties        # Default configuration
│   │       └── application-docker.properties # Docker profile configuration
│   └── test/                  # Backend unit/integration tests
│
├── frontend/                   # Next.js 14 (Frontend) Application
│   ├── src/
│   │   ├── app/              # Next.js pages and routing
│   │   ├── components/       # Reusable UI React components
│   │   ├── lib/              # API clients & UI state utilities
│   │   ├── services/         # Frontend API integration services
│   │   └── store/            # Zustand stores
│   └── package.json          # Frontend dependencies
│
├── docker-compose.yml         # Docker orchestration (Postgres, MinIO, Redis, ClamAV)
├── Dockerfile                 # Backend containerization
├── .env.template              # Local Environment configuration template
└── README.md                  # Project overview and setup instructions
```

## API Documentation

The backend API is documented using Swagger/OpenAPI. Once the backend is running, you can access the interactive documentation at:
👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

### Key Endpoint Groups:
- **Authentication**: `POST /auth/register`, `POST /auth/login`
- **Files**: Upload, download, delete, view versions, and track activity
- **Folders**: Hierarchical folder structures
- **Sharing**: Share link generation and tracking

## Development

### Running Tests

```bash
# Backend tests
./mvnw test

# Frontend tests
cd frontend
npm run test
```

### Code Quality

```bash
# Format code
cd frontend
npm run lint
```

## Troubleshooting

### Port Already in Use
If port 5432 is already occupied by PostgreSQL, the application automatically uses port 5433.

### Docker Desktop Not Available
Disable Spring Boot Docker Compose auto-start or ensure Docker Desktop is running before starting the application.

### Database Connection Issues
- Verify PostgreSQL is running on the configured port
- Check database credentials in `application.properties`
- Ensure the database exists

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is open source and available under the MIT License.
