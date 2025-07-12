package com.example.demo.controller;

import com.example.demo.config.JwtAuthenticationFilter;
import com.example.demo.dto.RoomCreateRequest;
import com.example.demo.dto.RoomJoinRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:3000")
public class RoomController {
    
    private static final Logger logger = LoggerFactory.getLogger(RoomController.class);
    
    private final RoomService roomService;
    
    @Autowired
    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }
    
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        List<RoomResponse> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }
    
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable UUID roomId) {
        Optional<RoomResponse> room = roomService.getRoomById(roomId);
        return room.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/key/{roomKey}")
    public ResponseEntity<RoomResponse> getRoomByKey(@PathVariable String roomKey) {
        Optional<RoomResponse> room = roomService.getRoomByKey(roomKey);
        return room.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/access/{roomKey}")
    public ResponseEntity<RoomResponse> checkRoomAccess(@PathVariable String roomKey) {
        logger.info("Checking room access for key: {}", roomKey);
        
        // This endpoint requires authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails)) {
            logger.warn("Unauthenticated request to access endpoint for room {}", roomKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        JwtAuthenticationFilter.JwtUserDetails userDetails = 
            (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
        UUID userId = userDetails.getUserId();
        
        logger.info("Checking access for user {} ({}) to room {}", userDetails.getUsername(), userId, roomKey);
        
        Optional<RoomResponse> room = roomService.getAccessibleRoom(roomKey, userId);
        return room.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }
    
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        logger.info("Creating room: {}", request.getName());
        
        // Check if user is authenticated and set createdById
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails userDetails = 
                (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
            request.setCreatedById(userDetails.getUserId());
            logger.info("Setting room creator to authenticated user: {} ({})", userDetails.getUsername(), userDetails.getUserId());
        }
        
        RoomResponse createdRoom = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoom);
    }
    
    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@Valid @RequestBody RoomJoinRequest request) {
        logger.info("Joining room with key: {}", request.getRoomKey());
        
        // Check if user is authenticated and set userId
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails userDetails = 
                (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
            request.setUserId(userDetails.getUserId());
            logger.info("Setting joining user to authenticated user: {} ({})", userDetails.getUsername(), userDetails.getUserId());
        }
        
        Optional<RoomResponse> room = roomService.joinRoom(request);
        if (room.isPresent()) {
            return ResponseEntity.ok(room.get());
        } else {
            // Return proper JSON error response
            logger.warn("Failed to join room {}: Invalid room key or incorrect password", request.getRoomKey());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new java.util.HashMap<String, String>() {{
                        put("error", "Invalid room key or incorrect password");
                    }});
        }
    }
} 