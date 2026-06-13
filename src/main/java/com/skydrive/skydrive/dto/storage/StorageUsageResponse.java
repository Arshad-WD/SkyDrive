package com.skydrive.skydrive.dto.storage;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageUsageResponse {
    
    private Long usedBytes;
    private Long limitBytes;
    private Long remainingBytes;
    private Double usedPercentage;
    
}
