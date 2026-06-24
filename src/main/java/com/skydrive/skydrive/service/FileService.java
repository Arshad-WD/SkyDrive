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
import com.skydrive.skydrive.dto.file.ShareSettingsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

    public DriveFile getFile(Long fileId){
        
        User curretUser = userService.getCurrentUser();

        DriveFile file = fileRepository.findById(fileId)
                    .orElseThrow();

        if(!file.getOwner().getId().equals(curretUser.getId())) {
            throw new AccessDeniedException("Access denied");
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
                .createdAt(version.getCreatedAt())
                .build();

    }

    public FileVersion getVersion(Long versionId){

        User currentUser = userService.getCurrentUser();

        FileVersion version = fileVersionRepository.findById(versionId)
                        .orElseThrow();

        if(!version.getFile().getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
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

