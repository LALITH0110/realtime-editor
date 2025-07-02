package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for updating an existing document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUpdateRequest {
    
    @Size(min = 1, max = 100, message = "Document name must be between 1 and 100 characters")
    private String name; // Optional - only updated if provided
    
    private String content; // Optional - only updated if provided
    
    private UUID updatedById; // Optional, for authenticated users
    
    private String updatedByUsername; // Username of updater
    
    private String contentType; // For identifying content type (e.g., "image/png", "image/jpeg")
    
    private byte[] binaryContent; // For binary data like images
} 