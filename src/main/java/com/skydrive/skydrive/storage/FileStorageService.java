package com.skydrive.skydrive.storage;

import java.io.InputStream;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    
    String upload(MultipartFile file) throws Exception;
    String upload(String objectName, InputStream inputStream, long size, String contentType) throws Exception;
    InputStream download(String objectName) throws Exception;
    
    void delete(String objectName) throws Exception;

    String generatePresignedUrl(String objectName) throws Exception;

    String generatePresignedUploadUrl(String objectName) throws Exception;
}
