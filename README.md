# Skydrive Startup Error Summary

The app is failing at startup because Spring Boot is trying to auto-start Docker Compose, but Docker Desktop is not available on this machine.

## Short version

- Spring Boot reads `docker-compose.yml` automatically.
- The `docker version` check fails because the Docker Desktop Linux engine pipe is missing.
- Because of that, the app stops before the Spring context finishes loading.

## Fix

- Disable Spring Boot Docker Compose auto-start, or start Docker Desktop before running the app.# SkyDrive
