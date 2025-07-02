package com.example.demo.service;

import com.example.demo.dto.DocumentCreateRequest;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.DocumentUpdateRequest;
import com.example.demo.model.Document;
import com.example.demo.model.DocumentRevision;
import com.example.demo.model.Room;
import com.example.demo.model.User;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.DocumentRevisionRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final DocumentRevisionRepository revisionRepository;
    
    @Autowired
    public DocumentService(
            DocumentRepository documentRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            DocumentRevisionRepository revisionRepository) {
        this.documentRepository = documentRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.revisionRepository = revisionRepository;
    }
    
    public List<DocumentResponse> getAllDocumentsInRoom(UUID roomId) {
        List<Document> documents = documentRepository.findByRoomId(roomId);
        return documents.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    public Optional<DocumentResponse> getDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .map(this::mapToDto);
    }
    
    @Transactional
    public Optional<DocumentResponse> createDocument(UUID roomId, DocumentCreateRequest request) {
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        
        if (roomOpt.isPresent()) {
            Document document = new Document();
            document.setName(request.getName());
            document.setType(request.getType());
            document.setRoom(roomOpt.get());
            
            // Handle content based on content type
            if (request.getContentType() != null && request.getContentType().startsWith("image/")) {
                document.setContentBinary(request.getBinaryContent());
                document.setContent(null); // No text content for image documents
            } else {
                document.setContent(request.getContent());
                document.setContentBinary(null);
            }
            
            // Set creator if available
            if (request.getCreatedById() != null) {
                userRepository.findById(request.getCreatedById())
                        .ifPresent(document::setCreatedBy);
            }
            
            Document savedDocument = documentRepository.save(document);
            return Optional.of(mapToDto(savedDocument));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public Optional<DocumentResponse> updateDocument(UUID documentId, DocumentUpdateRequest request) {
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (documentOpt.isPresent()) {
            Document document = documentOpt.get();
            
            // Store the current content as a revision if text content is being updated
            if (document.getContent() != null && request.getContent() != null && 
                !document.getContent().equals(request.getContent())) {
                createRevision(document, request);
            }
            
            // Update document
            if (request.getName() != null) {
                document.setName(request.getName());
            }
            
            // Handle content update based on content type
            if (request.getContentType() != null && request.getContentType().startsWith("image/")) {
                document.setContentBinary(request.getBinaryContent());
                document.setContent(null); // Clear text content when setting an image
            } else if (request.getContent() != null) {
                document.setContent(request.getContent());
                document.setContentBinary(null); // Clear binary content when setting text
            }
            
            Document savedDocument = documentRepository.save(document);
            return Optional.of(mapToDto(savedDocument));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public boolean deleteDocument(UUID documentId) {
        if (documentRepository.existsById(documentId)) {
            documentRepository.deleteById(documentId);
            return true;
        }
        return false;
    }
    
    private DocumentResponse mapToDto(Document document) {
        long revisionCount = revisionRepository.countByDocumentId(document.getId());
        
        DocumentResponse dto = DocumentResponse.builder()
                .id(document.getId())
                .roomId(document.getRoom().getId())
                .name(document.getName())
                .type(document.getType())
                .content(document.getContent())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .revisionCount((int) revisionCount)
                .binaryContent(document.getContentBinary())
                .build();
                
        // Add creator info if available
        if (document.getCreatedBy() != null) {
            User creator = document.getCreatedBy();
            dto.setCreatedById(creator.getId());
            dto.setCreatedByUsername(creator.getUsername());
        }
        
        return dto;
    }
    
    private void createRevision(Document document, DocumentUpdateRequest request) {
        // Simple approach: store the full content as the diff
        // In a real app, we'd compute an actual JSON diff or use a library for this
        DocumentRevision revision = new DocumentRevision();
        revision.setDocument(document);
        revision.setContentDiff(document.getContent()); // Store previous content
        
        // Set revision number
        int nextRevisionNumber = revisionRepository.findMaxRevisionNumberByDocumentId(document.getId())
                .orElse(0) + 1;
        revision.setRevisionNumber(nextRevisionNumber);
        
        // Set user if available
        if (request.getUpdatedById() != null) {
            userRepository.findById(request.getUpdatedById())
                    .ifPresent(revision::setUser);
        }
        
        revisionRepository.save(revision);
    }
} 