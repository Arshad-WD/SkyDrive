package com.skydrive.skydrive.dto.file;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InitiateChunkedUploadResponse {
    private Long fileId;
    private List<String> uploadUrls;
    private String storedName;
}
