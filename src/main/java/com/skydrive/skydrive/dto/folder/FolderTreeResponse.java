package com.skydrive.skydrive.dto.folder;

import java.util.ArrayList;
import java.util.List;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderTreeResponse {
    
    private Long id;

    private String name;

    @Builder.Default
    private List<FolderTreeResponse> children = new ArrayList<>();
}
