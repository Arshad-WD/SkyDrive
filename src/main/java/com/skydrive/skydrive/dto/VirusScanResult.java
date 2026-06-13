package com.skydrive.skydrive.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VirusScanResult {
    
    private boolean clean;
    private String message;
    
}
