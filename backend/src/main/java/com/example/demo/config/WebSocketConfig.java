package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker
        config.enableSimpleBroker("/topic");
        
        // Set prefix for controller mapped methods
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix for directed messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the WebSocket endpoints
        registry
                .addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
                .setSessionCookieNeeded(true);
                
        registry.addEndpoint("/ws/room/{roomId}")
                .setAllowedOrigins("http://localhost:3000");
    }
    
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        // Increase message size limits for images
        registry.setMessageSizeLimit(8192 * 1024); // 8MB
        registry.setSendBufferSizeLimit(8192 * 1024); // 8MB
        registry.setSendTimeLimit(20000); // 20 seconds
    }
} 