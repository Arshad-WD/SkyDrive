package com.skydrive.skydrive.dto.file;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InitiateUploadResponse {
    private Long fileId;
    private String uploadUrl;
    private String storedName;
}
