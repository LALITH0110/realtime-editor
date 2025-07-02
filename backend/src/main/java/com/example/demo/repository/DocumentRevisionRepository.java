package com.example.demo.repository;

import com.example.demo.model.DocumentRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRevisionRepository extends JpaRepository<DocumentRevision, UUID> {
    
    List<DocumentRevision> findByDocumentId(UUID documentId);
    
    List<DocumentRevision> findByDocumentIdOrderByRevisionNumberDesc(UUID documentId);
    
    long countByDocumentId(UUID documentId);
    
    @Query("SELECT MAX(dr.revisionNumber) FROM DocumentRevision dr WHERE dr.document.id = :documentId")
    Optional<Integer> findMaxRevisionNumberByDocumentId(@Param("documentId") UUID documentId);
    
    void deleteByDocumentId(UUID documentId);
} 