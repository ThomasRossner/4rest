# 4rester

A gamification-based sustainability platform connecting hotel guests, employees, and global stakeholders through a virtual forest experience.

## Project Overview

4rester encourages sustainable actions through gamification. Each completed task grows a personal tree in a virtual forest, creating both individual progress and collective impact.

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
- Docker and Docker Compose (optional, for containerized setup)

### Installation

#### Option 1: Docker (Recommended)

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The Docker setup includes:
- **Postgres Container**: PostgreSQL 15 database
- **Backend Container**: Node.js backend API (port 5001)
- **Frontend Container**: React development server (port 3000)
- **Redis Container**: Redis cache (port 6379)

#### Option 2: Local Development

```bash
# Install all dependencies
npm run install:all

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
cd backend && npm run migrate

# Start development servers
npm run dev
```

### GitHub OAuth Setup

To enable GitHub social login:

1. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set Authorization callback URL to: `http://localhost:5000/api/auth/github/callback` (development)
   - For production, use your production backend URL

2. Add environment variables to `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
   FRONTEND_URL=http://localhost:3000
   SESSION_SECRET=your_session_secret_key
   ```

3. Run the database migration to add OAuth support (if not already done):
   ```bash
   cd backend && npm run migrate
   ```

For detailed setup instructions, see [docs/GITHUB_OAUTH_SETUP.md](docs/GITHUB_OAUTH_SETUP.md).

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
