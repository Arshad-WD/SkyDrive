package com.skydrive.skydrive.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.skydrive.skydrive.dto.PresignedUrlResponse;
import com.skydrive.skydrive.dto.file.FileResponse;
import com.skydrive.skydrive.dto.file.FileVersionResponse;
import com.skydrive.skydrive.dto.file.ShareLinkResponse;
import com.skydrive.skydrive.entity.ActivityType;
import com.skydrive.skydrive.entity.DriveFile;
import com.skydrive.skydrive.entity.FileVersion;
import com.skydrive.skydrive.entity.Folder;
import com.skydrive.skydrive.entity.ShareLink;
import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.exception.AccessDeniedException;
import com.skydrive.skydrive.exception.StorageLimitExceededException;
import com.skydrive.skydrive.exception.VirusDetectedException;
import com.skydrive.skydrive.repository.FileRepository;
import com.skydrive.skydrive.repository.FileVersionRepository;
import com.skydrive.skydrive.repository.FolderRepository;
import com.skydrive.skydrive.repository.ShareLinkRespoistory;
import com.skydrive.skydrive.storage.FileStorageService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import com.skydrive.skydrive.dto.file.ShareSettingsRequest;
import com.skydrive.skydrive.dto.file.InitiateUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateUploadResponse;
import com.skydrive.skydrive.dto.file.InitiateVersionUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateChunkedUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateChunkedUploadResponse;
import com.skydrive.skydrive.entity.UploadStatus;
import com.skydrive.skydrive.exception.FileNotAvailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserService userService;
    private final ShareLinkRespoistory shareLinkRespoistory;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;
    private final FileVersionRepository fileVersionRepository;
    private final VirusScanService virusScanService;
    private final SseService sseService;

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileResponse uploadFile(MultipartFile file, Long folderId) throws Exception {
        
        User currentUser = userService.getCurrentUser();

        Long usedStorage = fileRepository.getUsedStorage(currentUser.getId());

        Long storageLimit = currentUser.getStorageLimit();

        if(usedStorage + file.getSize() > storageLimit){
            throw new StorageLimitExceededException("Storage limit exceeded");
        }

        Folder folder = folderRepository.findById(folderId)
                    .orElseThrow();

        if (!folder.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        scanFile(file, currentUser);

        String storedName = fileStorageService.upload(file);

        DriveFile driveFile = DriveFile.builder()
                        .originalName(file.getOriginalFilename())
                        .storedName(storedName)
                        .contentType(file.getContentType())
                        .size(file.getSize())
                        .storagePath(storedName)
                        .owner(currentUser)
                        .folder(folder)
                        .build();

        DriveFile saved = fileRepository.save(driveFile);

        activityLogService.log(currentUser, ActivityType.UPLOAD, "Uploaded file:"+ saved.getOriginalName());
        log.info("User {} uploaded file {}", currentUser.getId(), saved.getOriginalName());
        return mapToResponse(saved);
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public InitiateUploadResponse initiateUpload(InitiateUploadRequest request) throws Exception {
        User currentUser = userService.getCurrentUser();

        Long usedStorage = fileRepository.getUsedStorage(currentUser.getId());
        Long storageLimit = currentUser.getStorageLimit();

        if (usedStorage + request.getSize() > storageLimit) {
            throw new StorageLimitExceededException("Storage limit exceeded");
        }

        Folder folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow();

        if (!folder.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        String storedName = UUID.randomUUID() + "_" + request.getFileName();
        String uploadUrl = fileStorageService.generatePresignedUploadUrl(storedName);

        DriveFile driveFile = DriveFile.builder()
                        .originalName(request.getFileName())
                        .storedName(storedName)
                        .contentType(request.getContentType())
                        .size(request.getSize())
                        .storagePath(storedName)
                        .owner(currentUser)
                        .folder(folder)
                        .status(UploadStatus.UPLOADING)
                        .deleted(false)
                        .build();

        DriveFile saved = fileRepository.save(driveFile);

        return InitiateUploadResponse.builder()
                        .fileId(saved.getId())
                        .uploadUrl(uploadUrl)
                        .storedName(storedName)
                        .build();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileResponse completeUpload(Long fileId) throws Exception {
        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                    .orElseThrow();

        if (!file.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (file.getStatus() != UploadStatus.UPLOADING) {
            throw new IllegalStateException("File is not in UPLOADING status");
        }

        file.setStatus(UploadStatus.PENDING_SCAN);
        DriveFile saved = fileRepository.save(file);

        activityLogService.log(currentUser, ActivityType.UPLOAD, "Uploaded file: " + saved.getOriginalName());
        log.info("User {} uploaded file {} (pending virus scan)", currentUser.getId(), saved.getOriginalName());

        // Trigger Async Scan
        scanFileAsync(saved.getId());

        return mapToResponse(saved);
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public InitiateChunkedUploadResponse initiateChunkedUpload(InitiateChunkedUploadRequest request) throws Exception {
        User currentUser = userService.getCurrentUser();

        Long usedStorage = fileRepository.getUsedStorage(currentUser.getId());
        Long storageLimit = currentUser.getStorageLimit();

        if (usedStorage + request.getSize() > storageLimit) {
            throw new StorageLimitExceededException("Storage limit exceeded");
        }

        Folder folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow();

        if (!folder.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        String storedName = UUID.randomUUID() + "_" + request.getFileName();
        
        List<String> partUrls = new ArrayList<>();
        for (int i = 0; i < request.getTotalChunks(); i++) {
            String partName = "chunks/" + storedName + "/part_" + i;
            String partUrl = fileStorageService.generatePresignedUploadUrl(partName);
            partUrls.add(partUrl);
        }

        DriveFile driveFile = DriveFile.builder()
                        .originalName(request.getFileName())
                        .storedName(storedName)
                        .contentType(request.getContentType())
                        .size(request.getSize())
                        .storagePath(storedName)
                        .owner(currentUser)
                        .folder(folder)
                        .status(UploadStatus.UPLOADING)
                        .deleted(false)
                        .build();

        DriveFile saved = fileRepository.save(driveFile);

        return InitiateChunkedUploadResponse.builder()
                        .fileId(saved.getId())
                        .uploadUrls(partUrls)
                        .storedName(storedName)
                        .build();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileResponse completeChunkedUpload(Long fileId, Integer totalChunks) throws Exception {
        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                    .orElseThrow();

        if (!file.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (file.getStatus() != UploadStatus.UPLOADING) {
            throw new IllegalStateException("File is not in UPLOADING status");
        }

        log.info("Merging {} chunks for file {} ({})", totalChunks, fileId, file.getOriginalName());

        // Create temporary file inside workspace
        File tempFile = File.createTempFile("merge_" + file.getStoredName(), ".tmp");
        
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[8192];
            for (int i = 0; i < totalChunks; i++) {
                String partName = "chunks/" + file.getStoredName() + "/part_" + i;
                try (InputStream partStream = fileStorageService.download(partName)) {
                    int bytesRead;
                    while ((bytesRead = partStream.read(buffer)) != -1) {
                        fos.write(buffer, 0, bytesRead);
                    }
                }
                
                // Delete part from storage
                try {
                    fileStorageService.delete(partName);
                } catch (Exception e) {
                    log.warn("Failed to delete chunk part {}: {}", partName, e.getMessage());
                }
            }
        }

        // Upload merged file to MinIO
        try (FileInputStream fis = new FileInputStream(tempFile)) {
            fileStorageService.upload(file.getStoredName(), fis, tempFile.length(), file.getContentType());
        } finally {
            // Delete local temp file
            if (!tempFile.delete()) {
                log.warn("Failed to delete local temp merge file: {}", tempFile.getAbsolutePath());
            }
        }

        file.setStatus(UploadStatus.PENDING_SCAN);
        DriveFile saved = fileRepository.save(file);

        activityLogService.log(currentUser, ActivityType.UPLOAD, "Uploaded file (chunked): " + saved.getOriginalName());
        log.info("User {} uploaded chunked file {} (pending scan)", currentUser.getId(), saved.getOriginalName());

        // Trigger Async Scan
        scanFileAsync(saved.getId());

        return mapToResponse(saved);
    }

    @Async
    public void scanFileAsync(Long fileId) {
        try {
            DriveFile file = fileRepository.findById(fileId).orElse(null);
            if (file == null) {
                log.warn("File {} not found for async virus scan", fileId);
                return;
            }

            log.info("Starting async virus scan for file {} ({})", file.getId(), file.getOriginalName());

            try (java.io.InputStream is = fileStorageService.download(file.getStoredName())) {
                virusScanService.scan(is);
                
                file.setStatus(UploadStatus.CLEAN);
                fileRepository.save(file);
                log.info("File {} ({}) scanned CLEAN", file.getId(), file.getOriginalName());
                sseService.sendScanResult(file.getOwner().getId(), file.getId(), "CLEAN");
            } catch (VirusDetectedException ex) {
                log.error("Virus detected in file {} ({})!", file.getId(), file.getOriginalName());
                file.setStatus(UploadStatus.VIRUS_DETECTED);
                fileRepository.save(file);

                activityLogService.log(file.getOwner(), ActivityType.VIRUS_BLOCKED, "Blocked malicious file: " + file.getOriginalName());
                sseService.sendScanResult(file.getOwner().getId(), file.getId(), "VIRUS_DETECTED");

                try {
                    fileStorageService.delete(file.getStoredName());
                    log.info("Deleted malicious file binary for {} from storage", file.getStoredName());
                } catch (Exception deleteEx) {
                    log.error("Failed to delete malicious file from storage: {}", file.getStoredName(), deleteEx);
                }
            }
        } catch (Exception e) {
            log.error("Error during async virus scan for file {}", fileId, e);
        }
    }

    public DriveFile getFile(Long fileId){
        
        User curretUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                    .orElseThrow();

        if(!file.getOwner().getId().equals(curretUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (file.getStatus() != UploadStatus.CLEAN) {
            throw new FileNotAvailableException("File is not available. Status: " + file.getStatus());
        }

        activityLogService.log(
                curretUser,
                ActivityType.DOWNLOAD,
                "Downloaded file: " + file.getOriginalName()
        );

        log.info(
                "User {} downloaded file {}",
                curretUser.getId(),
                file.getOriginalName()
        );

        return file;
    }

    public List<FileResponse> getMyFiles(){

        User currentUser = userService.getCurrentUser();

        return fileRepository.findByOwnerIdAndDeletedFalse(currentUser.getId())
                        .stream()
                        .map(this::mapToResponse)
                        .toList();
    }

    private FileResponse mapToResponse(DriveFile file){
        
        return FileResponse.builder()
                .id(file.getId())
                .originalName(file.getOriginalName())
                .contentType(file.getContentType())
                .size(file.getSize())
                .status(file.getStatus())
                .build();
    }

    public List<FileResponse> getFilesByFolder(Long folderId){
        Folder folder = folderRepository.findById(folderId)
                        .orElseThrow();

        User currentUser = userService.getCurrentUser();

        if(!folder.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        return fileRepository
                .findByFolderIdAndDeletedFalse(folderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileResponse moveFile(Long fileId, Long targetFolderId) {

        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
        .orElseThrow();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        Folder targetFolder = folderRepository.findById(targetFolderId)
                .orElseThrow();
        
        if(!targetFolder.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        file.setFolder(targetFolder);

        DriveFile saved = fileRepository.save(file);

        activityLogService.log(
                currentUser,
                ActivityType.MOVE,
                "Moved file: " + file.getOriginalName()
        );

        log.info(
                "User {} moved file {} to folder {}",
                currentUser.getId(),
                file.getOriginalName(),
                targetFolder.getName()
        );

        return mapToResponse(saved);
    }

    public List<FileResponse> searchFiles(String keyword){
        User currentUser = userService.getCurrentUser();

        return fileRepository.findByOwnerIdAndDeletedFalseAndOriginalNameContainingIgnoreCase(currentUser.getId(), keyword)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public void moveToTrash(Long fileId){

        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                        .orElseThrow();
        
        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        file.setDeleted(true);
        file.setDeletedAt(java.time.LocalDateTime.now());

        fileRepository.save(file);

        activityLogService.log(currentUser, ActivityType.DELETE, "Moved file to trash:" + file.getOriginalName());
        log.info("User {} moved file {} to trash", currentUser.getId(), file.getOriginalName());

    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public void restoreFile(Long fileId){

        User currenetUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                        .orElseThrow();

        if(!file.getOwner().getId().equals(currenetUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        file.setDeleted(false);
        file.setDeletedAt(null);

        fileRepository.save(file);

        activityLogService.log(currenetUser, ActivityType.RESTORE, "Restored file:"+ file.getOriginalName());

        log.info("User {} restored file {}", currenetUser.getId(), file.getOriginalName());
    }

    public List<FileResponse> getTrashFiles(){

        User currentUser = userService.getCurrentUser();

        return fileRepository.findByOwnerIdAndDeletedTrue(currentUser.getId())
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public void permanentlyDelete(Long fileId) throws Exception{

        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                    .orElseThrow();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        fileStorageService.delete(
            file.getStoragePath()
        );

        activityLogService.log(
                currentUser,
                ActivityType.PERMANET_DELETE,
                "Permanently deleted file: " +
                        file.getOriginalName()
        );

        log.info(
                "User {} permanently deleted file {}",
                currentUser.getId(),
                file.getOriginalName()
        );

        fileRepository.delete(file);
    }

    public ShareLinkResponse generateShareLink(Long fileId){
        
        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                        .orElseThrow();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access Denied");
        }

        ShareLink shareLink = shareLinkRespoistory.findByFileId(fileId)
                .orElse(null);
        
        if(shareLink == null){
            shareLink = ShareLink.builder()
                        .token(UUID.randomUUID().toString().replace("-", ""))
                        .file(file)
                        .isPublic(true)
                        .build();

            shareLink = shareLinkRespoistory.save(shareLink);
        }   

        activityLogService.log(currentUser, ActivityType.SHARE, "Shared file:"+ file.getOriginalName());

        log.info("User {} shared file {}", currentUser.getId(), file.getOriginalName());

        return ShareLinkResponse.builder()
                .url(frontendUrl + "/share/" + shareLink.getToken())
                .isPublic(shareLink.isPublic())
                .allowedEmails(shareLink.getAllowedEmails())
                .build();
    }

    public ShareLinkResponse updateShareSettings(Long fileId, ShareSettingsRequest request) {
        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                        .orElseThrow();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access Denied");
        }

        ShareLink shareLink = shareLinkRespoistory.findByFileId(fileId)
                .orElseThrow(() -> new RuntimeException("Share link not found for this file"));

        shareLink.setPublic(request.isPublic());
        shareLink.setAllowedEmails(request.getAllowedEmails());
        shareLink = shareLinkRespoistory.save(shareLink);

        return ShareLinkResponse.builder()
                .url(frontendUrl + "/share/" + shareLink.getToken())
                .isPublic(shareLink.isPublic())
                .allowedEmails(shareLink.getAllowedEmails())
                .build();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileVersionResponse uploadNewVersion(Long fileId, MultipartFile file) throws Exception{
        
        User currentUser = userService.getCurrentUser();

        
        Long usedStorage = fileRepository.getUsedStorage(currentUser.getId());

        Long storageLimit = currentUser.getStorageLimit();

        if(usedStorage + file.getSize() > storageLimit){
            throw new StorageLimitExceededException("Storage limit exceeded");
        }

        DriveFile driveFile = fileRepository.findById(fileId)
                .orElseThrow();

        if(!driveFile.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        Integer newVersion = fileVersionRepository
                    .findTopByFileIdOrderByVersionNumberDesc(fileId)
                    .map(v -> v.getVersionNumber()+1)
                    .orElse(1);
                    
        scanFile(file, currentUser);

        String storedName = fileStorageService.upload(file);

        FileVersion version = FileVersion.builder()
                .file(driveFile)
                .versionNumber(newVersion)
                .storedName(storedName)
                .size(file.getSize())
                .contentType(file.getContentType())
                .build();
        
        FileVersion saved = fileVersionRepository.save(version);

        activityLogService.log(currentUser, ActivityType.VERSION_UPLOAD, 
            "Uploaded version:" + newVersion + "for file "+ driveFile.getOriginalName());


        return FileVersionResponse.builder()
            .id(saved.getId())
            .versionNumber(saved.getVersionNumber())
            .size(saved.getSize())
            .contentType(saved.getContentType())
            .createdAt(saved.getCreatedAt())
            .build();

    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public InitiateUploadResponse initiateVersionUpload(InitiateVersionUploadRequest request) throws Exception {
        User currentUser = userService.getCurrentUser();

        Long usedStorage = fileRepository.getUsedStorage(currentUser.getId());
        Long storageLimit = currentUser.getStorageLimit();

        if (usedStorage + request.getSize() > storageLimit) {
            throw new StorageLimitExceededException("Storage limit exceeded");
        }

        DriveFile driveFile = fileRepository.findById(request.getFileId())
                .orElseThrow();

        if (!driveFile.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        Integer newVersionNumber = fileVersionRepository
                    .findTopByFileIdOrderByVersionNumberDesc(request.getFileId())
                    .map(v -> v.getVersionNumber() + 1)
                    .orElse(1);

        String storedName = UUID.randomUUID() + "_v" + newVersionNumber + "_" + request.getFileName();
        String uploadUrl = fileStorageService.generatePresignedUploadUrl(storedName);

        FileVersion version = FileVersion.builder()
                .file(driveFile)
                .versionNumber(newVersionNumber)
                .storedName(storedName)
                .size(request.getSize())
                .contentType(request.getContentType())
                .status(UploadStatus.UPLOADING)
                .build();
        
        FileVersion saved = fileVersionRepository.save(version);

        return InitiateUploadResponse.builder()
                .fileId(saved.getId())
                .uploadUrl(uploadUrl)
                .storedName(storedName)
                .build();
    }

    @CacheEvict( value = {"my-files", "file-search"}, allEntries = true)
    public FileVersionResponse completeVersionUpload(Long versionId) throws Exception {
        User currentUser = userService.getCurrentUser();

        FileVersion version = fileVersionRepository.findById(versionId)
                    .orElseThrow();

        if (!version.getFile().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (version.getStatus() != UploadStatus.UPLOADING) {
            throw new IllegalStateException("Version is not in UPLOADING status");
        }

        version.setStatus(UploadStatus.PENDING_SCAN);
        FileVersion saved = fileVersionRepository.save(version);

        activityLogService.log(currentUser, ActivityType.VERSION_UPLOAD, 
            "Uploaded version: " + saved.getVersionNumber() + " for file " + version.getFile().getOriginalName());
        log.info("User {} uploaded file version {} (pending scan)", currentUser.getId(), saved.getId());

        // Trigger Async Scan for Version
        scanVersionFileAsync(saved.getId());

        return mapVersionResponse(saved);
    }

    @Async
    public void scanVersionFileAsync(Long versionId) {
        try {
            FileVersion version = fileVersionRepository.findById(versionId).orElse(null);
            if (version == null) {
                log.warn("Version {} not found for async scan", versionId);
                return;
            }

            log.info("Starting async virus scan for version {} of file {}", version.getId(), version.getFile().getId());

            try (java.io.InputStream is = fileStorageService.download(version.getStoredName())) {
                virusScanService.scan(is);
                
                version.setStatus(UploadStatus.CLEAN);
                fileVersionRepository.save(version);
                log.info("Version {} scanned CLEAN", version.getId());
                
                sseService.sendScanResult(version.getFile().getOwner().getId(), version.getFile().getId(), "CLEAN");
            } catch (VirusDetectedException ex) {
                log.error("Virus detected in version {}!", version.getId());
                version.setStatus(UploadStatus.VIRUS_DETECTED);
                fileVersionRepository.save(version);

                activityLogService.log(version.getFile().getOwner(), ActivityType.VIRUS_BLOCKED, 
                    "Blocked malicious version: " + version.getVersionNumber() + " of file " + version.getFile().getOriginalName());
                
                sseService.sendScanResult(version.getFile().getOwner().getId(), version.getFile().getId(), "VIRUS_DETECTED");

                try {
                    fileStorageService.delete(version.getStoredName());
                    log.info("Deleted malicious version binary {} from storage", version.getStoredName());
                } catch (Exception deleteEx) {
                    log.error("Failed to delete malicious version: {}", version.getStoredName(), deleteEx);
                }
            }
        } catch (Exception e) {
            log.error("Error during async scan for version {}", versionId, e);
        }
    }

    // For File Version
    public List<FileVersionResponse> getVersions(Long fileId){

        User currentUser = userService.getCurrentUser();

        DriveFile driveFile = fileRepository.findById(fileId)
        .orElseThrow();

        if(!driveFile.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        return fileVersionRepository.findByFileIdOrderByVersionNumberDesc(fileId)
                .stream()
                .map(this::mapVersionResponse)
                .toList();
    }

    private FileVersionResponse mapVersionResponse(FileVersion version){

        return FileVersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .size(version.getSize())
                .contentType(version.getContentType())
                .createdAt(version.getCreatedAt())
                .status(version.getStatus())
                .build();

    }

    public FileVersion getVersion(Long versionId){

        User currentUser = userService.getCurrentUser();

        FileVersion version = fileVersionRepository.findById(versionId)
                        .orElseThrow();

        if(!version.getFile().getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        if (version.getStatus() != UploadStatus.CLEAN) {
            throw new FileNotAvailableException("Version file is not available. Status: " + version.getStatus());
        }

        return version;
    }

    public void restoreVersion(Long versionId) {
        
        User currentUser = userService.getCurrentUser();

        FileVersion version = fileVersionRepository.findById(versionId)
                    .orElseThrow();

        if(!version.getFile().getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        if (version.getStatus() != UploadStatus.CLEAN) {
            throw new FileNotAvailableException("Cannot restore version that is not clean.");
        }

        DriveFile file = version.getFile();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }
        
        file.setStoredName(version.getStoredName());
        file.setSize(version.getSize());
        file.setContentType(version.getContentType());
        fileRepository.save(file);

        activityLogService.log(currentUser, ActivityType.VERSION_RESTORE, "Restored version " + version.getVersionNumber() + " of " + file.getOriginalName());
    }

    public PresignedUrlResponse generatePresignedDownloadUrl(Long fileId) throws Exception{

        User currentUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                        .orElseThrow();

        if(!file.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        String url = fileStorageService.generatePresignedUrl(file.getStoredName());

        return PresignedUrlResponse.builder()
                        .url(url)
                        .expiresInMinutes(15)
                        .build();
    }

    private void scanFile(MultipartFile file, User currentUser)throws Exception{
        try{
            virusScanService.scan(file);
        }catch(VirusDetectedException ex){
            activityLogService.log(currentUser, ActivityType.VIRUS_BLOCKED, "Blocked malicious upload: " + file.getOriginalFilename());
            throw ex;
        }
    }

}

