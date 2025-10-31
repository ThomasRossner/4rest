# Roots of Impact

A gamification-based sustainability platform connecting hotel guests, employees, and global stakeholders through a virtual forest experience.

## Project Overview

Roots of Impact encourages sustainable actions through gamification. Each completed task grows a personal tree in a virtual forest, creating both individual progress and collective impact.

## Architecture

- **Frontend**: React.js PWA with Three.js for 3D forest visualization
- **Backend**: Node.js/Express RESTful API
- **Database**: PostgreSQL with Redis caching
- **Integrations**: HotelKit API, external voucher systems

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Install all dependencies
npm run install:all

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

### Project Structure

```
roots-of-impact/
├── frontend/          # React PWA application
├── backend/           # Express API server
├── database/          # Database migrations and schemas
├── docs/              # Documentation and diagrams
│   └── architecture/  # PlantUML architecture diagrams
└── infrastructure/    # Docker and deployment configs
```

### Architecture Diagrams

PlantUML diagrams are available in `docs/architecture/`:
- System Overview
- Database Schema
- API Sequence Flows
- Component Diagram
- Deployment Diagram
- User Journey
- Integration Flows

See `docs/README.md` for details on viewing the diagrams.

## Development

- Frontend runs on `http://localhost:3000`
- Backend API runs on `http://localhost:5000`

## Testing

```bash
# Run all tests
npm run test

# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && npm run test

# E2E tests
npm run test:e2e
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

Key steps:
1. Set up production environment variables
2. Run database migrations
3. Build production images
4. Deploy using Docker or cloud platform
5. Verify deployment and monitoring

## License

Proprietary - Hotel Luise Project
