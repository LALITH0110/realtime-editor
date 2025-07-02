package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for document updates sent via WebSocket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUpdateMessage {
    private String documentId;
    private String content;
    private String username;
    private String contentType;
    private byte[] binaryContent;
} 