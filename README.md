# CollabEdge - Collaborative Real-Time Editing Platform

CollabEdge is a collaborative real-time editing platform that allows multiple users to edit documents simultaneously. It supports various document types including code, word processing, presentations, spreadsheets, and more.

## Features

- **Real-time collaboration**: Multiple users can edit documents simultaneously
- **Multiple editor types**: Support for code, word processing, presentations, spreadsheets, and freeform editing
- **Room-based collaboration**: Create or join rooms with optional password protection
- **Document history**: Track changes with document revision history
- **Responsive design**: Works on desktop and mobile devices
- **Dark theme**: Modern dark UI for reduced eye strain

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Tailwind CSS, Shadcn/UI
- **Real-time Communication**: WebSockets

### Backend
- **Framework**: Spring Boot 3.x with Java 17
- **Database**: PostgreSQL
- **Real-time Communication**: WebSocket (STOMP)
- **API**: RESTful API with JSON

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Database Migration**: SQL scripts

## Project Structure

```
CollabEdge/
├── frontend/              # Next.js frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   └── ...
├── backend/               # Spring Boot backend application
│   ├── src/               # Java source code
│   │   ├── main/
│   │   │   ├── java/      # Backend Java code
│   │   │   └── resources/ # Configuration files
│   │   └── test/          # Test code
│   ├── db/                # Database scripts
│   │   └── setup.sql      # Initial database setup
│   └── ...
└── docker-compose.yml     # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Java 17+
- Maven
- Docker and Docker Compose
- PostgreSQL (if running outside Docker)

### Setting Up the Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/collabedge.git
   cd collabedge
   ```

2. **Start the database and backend using Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will start PostgreSQL and the Spring Boot backend.

3. **Initialize the database**

   The database should be automatically initialized, but if you need to manually run the setup script:

   ```bash
   ./setup_db.sh
   ```

4. **Start the frontend development server**

   ```bash
   cd frontend
   npm install # or pnpm install
   npm run dev # or pnpm dev
   ```

5. **Access the application**

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

1. **Build the backend**

   ```bash
   cd backend
   ./mvnw clean package
   ```

2. **Build the frontend**

   ```bash
   cd frontend
   npm run build # or pnpm build
   ```

3. **Deploy using Docker Compose**

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## API Documentation

### Room API

- `GET /api/rooms` - List all rooms
- `GET /api/rooms/{roomId}` - Get room by ID
- `GET /api/rooms/key/{roomKey}` - Get room by room key
- `POST /api/rooms` - Create a new room
- `POST /api/rooms/join` - Join an existing room

### Document API

- `GET /api/rooms/{roomId}/documents` - List all documents in a room
- `GET /api/rooms/{roomId}/documents/{documentId}` - Get a specific document
- `POST /api/rooms/{roomId}/documents` - Create a new document
- `PUT /api/rooms/{roomId}/documents/{documentId}` - Update a document
- `DELETE /api/rooms/{roomId}/documents/{documentId}` - Delete a document

### WebSocket Endpoints

- `/ws` - Main WebSocket connection endpoint
- `/topic/rooms/{roomId}` - Room-specific updates
- `/topic/documents/{documentId}` - Document-specific updates
- `/app/documents/{documentId}/update` - Send document updates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created as a demonstration of real-time collaborative editing capabilities.
- Special thanks to all open-source projects that made this possible. 