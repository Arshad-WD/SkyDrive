package com.skydrive.skydrive.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skydrive.skydrive.dto.file.SharedFileInfoResponse;
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

    private boolean isUserAuthenticated() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        return auth != null && auth.isAuthenticated() && 
            !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) &&
            !"anonymousUser".equals(auth.getName());
    }

    private boolean checkAccess(ShareLink shareLink) {
        if (shareLink.isPublic()) {
            return true;
        }

        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || 
            auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken ||
            "anonymousUser".equals(auth.getName())) {
            return false;
        }

        String currentEmail = auth.getName();
        
        // Owner always has access
        if (shareLink.getFile().getOwner().getEmail().equalsIgnoreCase(currentEmail)) {
            return true;
        }

        String allowedEmailsStr = shareLink.getAllowedEmails();
        if (allowedEmailsStr == null || allowedEmailsStr.trim().isEmpty()) {
            return false;
        }

        String[] allowedEmails = allowedEmailsStr.split(",");
        for (String email : allowedEmails) {
            if (email.trim().equalsIgnoreCase(currentEmail.trim())) {
                return true;
            }
        }

        return false;
    }

    @GetMapping("/{token}/info")
    public ResponseEntity<SharedFileInfoResponse> getSharedFileInfo(@PathVariable String token) {
        ShareLink shareLink = shareService.getShareLink(token);
        DriveFile file = shareLink.getFile();

        boolean isPublic = shareLink.isPublic();
        boolean authenticated = isUserAuthenticated();
        
        boolean authRequired = !isPublic && !authenticated;
        boolean allowed = isPublic || (authenticated && checkAccess(shareLink));

        SharedFileInfoResponse info = SharedFileInfoResponse.builder()
                .originalName(file.getOriginalName())
                .size(file.getSize())
                .contentType(file.getContentType())
                .ownerName(file.getOwner().getName())
                .isPublic(isPublic)
                .authRequired(authRequired)
                .allowed(allowed)
                .build();

        return ResponseEntity.ok(info);
    }

    @GetMapping("/{token}/download")
    public ResponseEntity<byte[]> downloadSharedFile(
            @PathVariable String token,
            @RequestParam(required = false, defaultValue = "false") boolean download
    ) throws Exception {

        ShareLink shareLink = shareService.getShareLink(token);

        if (!checkAccess(shareLink)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        DriveFile file = shareLink.getFile();

        byte[] content = fileStorageService.download(file.getStoredName())
                    .readAllBytes();

        String disposition = download ? "attachment" : "inline";

        return ResponseEntity.ok()
            .contentType(
                MediaType.parseMediaType(file.getContentType())
            ).header(HttpHeaders.CONTENT_DISPOSITION,
                disposition + "; filename=\"" +
                    file.getOriginalName() +
                    "\""
            ).body(content);
    }

    @GetMapping("/{token}")
    public ResponseEntity<byte[]> donwloadSharedFileOld(@PathVariable String token) throws Exception {
        return downloadSharedFile(token, true);
    }
}
