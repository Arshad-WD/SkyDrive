package com.skydrive.skydrive.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skydrive.skydrive.entity.Folder;

public interface FolderRepository extends JpaRepository<Folder, Long> {
   List<Folder> findByOwnerId(Long ownerId);
   List<Folder> findByParentFolderId(Long parentId);
}
