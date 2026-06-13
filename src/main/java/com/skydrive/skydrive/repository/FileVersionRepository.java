package com.skydrive.skydrive.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skydrive.skydrive.entity.FileVersion;

public interface FileVersionRepository extends JpaRepository<FileVersion, Long>{

    List<FileVersion> findByFileIdOrderByVersionNumberDesc(Long fileId);
    Optional<FileVersion> findTopByFileIdOrderByVersionNumberDesc(Long fileId);

}
