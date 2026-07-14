package com.skydrive.skydrive.dto.file;

import com.skydrive.skydrive.entity.UploadStatus;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FileResponse {
    
    private Long id;
    private String originalName;
    private String contentType;
    private Long size;
    private UploadStatus status;
}
