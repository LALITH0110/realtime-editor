package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for sending user-related messages over WebSocket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMessage {
    
    private String type; // USER_JOINED, USER_LEFT, USERS_LIST
    private String username;
    private List<String> users;
    private Long timestamp = System.currentTimeMillis();
    
} 