package com.skydrive.skydrive.service;


import org.springframework.stereotype.Service;

import com.skydrive.skydrive.dto.storage.StorageUsageResponse;
import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.repository.FileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StorageService {
    
    private final FileRepository fileRepository;
    private final UserService userService;


    public StorageUsageResponse getUsage(){

        User user = userService.getCurrentUser();

        long used = fileRepository.getUsedStorage(user.getId());

        long limit = user.getStorageLimit();

        long remaining = limit - used;

        double percentage = ((double) used / limit) * 100;

        return StorageUsageResponse.builder()
                .usedBytes(used)
                .limitBytes(limit)
                .remainingBytes(remaining)
                .usedPercentage(percentage)
                .build();
    }
}
