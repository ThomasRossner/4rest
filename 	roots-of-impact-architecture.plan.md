# Architecture Plan: Roots of Impact

## Overview

Roots of Impact is a gamification-based sustainability platform connecting hotel guests, employees, and global stakeholders through a virtual forest. Each sustainable action grows a personal tree and contributes to a collective forest.

## System Architecture

### 1. Frontend Layer (WebApp)

**Technology Stack:**

- Progressive Web App (PWA) for mobile-first experience
- React.js or Vue.js framework (or native Bubble.io if chosen)
- Three.js/WebGL for 3D virtual forest visualization
- Service Worker for offline QR code functionality

**Key Components:**

- User dashboard with personal tree progress
- Virtual forest 3D viewer (polygon-based, tiled rendering)
- Task/Challenge interface (video players, quiz forms, photo upload)
- Points and rewards marketplace
- Statistics dashboard (CO₂ savings, team progress)
- Profile management (Gäste/Mitarbeitende/Stakeholder roles)

### 2. Backend Layer

**Technology Stack:**

- Node.js/Express or Python/FastAPI (if not using Bubble.io)
- RESTful API design
- Real-time capabilities with WebSockets for live forest updates

**Core Services:**

- **Authentication Service**: Social login (Google, Facebook) + email/password, role-based access (guest/employee/stakeholder)
- **Task Management Service**: CRUD for videos, quizzes, QR codes, photo challenges
- **Gamification Engine**: Points calculation, achievement tracking, level progression
- **Reward Service**: Voucher code generation/validation, benefit redemption
- **Statistics Service**: CO₂ calculations, progress aggregation, team metrics
- **Integration Service**: HotelKit API adapter, external voucher system connectors

### 3. Data Layer

**Database Architecture:**

- PostgreSQL or MongoDB for primary data storage
- Redis for caching (session data, leaderboards, forest state)

**Data Models:**

- Users (profiles, roles, authentication)
- Tasks (videos, quizzes, QR challenges, photo tasks)
- User Progress (points, completed tasks, personal forest state)
- Rewards (benefits catalog, voucher codes, redemption history)
- Virtual Forest (tiles, tree placement, collective visualization data)
- Statistics (CO₂ calculations, impact metrics, team aggregations)

### 4. Integration Layer

**External Systems:**

- HotelKit API integration (employee task synchronization)
- External voucher/benefit provider APIs
- Video hosting service (e.g., Vimeo, AWS S3 for custom videos)
- Analytics platform (optional: Google Analytics, Mixpanel)

**API Design:**

- Standard REST endpoints for all external integrations
- Webhook support for HotelKit event notifications
- API gateway pattern for rate limiting and security

### 5. Infrastructure & DevOps

**Deployment:**

- Cloud hosting (AWS, Azure, or DigitalOcean)
- Containerization with Docker
- CI/CD pipeline for automated deployments

**Performance:**

- CDN for static assets and video content
- Load balancing for high availability
- Database replication for scalability
- Asset optimization (polygon-based 3D models with LOD)

### 6. Security & Compliance

- GDPR-compliant data handling (encryption at rest and in transit)
- User consent management
- Data anonymization for forest visualization
- Secure API authentication (JWT tokens)
- Regular security audits

### 7. Technical Specifications

**Virtual Forest Visualization:**

- 3D engine: Three.js with WebGL
- Rendering: Polygon-based tiles (chunked loading for performance)
- Storage: Forest state as JSON data structure
- Updates: Incremental tree placement, real-time sync via WebSockets

**Task System:**

- Video task format: Embedded video player + quiz interface
- QR codes: Generate unique codes per location/task, offline scanning with sync
- Photo tasks: Image upload with validation, cloud storage (S3/Azure Blob)

**Mobile Optimization:**

- Responsive design (mobile-first)
- Touch-optimized 3D controls
- Service Worker for offline QR functionality
- PWA manifest for app-like experience

## File Structure (if custom development)

```
roots-of-impact/
├── frontend/
│   ├── src/
│   │   ├── components/ (UI components)
│   │   ├── pages/ (routes)
│   │   ├── services/ (API clients)
│   │   ├── 3d/ (Three.js forest visualization)
│   │   └── utils/ (helpers)
│   └── public/ (static assets)
├── backend/
│   ├── api/ (REST endpoints)
│   ├── services/ (business logic)
│   ├── models/ (data models)
│   ├── integrations/ (HotelKit, vouchers)
│   └── middleware/ (auth, validation)
├── database/
│   └── migrations/ (schema definitions)
└── infrastructure/
    ├── docker/ (container configs)
    └── deployment/ (CI/CD scripts)
```

## Alternative: Bubble.io Implementation

If using Bubble.io as mentioned in the requirements:

- Custom API connectors for HotelKit and voucher systems
- External database via API for complex queries
- Custom JavaScript plugins for 3D forest visualization
- Bubble workflows for task management and gamification logic

## Phased Implementation Approach

1. **Phase 1**: Core authentication, basic task system, simple 2D forest visualization
2. **Phase 2**: 3D forest, QR code system, reward integration
3. **Phase 3**: HotelKit integration, advanced statistics, team features
4. **Phase 4**: Scale optimizations, NFT integration (optional), multi-tenant support

## Implementation Status

✅ **All Core Tasks Completed**

- [x] Set up frontend framework (React/Vue) with PWA capabilities and Three.js integration
- [x] Develop RESTful API backend with authentication, task management, and gamification services
- [x] Design and implement database schema for users, tasks, progress, rewards, and forest data
- [x] Implement 3D virtual forest visualization with tiled rendering and tree placement system
- [x] Build task types: video quizzes, QR code challenges, and photo upload functionality
- [x] Integrate external voucher/benefit provider APIs and build redemption system
- [x] Develop HotelKit API adapter for employee task synchronization
- [x] Implement CO₂ calculation engine and statistics dashboard with real-time updates
- [x] Implement GDPR-compliant data handling, encryption, and user consent management
- [x] Optimize for mobile devices with offline QR functionality and responsive 3D controls

### Completed Features Summary

**Frontend:**
- React PWA with Vite build system
- Three.js 3D forest visualization
- Task components (Video, QR Code, Photo)
- Statistics dashboard with real-time updates
- GDPR consent management UI
- Service Worker for offline functionality

**Backend:**
- Express.js REST API with TypeScript
- JWT authentication system
- Task management with quiz validation
- Photo upload with Multer
- HotelKit integration with sync and webhooks
- Voucher system with external API support
- CO₂ tracking engine
- Statistics service with caching
- GDPR routes (export, deletion, consent)

**Database:**
- PostgreSQL schema with migrations
- GDPR consent table
- External ID tracking for integrations
- Statistics cache tables

**Integrations:**
- HotelKit API adapter (task sync, completion tracking)
- External voucher providers (with fallback)
- Real-time statistics updates

**Compliance:**
- User consent management
- Data export functionality
- Data anonymization on deletion
- GDPR-compliant data handling

All planned features from the architecture plan have been successfully implemented and are ready for deployment.
