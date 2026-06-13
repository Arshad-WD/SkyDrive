package com.skydrive.skydrive.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skydrive.skydrive.dto.storage.StorageUsageResponse;
import com.skydrive.skydrive.service.StorageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {
    
    private final StorageService storageService;

    @GetMapping("/usage")
    public StorageUsageResponse getUsage(){
        return storageService.getUsage();
    }
}
