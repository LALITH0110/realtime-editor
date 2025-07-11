package com.example.demo.config;

import com.example.demo.dto.DocumentUpdateMessage;
import com.example.demo.dto.DocumentUpdateRequest;
import com.example.demo.service.DocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.*;

import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public class RoomWebSocketHandler implements WebSocketHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(RoomWebSocketHandler.class);
    
    // Store sessions by room ID
    private final Map<String, CopyOnWriteArraySet<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    
    // Store session metadata
    private final Map<String, String> sessionToRoom = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private DocumentService documentService;

    @Autowired
    public void setDocumentService(DocumentService documentService) {
        this.documentService = documentService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = extractRoomIdFromPath(session.getUri());
        if (roomId != null) {
            roomSessions.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
            sessionToRoom.put(session.getId(), roomId);
            
            logger.info("WebSocket connection established for room {} (session: {})", roomId, session.getId());
            
            // Send welcome message
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "type", "CONNECTED",
                "roomId", roomId,
                "message", "Connected to room " + roomId
            ))));
        } else {
            logger.warn("Invalid room path, closing connection: {}", session.getUri());
            session.close();
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        String roomId = sessionToRoom.get(session.getId());
        if (roomId == null) {
            logger.warn("No room associated with session {}", session.getId());
            return;
        }

        try {
            String payload = message.getPayload().toString();
            logger.debug("Received message in room {}: {}", roomId, payload.substring(0, Math.min(100, payload.length())));
            
            // Parse the message
            Map<String, Object> messageData = objectMapper.readValue(payload, Map.class);
            
            if (messageData.containsKey("documentId") && messageData.containsKey("content")) {
                handleDocumentUpdate(roomId, session, messageData);
            } else if ("JOIN".equals(messageData.get("type"))) {
                handleUserJoin(roomId, session, messageData);
            } else {
                // Broadcast other messages to all clients in the room
                broadcastToRoom(roomId, payload, session);
            }
            
        } catch (Exception e) {
            logger.error("Error handling message in room {}: {}", roomId, e.getMessage(), e);
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "type", "ERROR",
                "message", "Error processing message: " + e.getMessage()
            ))));
        }
    }

    private void handleDocumentUpdate(String roomId, WebSocketSession session, Map<String, Object> messageData) throws Exception {
        String documentIdStr = (String) messageData.get("documentId");
        String content = (String) messageData.get("content");
        String contentType = (String) messageData.get("contentType");
        
        logger.info("Document update in room {} for document {}", roomId, documentIdStr);
        
        // Try to save to database if it's a valid UUID
        try {
            UUID documentId = UUID.fromString(documentIdStr);
            DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
            
            if (contentType != null && contentType.startsWith("image/")) {
                updateRequest.setContentType(contentType);
                // Note: Binary content handling would need additional work
                logger.debug("Received image content type: {}", contentType);
            } else {
                updateRequest.setContent(content);
            }
            
            // Update the document in the database
            documentService.updateDocument(documentId, updateRequest);
            logger.debug("Successfully updated document {} in database", documentId);
            
        } catch (IllegalArgumentException e) {
            // Not a UUID, probably a temporary document
            logger.debug("Document {} not yet saved to database (temporary ID)", documentIdStr);
        } catch (Exception e) {
            logger.error("Error updating document {} in database: {}", documentIdStr, e.getMessage());
        }
        
        // Broadcast the update to all other clients in the room
        String updateMessage = objectMapper.writeValueAsString(messageData);
        broadcastToRoom(roomId, updateMessage, session);
    }
    
    private void handleUserJoin(String roomId, WebSocketSession session, Map<String, Object> messageData) throws Exception {
        String username = (String) messageData.get("username");
        logger.info("User {} joined room {}", username, roomId);
        
        // Broadcast join message to all clients in the room
        Map<String, Object> joinMessage = Map.of(
            "type", "USER_JOINED",
            "username", username,
            "roomId", roomId,
            "timestamp", System.currentTimeMillis()
        );
        
        broadcastToRoom(roomId, objectMapper.writeValueAsString(joinMessage), null);
    }

    private void broadcastToRoom(String roomId, String message, WebSocketSession excludeSession) {
        CopyOnWriteArraySet<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            sessions.forEach(session -> {
                if (session != excludeSession && session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(message));
                    } catch (Exception e) {
                        logger.error("Error sending message to session {} in room {}: {}", 
                                   session.getId(), roomId, e.getMessage());
                        // Remove broken session
                        sessions.remove(session);
                        sessionToRoom.remove(session.getId());
                    }
                }
            });
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String roomId = sessionToRoom.get(session.getId());
        logger.error("Transport error for session {} in room {}: {}", 
                   session.getId(), roomId, exception.getMessage());
        cleanupSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        String roomId = sessionToRoom.get(session.getId());
        logger.info("WebSocket connection closed for session {} in room {} (status: {})", 
                   session.getId(), roomId, closeStatus);
        
        cleanupSession(session);
        
        if (roomId != null) {
            // Notify other users about disconnection
            Map<String, Object> leaveMessage = Map.of(
                "type", "USER_LEFT",
                "sessionId", session.getId(),
                "roomId", roomId,
                "timestamp", System.currentTimeMillis()
            );
            
            broadcastToRoom(roomId, objectMapper.writeValueAsString(leaveMessage), null);
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
    
    private void cleanupSession(WebSocketSession session) {
        String roomId = sessionToRoom.remove(session.getId());
        if (roomId != null) {
            CopyOnWriteArraySet<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                    logger.info("Room {} is now empty, cleaned up", roomId);
                }
            }
        }
    }
    
    private String extractRoomIdFromPath(URI uri) {
        if (uri != null && uri.getPath() != null) {
            String path = uri.getPath();
            // Expected format: /ws/room/{roomId}
            String[] parts = path.split("/");
            if (parts.length >= 4 && "ws".equals(parts[1]) && "room".equals(parts[2])) {
                return parts[3];
            }
        }
        return null;
    }
} 