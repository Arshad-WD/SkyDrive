package com.skydrive.skydrive.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.skydrive.skydrive.dto.activity.ActivityLogResponse;
import com.skydrive.skydrive.entity.ActivityLog;
import com.skydrive.skydrive.entity.ActivityType;
import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.repository.ActivityLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityLogService {
    
    
    private final ActivityLogRepository repository;
    private final UserService userService;

    public void log(User user, ActivityType type, String description){
        
        ActivityLog log = ActivityLog.builder()
                    .user(user)
                    .activityType(type)
                    .description(description)
                    .build();

        repository.save(log);
    }

    public List<ActivityLogResponse> getMyActivity(){

        User currentUser = userService.getCurrentUser();

        return repository.findByUserIdOrderByCreatedAtDesc(
            currentUser.getId()
        )
        .stream()
        .map(log ->
                ActivityLogResponse.builder()
                .activityType(
                    log.getActivityType()
                )
                .description(
                    log.getDescription()
                )
                .createdAt(
                    log.getCreatedAt()
                )
                .build()
        )
        .toList();
    }
}
