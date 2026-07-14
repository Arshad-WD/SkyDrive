package com.skydrive.skydrive.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.skydrive.skydrive.entity.DriveFile;

public interface FileRepository extends JpaRepository<DriveFile, Long> {
   List<DriveFile> findByOwnerId(Long ownerId);
   List<DriveFile> findByFolderId(Long folderId);
   List<DriveFile> findByFolderIdAndDeletedFalse(Long folderId);
   List<DriveFile> findByOwnerIdAndOriginalNameContainingIgnoreCase(Long ownerId,String keyword);

   List<DriveFile> findByOwnerIdAndDeletedFalse(Long ownerId);
   List<DriveFile> findByOwnerIdAndDeletedTrue(Long ownerId);

   Long countByOwnerId(Long ownerId);

   List<DriveFile> findByOwnerIdAndDeletedFalseAndOriginalNameContainingIgnoreCase(Long ownerId, String keyword);

   @Query("""
         SELECT COALESCE(SUM(f.size),0)
         FROM DriveFile f
         WHERE f.owner.id =:userId
         AND f.deleted = false
         """)
   Long getUsedStorage(Long userId);

   List<DriveFile> findByDeletedTrueAndDeletedAtBefore(LocalDateTime date);

   List<DriveFile> findByStatusAndUploadedAtBefore(com.skydrive.skydrive.entity.UploadStatus status, LocalDateTime date);
}
