package com.example.demo.repository;

import com.example.demo.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    
    Optional<Room> findByRoomKey(String roomKey);
    
    boolean existsByRoomKey(String roomKey);
    
    List<Room> findByCreatedById(UUID userId);
    
    @Query("SELECT DISTINCT r FROM Room r JOIN r.permissions p WHERE p.user.id = :userId")
    List<Room> findRoomsByUserPermissions(@Param("userId") UUID userId);
} 