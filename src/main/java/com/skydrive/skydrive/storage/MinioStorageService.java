package com.skydrive.skydrive.storage;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioStorageService implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public String upload(
            MultipartFile file
    ) throws Exception {

        String objectName =
                UUID.randomUUID()
                        + "_"
                        + file.getOriginalFilename();

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(
                                file.getInputStream(),
                                file.getSize(),
                                -1L
                        )
                        .contentType(
                                file.getContentType()
                        )
                        .build()
        );

        return objectName;
    }

    @Override
    public String upload(
            String objectName,
            InputStream inputStream,
            long size,
            String contentType
    ) throws Exception {

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(inputStream, size, -1L)
                        .contentType(contentType)
                        .build()
        );

        return objectName;
    }

    @Override
    public InputStream download(String objectName)
            throws Exception {

        return minioClient.getObject(
                io.minio.GetObjectArgs
                        .builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }

    @Override
    public void delete(String objectName)
            throws Exception {

        minioClient.removeObject(
                io.minio.RemoveObjectArgs
                        .builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }

        @Override
        public String generatePresignedUrl(String objectName) throws Exception{

                return minioClient.getPresignedObjectUrl(
                        io.minio.GetPresignedObjectUrlArgs
                                                .builder()
                                                .bucket(bucketName)
                                                .object(objectName)
                                                .method(io.minio.Http.Method.GET)
                                                .expiry(15, TimeUnit.MINUTES)
                                                .build()
                );
    }

    @Override
    public String generatePresignedUploadUrl(String objectName) throws Exception {
        return minioClient.getPresignedObjectUrl(
                io.minio.GetPresignedObjectUrlArgs
                        .builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .method(io.minio.Http.Method.PUT)
                        .expiry(15, TimeUnit.MINUTES)
                        .build()
        );
    }

}