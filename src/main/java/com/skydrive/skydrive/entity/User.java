package com.skydrive.skydrive.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    private LocalDateTime createdAt;
    private Long storageLimit;

    @PrePersist
    public void prePresist(){
        createdAt = LocalDateTime.now();

        
        if(storageLimit == null){
            storageLimit = 1073741824L;
        }
    }

}

