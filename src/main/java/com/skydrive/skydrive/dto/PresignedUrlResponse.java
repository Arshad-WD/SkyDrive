package com.skydrive.skydrive.dto;

import lombok.*;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlResponse {
    
    private String url;
    private Integer expiresInMinutes;
}
