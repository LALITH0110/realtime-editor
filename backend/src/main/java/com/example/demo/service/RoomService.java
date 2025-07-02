package com.example.demo.service;

import com.example.demo.dto.RoomCreateRequest;
import com.example.demo.dto.RoomJoinRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.Room;
import com.example.demo.model.User;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoomService {
    
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public RoomService(
            RoomRepository roomRepository,
            UserRepository userRepository,
            DocumentRepository documentRepository,
            PasswordEncoder passwordEncoder) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
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
        
        return mapToDto(savedRoom);
    }
    
    @Transactional
    public Optional<RoomResponse> joinRoom(RoomJoinRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomKey(request.getRoomKey());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            
            // Check password if required
            if (room.getIsPasswordProtected() && 
                (request.getPassword() == null || !validatePassword(request.getPassword(), room))) {
                return Optional.empty();
            }
            
            return Optional.of(mapToDto(room));
        }
        
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
} 