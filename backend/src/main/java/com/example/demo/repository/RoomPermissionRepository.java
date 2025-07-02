package com.example.demo.repository;

import com.example.demo.model.RoomPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomPermissionRepository extends JpaRepository<RoomPermission, UUID> {
    
    List<RoomPermission> findByRoomId(UUID roomId);
    
    List<RoomPermission> findByUserId(UUID userId);
    
    Optional<RoomPermission> findByRoomIdAndUserId(UUID roomId, UUID userId);
    
    void deleteByRoomId(UUID roomId);
    
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
} 