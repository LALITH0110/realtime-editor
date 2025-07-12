package com.example.demo.controller;

import com.example.demo.config.JwtAuthenticationFilter;
import com.example.demo.dto.RoomResponse;
import com.example.demo.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final RoomService roomService;

    @Autowired
    public UserController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getUserRooms() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !(authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails)) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }

            JwtAuthenticationFilter.JwtUserDetails userDetails = 
                (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
            
            UUID userId = userDetails.getUserId();
            logger.info("Getting rooms for user: {} ({})", userDetails.getUsername(), userId);

            List<RoomResponse> userRooms = roomService.getUserRooms(userId);
            
            logger.info("Found {} rooms for user {}", userRooms.size(), userDetails.getUsername());
            return ResponseEntity.ok(userRooms);

        } catch (Exception e) {
            logger.error("Error getting user rooms: {}", e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Failed to get user rooms"));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !(authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails)) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }

            JwtAuthenticationFilter.JwtUserDetails userDetails = 
                (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", userDetails.getUserId());
            profile.put("username", userDetails.getUsername());
            profile.put("email", userDetails.getEmail());
            
            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            logger.error("Error getting user profile: {}", e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Failed to get user profile"));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        return errorResponse;
    }
} 