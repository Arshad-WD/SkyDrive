package com.skydrive.skydrive.dto.folder;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderResponse {
    
    private Long id;
    private String name;
    private Long parentFolderId;
    private LocalDateTime createdAt;
}
