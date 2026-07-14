package com.skydrive.skydrive.service;

import com.skydrive.skydrive.entity.DriveFile;
import com.skydrive.skydrive.entity.FileVersion;
import com.skydrive.skydrive.entity.UploadStatus;
import com.skydrive.skydrive.repository.FileRepository;
import com.skydrive.skydrive.repository.FileVersionRepository;
import com.skydrive.skydrive.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadCleanupService {

    private final FileRepository fileRepository;
    private final FileVersionRepository fileVersionRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    @Scheduled(cron = "0 0 * * * *") // Runs hourly
    public void cleanupOrphanedUploads() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(12);
        log.info("Starting scheduled cleanup of orphaned uploads created before {}", cutoff);

        // 1. Cleanup orphaned DriveFile uploads
        List<DriveFile> orphanedFiles = fileRepository.findByStatusAndUploadedAtBefore(UploadStatus.UPLOADING, cutoff);
        if (!orphanedFiles.isEmpty()) {
            log.info("Found {} orphaned files in UPLOADING state. Deleting...", orphanedFiles.size());
            for (DriveFile file : orphanedFiles) {
                try {
                    fileStorageService.delete(file.getStoredName());
                } catch (Exception e) {
                    log.warn("Failed to delete file {} from storage during cleanup: {}", file.getStoredName(), e.getMessage());
                }
                fileRepository.delete(file);
            }
        }

        // 2. Cleanup orphaned FileVersion uploads
        List<FileVersion> orphanedVersions = fileVersionRepository.findByStatusAndCreatedAtBefore(UploadStatus.UPLOADING, cutoff);
        if (!orphanedVersions.isEmpty()) {
            log.info("Found {} orphaned file versions in UPLOADING state. Deleting...", orphanedVersions.size());
            for (FileVersion version : orphanedVersions) {
                try {
                    fileStorageService.delete(version.getStoredName());
                } catch (Exception e) {
                    log.warn("Failed to delete version {} from storage during cleanup: {}", version.getStoredName(), e.getMessage());
                }
                fileVersionRepository.delete(version);
            }
        }
    }
}
