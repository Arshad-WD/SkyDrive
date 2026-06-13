package com.skydrive.skydrive.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.skydrive.skydrive.dto.folder.CreateFolderRequest;
import com.skydrive.skydrive.dto.folder.FolderResponse;
import com.skydrive.skydrive.dto.folder.FolderTreeResponse;
import com.skydrive.skydrive.service.FolderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {
    
    private final FolderService folderService;

    @PostMapping
    public FolderResponse createFolder(@Valid @RequestBody CreateFolderRequest request){
        return folderService.createFolder(request);
    }

    @GetMapping("/tree")
    public List<FolderTreeResponse> getFolderTree(){
        return folderService.getFolderTree();
    }
}
