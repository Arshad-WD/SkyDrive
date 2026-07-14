package com.skydrive.skydrive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.skydrive.skydrive.dto.PresignedUrlResponse;
import com.skydrive.skydrive.dto.file.FileResponse;
import com.skydrive.skydrive.dto.file.FileVersionResponse;
import com.skydrive.skydrive.dto.file.MoveFileRequest;
import com.skydrive.skydrive.dto.file.ShareLinkResponse;
import com.skydrive.skydrive.dto.file.ShareSettingsRequest;
import com.skydrive.skydrive.entity.DriveFile;
import com.skydrive.skydrive.entity.FileVersion;
import com.skydrive.skydrive.service.FileService;
import com.skydrive.skydrive.storage.FileStorageService;

import com.skydrive.skydrive.dto.file.InitiateUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateUploadResponse;
import com.skydrive.skydrive.dto.file.InitiateVersionUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateChunkedUploadRequest;
import com.skydrive.skydrive.dto.file.InitiateChunkedUploadResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    
    private final FileService fileService;
    private final FileStorageService fileStorageService;


    @PostMapping("/upload")
    public FileResponse uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam("folderId") Long folderId) throws Exception {
            return fileService.uploadFile(
                file, 
                folderId
            );
        }

    @PostMapping("/upload/initiate")
    public InitiateUploadResponse initiateUpload(@Valid @RequestBody InitiateUploadRequest request) throws Exception {
        return fileService.initiateUpload(request);
    }

    @PostMapping("/upload/complete")
    public FileResponse completeUpload(@RequestParam("fileId") Long fileId) throws Exception {
        return fileService.completeUpload(fileId);
    }

    @PostMapping("/versions/initiate")
    public InitiateUploadResponse initiateVersionUpload(@Valid @RequestBody InitiateVersionUploadRequest request) throws Exception {
        return fileService.initiateVersionUpload(request);
    }

    @PostMapping("/versions/complete")
    public FileVersionResponse completeVersionUpload(@RequestParam("versionId") Long versionId) throws Exception {
        return fileService.completeVersionUpload(versionId);
    }

    @PostMapping("/upload/initiate-chunked")
    public InitiateChunkedUploadResponse initiateChunkedUpload(@Valid @RequestBody InitiateChunkedUploadRequest request) throws Exception {
        return fileService.initiateChunkedUpload(request);
    }

    @PostMapping("/upload/complete-chunked")
    public FileResponse completeChunkedUpload(@RequestParam("fileId") Long fileId, @RequestParam("totalChunks") Integer totalChunks) throws Exception {
        return fileService.completeChunkedUpload(fileId, totalChunks);
    }

    @GetMapping
    public List<FileResponse> getMyFiles(){
        return fileService.getMyFiles();
    }
    
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long id
    ) throws Exception {

        DriveFile fileEntity =
                fileService.getFile(id);

        byte[] content =
                fileStorageService
                        .download(
                                fileEntity.getStoredName()
                        )
                        .readAllBytes();

        return ResponseEntity.ok()
                .contentType(
                        org.springframework.http.MediaType
                                .parseMediaType(
                                        fileEntity.getContentType()
                                )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                fileEntity.getOriginalName() +
                                "\""
                )
                .body(content);
    }

    @GetMapping("/folder/{folderId}")
    public List<FileResponse> getFolderFiles(@PathVariable Long folderId){
        return fileService.getFilesByFolder(folderId);
    }

    @PutMapping("/{id}/move")
    public FileResponse moveFile( @PathVariable Long id, @Valid @RequestBody MoveFileRequest request){
        return fileService.moveFile(id, request.getTargetFolderId());
    }

    @GetMapping("/search")
    public List<FileResponse> searchFiles(@RequestParam String keyword){
        return fileService.searchFiles(keyword);
    }

    @DeleteMapping("/{id}")
    public void moveToTrash(@PathVariable Long id){
        fileService.moveToTrash(id);
    }

    @PutMapping("/{id}/restore")
    public void restoreFile(@PathVariable Long id){
        fileService.restoreFile(id);
    }

    @GetMapping("trash")
    public List<FileResponse> getTrash(){
        return fileService.getTrashFiles();
    }

    @DeleteMapping("/{id}/permanent")
    public void permanentDelete(@PathVariable Long id) throws Exception{
        fileService.permanentlyDelete(id);
    }

    @PostMapping("/{id}/share")
    public ShareLinkResponse shareLink(@PathVariable Long id){
        return fileService.generateShareLink(id);
    }

    @PutMapping("/{id}/share-settings")
    public ShareLinkResponse updateShareSettings(@PathVariable Long id, @RequestBody ShareSettingsRequest request) {
        return fileService.updateShareSettings(id, request);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<org.springframework.core.io.Resource> previewFile(@PathVariable Long id) throws Exception {
        DriveFile fileEntity = fileService.getFile(id);

        java.io.InputStream inputStream = fileStorageService.download(fileEntity.getStoredName());
        org.springframework.core.io.Resource resource = new org.springframework.core.io.InputStreamResource(inputStream) {
            @Override
            public long contentLength() {
                return fileEntity.getSize();
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileEntity.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileEntity.getOriginalName() + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/versions")
    public FileVersionResponse uploadVersion(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception{

        return fileService.uploadNewVersion(id, file);
    }

    @GetMapping("/{id}/versions")
    public List<FileVersionResponse> getVersions(@PathVariable Long id){
        return fileService.getVersions(id);
    }

    @GetMapping("/versions/{versionId}/donwload")
    public ResponseEntity<byte[]> donwloadVersion(@PathVariable Long versionId) throws Exception {
        FileVersion version = fileService.getVersion(versionId);

        byte[] content = fileStorageService.download(version.getStoredName())
                .readAllBytes();
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                            version.getContentType()
                )
            ).header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"version-" + version.getVersionNumber() + "\"" ).body(content);
    }

    @PutMapping("/versions/{versionId}/restore")
    public void restoreVersion(@PathVariable Long versionId){
        fileService.restoreVersion(versionId);
    }

    @GetMapping("/{id}/presigned")
    public PresignedUrlResponse generatPresignedUrl(@PathVariable Long id) throws Exception{

        return fileService.generatePresignedDownloadUrl(id);
    }
}
