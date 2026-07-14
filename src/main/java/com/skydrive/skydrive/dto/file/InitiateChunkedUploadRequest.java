package com.skydrive.skydrive.dto.file;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InitiateChunkedUploadRequest {
    @NotBlank
    private String fileName;
    
    @NotNull
    private Long folderId;
    
    @NotNull
    private Long size;
    
    @NotBlank
    private String contentType;
    
    @NotNull
    private Integer totalChunks;
}
