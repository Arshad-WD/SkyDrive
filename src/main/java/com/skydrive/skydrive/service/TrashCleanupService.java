package com.skydrive.skydrive.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.skydrive.skydrive.entity.DriveFile;
import com.skydrive.skydrive.repository.FileRepository;
import com.skydrive.skydrive.storage.FileStorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrashCleanupService {
    
    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;


    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupTrash(){

        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

        List<DriveFile> files = fileRepository.findByDeletedTrueAndDeletedAtBefore(cutoff);

        for(DriveFile file: files){
            try{

                fileStorageService.delete(file.getStoredName());

                fileRepository.delete(file);
                log.info("Auto deleted file {}", file.getOriginalName());

            }catch(Exception e){
                log.error("Failed deleting file {}", file.getId(), e);
            }
        }
    }
}
