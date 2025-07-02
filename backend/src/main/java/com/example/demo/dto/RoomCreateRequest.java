package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for creating a new room
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomCreateRequest {
    
    @NotBlank(message = "Room name is required")
    @Size(min = 1, max = 100, message = "Room name must be between 1 and 100 characters")
    private String name;
    
    private String roomKey; // Optional, will be generated if not provided
    
    private boolean isPasswordProtected;
    
    private String password; // Only required if isPasswordProtected is true
    
    private UUID createdById; // Optional, for authenticated users
} 