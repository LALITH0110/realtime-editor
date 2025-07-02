package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.dto.DocumentUpdateMessage;
import com.example.demo.dto.DocumentUpdateRequest;
import com.example.demo.dto.UserMessage;
import com.example.demo.service.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class DocumentWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(DocumentWebSocketController.class);
    
    // We'd normally use a service to handle this, but for simplicity we'll do it here
    private final Map<String, List<String>> roomUsers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> documentContents = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;
    private final DocumentService documentService;
    
    @Autowired
    public DocumentWebSocketController(SimpMessagingTemplate messagingTemplate, DocumentService documentService) {
        this.messagingTemplate = messagingTemplate;
        this.documentService = documentService;
    }
    
    @MessageMapping("/room/{roomId}/join")
    @SendTo("/topic/room/{roomId}")
    public UserMessage joinRoom(@DestinationVariable String roomId, 
                                @Payload UserMessage message,
                                SimpMessageHeaderAccessor headerAccessor) {
        
        logger.info("User {} joined room {}", message.getUsername(), roomId);
        
        // Add username to web socket session
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("username", message.getUsername());
            headerAccessor.getSessionAttributes().put("roomId", roomId);
        }
        
        // Add user to the room
        roomUsers.computeIfAbsent(roomId, k -> new ArrayList<>()).add(message.getUsername());
        message.setType("USER_JOINED");
        
        // Send the current users list to the new user
        sendUsersList(roomId);
        
        // Send the current document state to the newly joined user
        sendLatestDocumentState(roomId);
        
        return message;
    }
    
    @MessageMapping("/room/{roomId}/leave")
    @SendTo("/topic/room/{roomId}")
    public UserMessage leaveRoom(@DestinationVariable String roomId, 
                               @Payload UserMessage message) {
        
        logger.info("User {} left room {}", message.getUsername(), roomId);
        
        // Remove user from room
        if (roomUsers.containsKey(roomId)) {
            roomUsers.get(roomId).remove(message.getUsername());
        }
        
        message.setType("USER_LEFT");
        
        // Send updated user list
        sendUsersList(roomId);
        
        return message;
    }
    
    @MessageMapping("/room/{roomId}/document/update")
    @SendTo("/topic/room/{roomId}/document")
    public DocumentUpdateMessage updateDocument(@DestinationVariable String roomId,
                                              @Payload DocumentUpdateMessage message,
                                              SimpMessageHeaderAccessor headerAccessor) {
        
        logger.info("Document update in room {} for document {}", roomId, message.getDocumentId());
        
        // Store latest content in memory cache
        documentContents.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                .put(message.getDocumentId(), message.getContent());
                
        // Save the document content to the database
        try {
            // Try to parse the document ID as a UUID
            UUID documentId = UUID.fromString(message.getDocumentId());
            DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
            
            if (message.getContentType() != null && message.getContentType().startsWith("image/")) {
                updateRequest.setContentType(message.getContentType());
                updateRequest.setBinaryContent(message.getBinaryContent());
                logger.debug("Received binary content with type {}", message.getContentType());
            } else {
                updateRequest.setContent(message.getContent());
                logger.debug("Received text content of length {}", message.getContent() != null ? message.getContent().length() : 0);
            }
            
            // Set username if available in session
            if (headerAccessor.getSessionAttributes() != null && headerAccessor.getSessionAttributes().get("username") != null) {
                updateRequest.setUpdatedByUsername(headerAccessor.getSessionAttributes().get("username").toString());
            }
            
            // Update the document in the database
            Optional<?> updated = documentService.updateDocument(documentId, updateRequest);
            
            if (updated.isPresent()) {
                logger.info("Successfully updated document {} in room {}", message.getDocumentId(), roomId);
                
                // Return update message with type field for WebSocket clients
                // Create a new DocumentUpdateMessage with TYPE field for backwards compatibility
                DocumentUpdateMessage responseMessage = new DocumentUpdateMessage();
                responseMessage.setDocumentId(message.getDocumentId());
                responseMessage.setContent(message.getContent());
                responseMessage.setContentType(message.getContentType());
                responseMessage.setBinaryContent(message.getBinaryContent());
                responseMessage.setUsername(message.getUsername());
                
                // Ensure all clients get the update
                broadcastDocumentUpdate(roomId, responseMessage);
                
                return responseMessage;
            } else {
                logger.warn("Failed to update document {} in room {}", message.getDocumentId(), roomId);
            }
        } catch (IllegalArgumentException e) {
            // This happens if the document ID is not a valid UUID
            // This is expected for documents that haven't been saved to the database yet
            logger.debug("Document {} in room {} not yet saved to database", message.getDocumentId(), roomId);
        } catch (Exception e) {
            logger.error("Error updating document {} in room {}: {}", message.getDocumentId(), roomId, e.getMessage());
        }
        
        return message;
    }
    
    private void sendUsersList(String roomId) {
        List<String> users = roomUsers.getOrDefault(roomId, new ArrayList<>());
        
        UserMessage message = new UserMessage();
        message.setType("USERS_LIST");
        message.setUsers(users);
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/users", message);
    }
    
    private void sendLatestDocumentState(String roomId) {
        if (documentContents.containsKey(roomId)) {
            Map<String, String> roomDocuments = documentContents.get(roomId);
            
            // Send each document's latest content to clients
            for (Map.Entry<String, String> entry : roomDocuments.entrySet()) {
                String documentId = entry.getKey();
                String content = entry.getValue();
                
                DocumentUpdateMessage message = new DocumentUpdateMessage();
                message.setDocumentId(documentId);
                message.setContent(content);
                message.setUsername("System");
                
                messagingTemplate.convertAndSend("/topic/room/" + roomId + "/document", message);
            }
        }
    }
    
    private void broadcastDocumentUpdate(String roomId, DocumentUpdateMessage message) {
        // Store the update in our cache
        documentContents.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                .put(message.getDocumentId(), message.getContent());
                
        // Send to all clients subscribed to this room
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/document", message);
        
        // Log the broadcast
        logger.debug("Broadcasted document update for {} in room {} to all clients", 
                message.getDocumentId(), roomId);
    }
} 