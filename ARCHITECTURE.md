# Roots of Impact - Architecture Documentation

## System Overview

Roots of Impact is a gamification-based sustainability platform that connects hotel guests, employees, and stakeholders through a virtual forest experience. The system is built with a modern web stack supporting real-time updates and mobile-first design.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **3D Graphics**: Three.js with React Three Fiber
- **State Management**: Zustand with persistence
- **API Client**: Axios with React Query
- **PWA**: Vite PWA plugin for offline support
- **Styling**: CSS Modules

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Authentication**: JWT tokens
- **Real-time**: WebSockets (ws)
- **Validation**: Zod

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session data and leaderboards

## Architecture Layers

### 1. Frontend Layer
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── stores/         # Zustand state management
│   ├── services/       # API client services
│   ├── 3d/            # Three.js forest visualization
│   └── utils/         # Helper functions
```

**Key Features:**
- Progressive Web App (PWA) with offline QR code support
- 3D forest visualization using Three.js
- Mobile-first responsive design
- Real-time updates via WebSocket

### 2. Backend API Layer
```
backend/
├── src/
│   ├── routes/         # Express route definitions
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── middleware/     # Authentication, validation, error handling
│   ├── database/       # Database connection and queries
│   ├── integrations/   # External API adapters (HotelKit, Vouchers)
│   └── schemas/        # Zod validation schemas
```

**API Endpoints:**
- `/api/auth/*` - Authentication (login, register, refresh)
- `/api/tasks/*` - Task management (CRUD, completion)
- `/api/users/*` - User profiles and progress
- `/api/forest/*` - Virtual forest data
- `/api/rewards/*` - Rewards marketplace
- `/api/statistics/*` - Aggregated statistics

### 3. Data Layer

**PostgreSQL Tables:**
- `users` - User accounts and authentication
- `tasks` - Sustainability tasks/challenges
- `user_tasks` - Task completion tracking
- `rewards` - Available rewards catalog
- `reward_redemptions` - Redemption history
- `forest_trees` - Virtual forest tree placements

**Redis Cache:**
- Session data
- Leaderboard rankings
- Forest state snapshots
- Task completion rates

## Core Features

### 1. Task System
- **Video Tasks**: Short videos (30-60s) with follow-up quiz questions
- **QR Code Tasks**: Location-based challenges via QR code scanning
- **Photo Tasks**: User-submitted photos as proof of completion

### 2. Gamification Engine
- Points system for completed tasks
- Tree planting in virtual forest per completion
- Progress tracking and achievements
- Team challenges and leaderboards

### 3. Virtual Forest
- 3D visualization using Three.js
- Polygon-based trees with tiled rendering
- Real-time tree placement via WebSocket
- Anonymized collective forest view

### 4. Reward System
- Points-based redemption
- Integration with external voucher systems
- Benefits for employees (vacation days, team events)
- Discounts and perks for guests

### 5. Statistics & Impact
- CO₂ savings calculations
- Team progress metrics
- User engagement analytics
- Environmental impact visualization

## Integrations

### HotelKit Integration
- Sync employee tasks from HotelKit system
- Automatic task completion synchronization
- Employee benefit management

### External Voucher Systems
- Generate voucher codes via API
- Validate redeemed vouchers
- Support for multiple voucher providers

## Security & Compliance

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (guest/employee/stakeholder)

### GDPR Compliance
- User data encryption at rest and in transit
- Consent management
- Data anonymization for forest visualization
- Right to deletion support

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configuration

## Deployment

### Development
```bash
# Start all services
docker-compose up

# Or run individually
npm run dev
```

### Production
- Frontend: Static build deployed to CDN
- Backend: Containerized Node.js app with load balancing
- Database: Managed PostgreSQL with replication
- Cache: Managed Redis cluster

## Scalability Considerations

- **Database**: Connection pooling, read replicas
- **Cache**: Redis for frequently accessed data
- **CDN**: Static assets and video content
- **Load Balancing**: Multiple backend instances
- **Forest Rendering**: Chunked loading, LOD optimization

## Future Enhancements

- NFT integration for special achievements
- Multi-tenant support for multiple hotels
- Advanced analytics dashboard
- Social features (team collaboration)
- Mobile app (React Native)
