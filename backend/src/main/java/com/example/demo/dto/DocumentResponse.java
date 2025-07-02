package com.example.demo.dto;

import com.example.demo.model.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * DTO for document data sent to clients
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID roomId;
    private String name;
    private DocumentType type;
    private String content;
    private UUID createdById;
    private String createdByUsername;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private int revisionCount;
    private String contentType;
    private byte[] binaryContent;
} 