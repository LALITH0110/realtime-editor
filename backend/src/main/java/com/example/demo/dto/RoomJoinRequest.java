package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for joining an existing room
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomJoinRequest {
    
    @NotBlank(message = "Room key is required")
    @Size(min = 1, max = 10, message = "Room key must be between 1 and 10 characters")
    private String roomKey;
    
    private String password; // Optional, only required for password-protected rooms
    
    private String username; // Required for guest users
    
    private UUID userId; // Optional, for authenticated users
} 