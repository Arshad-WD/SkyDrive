package com.skydrive.skydrive.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skydrive.skydrive.entity.User;

public interface UserRepository extends JpaRepository <User, Long> {
    Optional<User> findByEmail(String email);
}
