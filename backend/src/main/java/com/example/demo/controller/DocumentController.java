package com.example.demo.controller;

import com.example.demo.dto.DocumentCreateRequest;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.dto.DocumentUpdateRequest;
import com.example.demo.model.DocumentType;
import com.example.demo.service.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms/{roomId}/documents")
public class DocumentController {
    
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    
    private final DocumentService documentService;
    
    @Autowired
    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }
    
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAllDocuments(@PathVariable UUID roomId) {
        logger.info("Getting all documents for room: {}", roomId);
        
        List<DocumentResponse> documents = documentService.getAllDocumentsInRoom(roomId);
        return ResponseEntity.ok(documents);
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocumentById(
            @PathVariable UUID roomId, 
            @PathVariable UUID documentId) {
        logger.info("Getting document {} in room {}", documentId, roomId);
        
        Optional<DocumentResponse> documentOpt = documentService.getDocument(documentId);
        
        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DocumentResponse document = documentOpt.get();
        if (!document.getRoomId().equals(roomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // For binary content, don't include it in the response directly
        // Client should call the /image endpoint to get the actual binary data
        if (document.getBinaryContent() != null && document.getBinaryContent().length > 0) {
            // Set a flag to indicate there's binary content available
            document.setContent("BINARY_CONTENT_AVAILABLE");
            document.setBinaryContent(null); // Don't send binary data in JSON
            logger.info("Document {} has binary content. Image data not included in response", documentId);
        }
        
        return ResponseEntity.ok(document);
    }
    
    @PostMapping
    public ResponseEntity<DocumentResponse> createDocument(
            @PathVariable UUID roomId,
            @Valid @RequestBody DocumentCreateRequest request) {
        logger.info("Creating document {} in room {}", request.getName(), roomId);
        
        Optional<DocumentResponse> documentOpt = documentService.createDocument(roomId, request);
        
        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(documentOpt.get());
    }
    
    @PostMapping("/upload-image")
    public ResponseEntity<DocumentResponse> uploadImage(
            @PathVariable UUID roomId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam(value = "createdById", required = false) UUID createdById,
            @RequestParam(value = "createdByUsername", required = false) String createdByUsername) {
        
        logger.info("Uploading image {} in room {}", name, roomId);
        
        try {
            DocumentCreateRequest request = DocumentCreateRequest.builder()
                    .name(name)
                    .type(DocumentType.freeform) // Default to freeform for images
                    .createdById(createdById)
                    .createdByUsername(createdByUsername)
                    .contentType(file.getContentType())
                    .binaryContent(file.getBytes())
                    .build();
            
            Optional<DocumentResponse> documentOpt = documentService.createDocument(roomId, request);
            
            if (documentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(documentOpt.get());
        } catch (IOException e) {
            logger.error("Error reading uploaded file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable UUID roomId,
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentUpdateRequest request) {
        logger.info("Updating document {} in room {}", documentId, roomId);
        
        Optional<DocumentResponse> documentOpt = documentService.updateDocument(documentId, request);
        
        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DocumentResponse document = documentOpt.get();
        if (!document.getRoomId().equals(roomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(document);
    }
    
    @PutMapping(value = "/{documentId}/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> updateDocumentWithImage(
            @PathVariable UUID roomId,
            @PathVariable UUID documentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "updatedById", required = false) UUID updatedById,
            @RequestParam(value = "updatedByUsername", required = false) String updatedByUsername) {
        
        logger.info("Updating document {} with image in room {}", documentId, roomId);
        
        try {
            DocumentUpdateRequest request = DocumentUpdateRequest.builder()
                    .name(name)
                    .updatedById(updatedById)
                    .updatedByUsername(updatedByUsername)
                    .contentType(file.getContentType())
                    .binaryContent(file.getBytes())
                    .build();
            
            Optional<DocumentResponse> documentOpt = documentService.updateDocument(documentId, request);
            
            if (documentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            DocumentResponse document = documentOpt.get();
            if (!document.getRoomId().equals(roomId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(document);
        } catch (IOException e) {
            logger.error("Error reading uploaded file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping(value = "/{documentId}/image", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getDocumentImage(
            @PathVariable UUID roomId,
            @PathVariable UUID documentId) {
        logger.info("Getting image for document {} in room {}", documentId, roomId);
        
        Optional<DocumentResponse> documentOpt = documentService.getDocument(documentId);
        
        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DocumentResponse document = documentOpt.get();
        if (!document.getRoomId().equals(roomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        if (document.getBinaryContent() == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity
            .ok()
            .contentType(MediaType.parseMediaType(document.getContentType() != null ? 
                document.getContentType() : MediaType.IMAGE_JPEG_VALUE))
            .body(document.getBinaryContent());
    }
    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID roomId,
            @PathVariable UUID documentId) {
        logger.info("Deleting document {} in room {}", documentId, roomId);
        
        // Check if document exists and belongs to room first
        Optional<DocumentResponse> document = documentService.getDocument(documentId);
        if (document.isEmpty() || !document.get().getRoomId().equals(roomId)) {
            return ResponseEntity.notFound().build();
        }
        
        boolean deleted = documentService.deleteDocument(documentId);
        return deleted ? 
                ResponseEntity.noContent().build() : 
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
} 