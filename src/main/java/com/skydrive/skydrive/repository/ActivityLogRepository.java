package com.skydrive.skydrive.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skydrive.skydrive.entity.ActivityLog;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long>{

    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);

}
