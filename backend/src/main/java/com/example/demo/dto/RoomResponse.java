package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * DTO for room data sent to clients
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID id;
    private String roomKey;
    private String name;
    private boolean isPasswordProtected;
    private UUID createdById;
    private String createdByUsername;
    private ZonedDateTime createdAt;
    private int documentCount;
    private int userCount;
} 