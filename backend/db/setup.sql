-- CollabEdge Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_key VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_password_protected BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document types enum
CREATE TYPE document_type AS ENUM ('code', 'word', 'presentation', 'spreadsheet', 'freeform', 'custom');

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type document_type NOT NULL,
    created_by UUID REFERENCES users(id),
    content TEXT, -- For small to medium documents
    content_binary BYTEA, -- For larger binary content if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document revisions table for tracking changes
CREATE TABLE document_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content_diff TEXT NOT NULL, -- Store differences between versions
    revision_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create room_permissions table to track which users can access which rooms
CREATE TABLE room_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL, -- 'read', 'write', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (room_id, user_id)
);

-- Create room_visits table to track user access history
CREATE TABLE room_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    guest_name VARCHAR(50), -- For non-registered users
    ip_address VARCHAR(45),
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_user_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_room_updated_at BEFORE UPDATE
    ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_document_updated_at BEFORE UPDATE
    ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_documents_room_id ON documents(room_id);
CREATE INDEX idx_document_revisions_document_id ON document_revisions(document_id);
CREATE INDEX idx_room_permissions_room_id ON room_permissions(room_id);
CREATE INDEX idx_room_permissions_user_id ON room_permissions(user_id);
CREATE INDEX idx_room_visits_room_id ON room_visits(room_id);
CREATE INDEX idx_room_visits_user_id ON room_visits(user_id);

-- Add some sample data for testing
INSERT INTO users (username, email, password_hash) VALUES 
('admin', 'admin@example.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS'), -- password = admin
('user1', 'user1@example.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS'); -- password = admin

-- Sample room
INSERT INTO rooms (room_key, name, is_password_protected, created_by) 
SELECT 'ABC123', 'Sample Project', FALSE, id FROM users WHERE username = 'admin';

-- Add permission for admin
INSERT INTO room_permissions (room_id, user_id, permission_level)
SELECT r.id, u.id, 'admin' FROM rooms r, users u WHERE r.room_key = 'ABC123' AND u.username = 'admin';

-- Sample document
INSERT INTO documents (room_id, name, type, content, created_by)
SELECT r.id, 'Welcome Document', 'word', 'Welcome to CollabEdge! This is a sample document.', u.id
FROM rooms r, users u WHERE r.room_key = 'ABC123' AND u.username = 'admin'; 