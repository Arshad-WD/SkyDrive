package com.skydrive.skydrive.dto.activity;

import java.time.LocalDateTime;

import com.skydrive.skydrive.entity.ActivityType;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    
    private ActivityType activityType;
    private String description;
    private LocalDateTime createdAt;

}
