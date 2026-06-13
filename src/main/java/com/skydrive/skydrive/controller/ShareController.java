package com.skydrive.skydrive.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skydrive.skydrive.entity.DriveFile;
import com.skydrive.skydrive.entity.ShareLink;
import com.skydrive.skydrive.service.ShareService;
import com.skydrive.skydrive.storage.FileStorageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/share")
@RequiredArgsConstructor
public class ShareController {
    
    private final ShareService shareService;
    private final FileStorageService fileStorageService;


    @GetMapping("/{token}")
    public ResponseEntity<byte[]> donwloadSharedFile(@PathVariable String token) throws Exception{

        ShareLink shareLink = shareService.getShareLink(token);

        DriveFile file = shareLink.getFile();

        byte[] content = fileStorageService.download(file.getStoredName())
                    .readAllBytes();


        return ResponseEntity.ok()
            .contentType(
                MediaType.parseMediaType(file.getContentType())
            ).header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" +
                    file.getOriginalName() +
                    "\""
            ).body(content);
    }
}
