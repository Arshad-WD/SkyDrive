package com.skydrive.skydrive.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="file_versions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileVersion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer versionNumber;
    private String storedName;
    private Long size;
    private String contentType;
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="file_id")
    private DriveFile file;

    @PrePersist
    public void prePersist(){
        createdAt = LocalDateTime.now();
    }
}
