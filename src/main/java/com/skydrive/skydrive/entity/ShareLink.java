package com.skydrive.skydrive.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "share_link")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLink {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;

    @OneToOne
    @JoinColumn(name = "file_id", unique = true)
    private DriveFile file;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    @Column(name = "is_public", nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean isPublic = true;

    @Column(columnDefinition = "TEXT")
    private String allowedEmails;

    @PrePersist
    public void prePersist(){
        createdAt = LocalDateTime.now();
    }
}
