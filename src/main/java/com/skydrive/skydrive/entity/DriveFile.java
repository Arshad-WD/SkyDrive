package com.skydrive.skydrive.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriveFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originalName;
    private String storedName;
    private String contentType;
    private Long size;
    private String storagePath;

    @ManyToOne
    @JoinColumn(name="owner_id")
    private User owner;

    @ManyToOne
    @JoinColumn(name="folder_id")
    private Folder folder;

    private Boolean deleted;

    @Enumerated(EnumType.STRING)
    private UploadStatus status;

    private LocalDateTime uploadedAt;

    private LocalDateTime deletedAt; 

    @PrePersist
    public void prePersist(){
        uploadedAt = LocalDateTime.now();

        if(deleted == null){
            deleted = false;
        }
        if(status == null){
            status = UploadStatus.CLEAN;
        }
    }


    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL)

    private List<FileVersion> versions;
    

}
