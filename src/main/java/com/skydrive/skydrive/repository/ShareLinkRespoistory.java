package com.skydrive.skydrive.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skydrive.skydrive.entity.ShareLink;

public interface ShareLinkRespoistory extends JpaRepository<ShareLink, Long> {
    
    Optional<ShareLink> findByToken(String token);
    Optional<ShareLink> findByFileId(Long id);
}
