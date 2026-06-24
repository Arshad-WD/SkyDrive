package com.skydrive.skydrive.dto.file;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareSettingsRequest {
    private boolean isPublic;
    private String allowedEmails;
}
