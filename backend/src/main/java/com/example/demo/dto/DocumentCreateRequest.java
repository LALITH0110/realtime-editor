package com.example.demo.dto;

import com.example.demo.model.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for creating a new document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCreateRequest {
    
    @NotBlank(message = "Document name is required")
    @Size(min = 1, max = 100, message = "Document name must be between 1 and 100 characters")
    private String name;
    
    @NotNull(message = "Document type is required")
    private DocumentType type;
    
    private String content; // Optional initial content
    
    private UUID createdById; // Optional, for authenticated users
    
    private String createdByUsername; // Username of creator
    
    private String contentType; // For identifying content type (e.g., "image/png", "image/jpeg")
    
    private byte[] binaryContent; // For binary data like images
} 