package com.skydrive.skydrive.dto.file;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedFileInfoResponse {
    private String originalName;
    private long size;
    private String contentType;
    private String ownerName;
    private boolean isPublic;
    private boolean authRequired; // Whether guest user must log in to view
    private boolean allowed;      // Whether the current requester is authorized to view
}
