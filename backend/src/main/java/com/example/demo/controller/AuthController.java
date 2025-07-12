package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.SignupRequest;
import com.example.demo.dto.UserInfo;
import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for email: {}", loginRequest.getEmail());

        try {
            // Find user by email
            Optional<User> userOpt = userService.findByEmail(loginRequest.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid email or password"));
            }

            User user = userOpt.get();

            // Validate password
            if (!userService.validatePassword(loginRequest.getPassword(), user)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid email or password"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getEmail());
            Date expirationDate = jwtUtil.getExpirationDateFromToken(token);
            ZonedDateTime expiresAt = expirationDate.toInstant().atZone(ZoneId.systemDefault());

            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .expiresAt(expiresAt)
                    .build();

            logger.info("User {} logged in successfully", user.getUsername());
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            logger.error("Error during login for email {}: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Login failed"));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
        logger.info("Signup attempt for username: {}, email: {}", 
                   signupRequest.getUsername(), signupRequest.getEmail());

        try {
            // Check if username already exists
            if (userService.existsByUsername(signupRequest.getUsername())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(createErrorResponse("Username is already taken"));
            }

            // Check if email already exists
            if (userService.existsByEmail(signupRequest.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(createErrorResponse("Email is already registered"));
            }

            // Create new user
            User newUser = userService.createUser(
                    signupRequest.getUsername(),
                    signupRequest.getEmail(),
                    signupRequest.getPassword()
            );

            // Generate JWT token
            String token = jwtUtil.generateToken(newUser.getId(), newUser.getUsername(), newUser.getEmail());
            Date expirationDate = jwtUtil.getExpirationDateFromToken(token);
            ZonedDateTime expiresAt = expirationDate.toInstant().atZone(ZoneId.systemDefault());

            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .userId(newUser.getId())
                    .username(newUser.getUsername())
                    .email(newUser.getEmail())
                    .expiresAt(expiresAt)
                    .build();

            logger.info("User {} registered and logged in successfully", newUser.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);

        } catch (Exception e) {
            logger.error("Error during signup for username {}: {}", signupRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Registration failed"));
        }
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token not provided"));
            }

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or expired token"));
            }

            // Extract user info from token
            String userId = jwtUtil.getUserIdFromToken(token);
            Optional<User> userOpt = userService.findById(java.util.UUID.fromString(userId));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            UserInfo userInfo = UserInfo.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();

            logger.debug("Token validated for user: {}", user.getUsername());
            return ResponseEntity.ok(userInfo);

        } catch (Exception e) {
            logger.error("Error during token validation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Token validation failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // For JWT-based auth, logout is handled client-side by removing the token
        // In a more sophisticated setup, you could maintain a blacklist of tokens
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        return errorResponse;
    }
} 