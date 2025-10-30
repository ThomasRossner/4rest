# Local Development Setup

## Quick Start (Without Docker for Backend/Frontend)

For local development, it's often easier to run the backend and frontend directly while only using Docker for databases:

### Option 1: Database Only with Docker

1. **Start only PostgreSQL and Redis:**
   ```bash
   # In WSL
   wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker-compose -f docker-compose.dev.yml up -d"
   ```

2. **Set up environment variables:**
   
   Create `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://roots_user:roots_password@localhost:5432/roots_of_impact
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=development-secret-change-in-production
   CORS_ORIGIN=http://localhost:3000
   ```
   
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start backend (in terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start frontend (in terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

### Option 2: Full Docker (All Services)

If you want to run everything in Docker:

```bash
# In WSL
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker-compose up -d"
```

**Note:** This requires fixing TypeScript compilation errors first.

## Troubleshooting

### Docker not available
- Make sure Docker Desktop is running on Windows
- Verify Docker is installed in WSL: `wsl docker --version`

### Port conflicts
- If port 5432 is already in use, change it in docker-compose.yml
- If port 5000 is in use, change backend port in docker-compose.yml and .env files

### Database connection issues
- Ensure PostgreSQL container is healthy: `docker ps`
- Check database logs: `docker logs roots-postgres`

### TypeScript errors
The backend has some TypeScript errors that need to be fixed before building:
- JWT sign method type issues
- Missing properties in User type
- WebSocket event handling types

For development, you can skip the build step and use `tsx watch` directly.

## Database Setup

After starting PostgreSQL:

```bash
# Connect to database
wsl bash -c "docker exec -it roots-postgres psql -U roots_user -d roots_of_impact"

# Or run migrations
cd backend
npm run migrate
```

## Services URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
