# SkyDrive

A modern, full-stack file storage and management application with real-time collaboration features, built with Spring Boot and Next.js.

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
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

### Backend
- **Spring Boot 3.x** - Java web framework
- **PostgreSQL** - Relational database
- **MinIO** - Object storage (S3-compatible)
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

### 1. Database Setup

PostgreSQL should be running on port 5433:

```bash
# If using Docker for PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5433:5432 \
  postgres:15
```

### 2. Backend Setup

```bash
# From project root
./mvnw clean install

# Start the Spring Boot application
./mvnw spring-boot:run
```

The backend will be available at `http://localhost:8080`

### 3. MinIO Setup (Optional)

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 4. Frontend Setup

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
├── backend/                    # Spring Boot application
│   ├── src/main/java/         # Java source code
│   │   └── com/skydrive/
│   │       ├── controller/    # REST endpoints
│   │       ├── service/       # Business logic
│   │       ├── entity/        # JPA entities
│   │       ├── dto/           # Data transfer objects
│   │       ├── repository/    # Data access layer
│   │       ├── config/        # Configuration classes
│   │       └── exception/     # Custom exceptions
│   └── pom.xml               # Maven configuration
│
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and helpers
│   │   └── services/         # API services
│   └── package.json          # NPM dependencies
│
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Backend Docker image
└── README.md                  # This file
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Files
- `GET /files` - List all files
- `POST /files/upload` - Upload a file
- `GET /files/{id}` - Get file details
- `DELETE /files/{id}` - Delete a file
- `GET /files/{id}/download` - Download a file

### Folders
- `GET /folders` - List all folders
- `POST /folders` - Create a new folder
- `PUT /folders/{id}` - Update folder
- `DELETE /folders/{id}` - Delete folder

### Sharing
- `POST /share` - Share a file
- `GET /shared` - Get shared files

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
