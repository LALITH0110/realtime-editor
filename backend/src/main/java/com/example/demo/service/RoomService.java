package com.example.demo.service;

import com.example.demo.dto.RoomCreateRequest;
import com.example.demo.dto.RoomJoinRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.Room;
import com.example.demo.model.RoomPermission;
import com.example.demo.model.User;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.RoomPermissionRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RoomService {
    
    private static final Logger logger = LoggerFactory.getLogger(RoomService.class);
    
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final RoomPermissionRepository roomPermissionRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public RoomService(
            RoomRepository roomRepository,
            UserRepository userRepository,
            DocumentRepository documentRepository,
            RoomPermissionRepository roomPermissionRepository,
            PasswordEncoder passwordEncoder) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.roomPermissionRepository = roomPermissionRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    public Optional<RoomResponse> getRoomById(UUID roomId) {
        return roomRepository.findById(roomId)
                .map(this::mapToDto);
    }
    
    public Optional<RoomResponse> getRoomByKey(String roomKey) {
        return roomRepository.findByRoomKey(roomKey)
                .map(this::mapToDto);
    }
    
    @Transactional
    public RoomResponse createRoom(RoomCreateRequest request) {
        Room room = new Room();
        room.setName(request.getName());
        
        // Generate a room key if not provided
        String roomKey = request.getRoomKey();
        if (roomKey == null || roomKey.isEmpty()) {
            roomKey = generateRoomKey();
        }
        room.setRoomKey(roomKey);
        
        // Set password if provided
        if (request.isPasswordProtected() && request.getPassword() != null && !request.getPassword().isEmpty()) {
            room.setIsPasswordProtected(true);
            room.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        } else {
            room.setIsPasswordProtected(false);
        }
        
        // Set creator if available
        if (request.getCreatedById() != null) {
            userRepository.findById(request.getCreatedById())
                    .ifPresent(room::setCreatedBy);
        }
        
        Room savedRoom = roomRepository.save(room);
        
        // Grant admin permission to the creator
        if (savedRoom.getCreatedBy() != null) {
            RoomPermission permission = new RoomPermission();
            permission.setRoom(savedRoom);
            permission.setUser(savedRoom.getCreatedBy());
            permission.setPermissionLevel("admin");
            roomPermissionRepository.save(permission);
        }
        
        return mapToDto(savedRoom);
    }
    
    @Transactional
    public Optional<RoomResponse> joinRoom(RoomJoinRequest request) {
        logger.info("Attempting to join room with key: {}", request.getRoomKey());
        Optional<Room> roomOpt = roomRepository.findByRoomKey(request.getRoomKey());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            logger.info("Found room {} ({}), password protected: {}", room.getName(), room.getId(), room.getIsPasswordProtected());
            
            // Check password if required
            if (room.getIsPasswordProtected()) {
                if (request.getPassword() == null || request.getPassword().isEmpty()) {
                    logger.warn("Password required for room {} but none provided", request.getRoomKey());
                    return Optional.empty();
                }
                
                if (!validatePassword(request.getPassword(), room)) {
                    logger.warn("Invalid password provided for room {}", request.getRoomKey());
                    return Optional.empty();
                }
                
                logger.info("Password validation successful for room {}", request.getRoomKey());
            }
            
            // Grant write permission to the joining user if they are authenticated
            if (request.getUserId() != null) {
                Optional<User> userOpt = userRepository.findById(request.getUserId());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    logger.info("Granting permissions to authenticated user {} for room {}", user.getUsername(), request.getRoomKey());
                    
                    // Check if user already has permission
                    Optional<RoomPermission> existingPermission = 
                        roomPermissionRepository.findByRoomIdAndUserId(room.getId(), user.getId());
                    
                    if (existingPermission.isEmpty()) {
                        // Grant write permission to the new user
                        RoomPermission permission = new RoomPermission();
                        permission.setRoom(room);
                        permission.setUser(user);
                        permission.setPermissionLevel("write");
                        roomPermissionRepository.save(permission);
                        logger.info("Granted write permission to user {} for room {}", user.getUsername(), request.getRoomKey());
                    } else {
                        logger.info("User {} already has {} permission for room {}", user.getUsername(), existingPermission.get().getPermissionLevel(), request.getRoomKey());
                    }
                }
            }
            
            logger.info("Successfully joined room {}", request.getRoomKey());
            return Optional.of(mapToDto(room));
        }
        
        logger.warn("Room not found with key: {}", request.getRoomKey());
        return Optional.empty();
    }
    
    private RoomResponse mapToDto(Room room) {
        long documentCount = documentRepository.countByRoomId(room.getId());
        
        RoomResponse dto = RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .roomKey(room.getRoomKey())
                .isPasswordProtected(room.getIsPasswordProtected())
                .createdAt(room.getCreatedAt())
                .documentCount((int) documentCount)
                .build();
                
        // Add creator info if available
        if (room.getCreatedBy() != null) {
            User creator = room.getCreatedBy();
            dto.setCreatedById(creator.getId());
            dto.setCreatedByUsername(creator.getUsername());
        }
        
        return dto;
    }
    
    private String generateRoomKey() {
        // Generate a 6-character alphanumeric room key
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        String roomKey;
        
        // Generate keys until we find an unused one
        do {
            sb.setLength(0);
            for (int i = 0; i < 6; i++) {
                int index = (int) (chars.length() * Math.random());
                sb.append(chars.charAt(index));
            }
            roomKey = sb.toString();
        } while (roomRepository.existsByRoomKey(roomKey));
        
        return roomKey;
    }
    
    private boolean validatePassword(String password, Room room) {
        return passwordEncoder.matches(password, room.getPasswordHash());
    }
    
    /**
     * Get all rooms accessible to a specific user
     * This includes rooms they created and rooms they have permissions for
     */
    public List<RoomResponse> getUserRooms(UUID userId) {
        try {
            // Get rooms created by the user
            List<Room> createdRooms = roomRepository.findByCreatedById(userId);
            
            // For now, just return created rooms to avoid the Hibernate lazy loading issue
            // TODO: Fix the query to properly fetch rooms with permissions
            return createdRooms.stream()
                    .map(this::mapToDto)
                    .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt())) // Most recent first
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching user rooms for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Check if an authenticated user has access to a room
     * This bypasses password protection for users who created the room or have permissions
     */
    public Optional<RoomResponse> getAccessibleRoom(String roomKey, UUID userId) {
        Optional<Room> roomOpt = roomRepository.findByRoomKey(roomKey);
        
        if (roomOpt.isEmpty()) {
            return Optional.empty();
        }
        
        Room room = roomOpt.get();
        
        // Check if user is the creator
        if (room.getCreatedBy() != null && room.getCreatedBy().getId().equals(userId)) {
            logger.info("User {} is the creator of room {}, granting access", userId, roomKey);
            return Optional.of(mapToDto(room));
        }
        
        // Check if user has existing permissions
        Optional<RoomPermission> permission = roomPermissionRepository.findByRoomIdAndUserId(room.getId(), userId);
        if (permission.isPresent()) {
            logger.info("User {} has {} permission for room {}, granting access", userId, permission.get().getPermissionLevel(), roomKey);
            return Optional.of(mapToDto(room));
        }
        
        // If user doesn't have access, they need to go through the join flow
        logger.info("User {} does not have direct access to room {}, must join through normal flow", userId, roomKey);
        return Optional.empty();
    }
} 