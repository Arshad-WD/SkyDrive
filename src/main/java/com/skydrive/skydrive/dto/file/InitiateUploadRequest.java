package com.skydrive.skydrive.dto.file;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InitiateUploadRequest {
    @NotBlank
    private String fileName;
    
    @NotNull
    private Long folderId;
    
    @NotNull
    private Long size;
    
    @NotBlank
    private String contentType;
}
