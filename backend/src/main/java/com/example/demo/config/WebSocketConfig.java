package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.WebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Register plain WebSocket handlers for room connections
        registry.addHandler(roomWebSocketHandler(), "/ws/room/*")
                .setAllowedOrigins("*");
    }
    
    @Bean
    public WebSocketHandler roomWebSocketHandler() {
        return new RoomWebSocketHandler();
    }
} 