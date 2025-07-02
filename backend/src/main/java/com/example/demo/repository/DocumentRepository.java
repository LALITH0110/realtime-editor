package com.example.demo.repository;

import com.example.demo.model.Document;
import com.example.demo.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    
    List<Document> findByRoom(Room room);
    
    List<Document> findByRoomId(UUID roomId);
    
    long countByRoomId(UUID roomId);
} 