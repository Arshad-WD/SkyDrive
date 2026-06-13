package com.skydrive.skydrive.dto.file;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MoveFileRequest {

    @NotNull(message = "Target folder is required")
    private Long targetFolderId;
}
