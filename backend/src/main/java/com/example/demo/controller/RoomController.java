package com.example.demo.controller;

import com.example.demo.dto.RoomCreateRequest;
import com.example.demo.dto.RoomJoinRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        logger.info("Creating room: {}", request.getName());
        
        RoomResponse createdRoom = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoom);
    }
    
    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@Valid @RequestBody RoomJoinRequest request) {
        logger.info("Joining room with key: {}", request.getRoomKey());
        
        Optional<RoomResponse> room = roomService.joinRoom(request);
        return room.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
} 