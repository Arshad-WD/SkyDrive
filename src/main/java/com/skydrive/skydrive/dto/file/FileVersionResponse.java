package com.skydrive.skydrive.dto.file;

import com.skydrive.skydrive.entity.UploadStatus;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileVersionResponse {
    
    private Long id;
    private Integer versionNumber;
    private Long size;
    private String contentType;
    private LocalDateTime createdAt;
    private UploadStatus status;
}
