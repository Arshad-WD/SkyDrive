package com.skydrive.skydrive.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skydrive.skydrive.dto.activity.ActivityLogResponse;
import com.skydrive.skydrive.service.ActivityLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {
    
    private final ActivityLogService activityLogService;

    @GetMapping
    public List<ActivityLogResponse> getActivities(){
        return activityLogService.getMyActivity();
    }
}
