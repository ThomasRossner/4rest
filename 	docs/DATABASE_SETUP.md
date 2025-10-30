# Database Setup Guide

## Quick Setup

### 1. Start PostgreSQL and Redis

```bash
# In WSL
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker-compose -f docker-compose.dev.yml up -d"
```

### 2. Verify Databases are Running

```bash
wsl bash -c "docker ps"
```

You should see `roots-postgres` and `roots-redis` containers running.

### 3. Create Backend .env File

```bash
# Run the setup script
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact/backend && bash setup-env.sh"
```

Or manually create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://roots_user:roots_password@localhost:5432/roots_of_impact
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

## Alternative: Direct SQL Migration

If the Node.js migration script doesn't work, you can run SQL directly:

```bash
# In WSL
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/001_initial_schema.sql"

wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/002_gdpr_consent.sql"
```

## Troubleshooting

### Password Authentication Failed

If you get "password authentication failed", check:

1. **Database credentials match** between:
   - `docker-compose.dev.yml` (POSTGRES_USER, POSTGRES_PASSWORD)
   - `backend/.env` (DATABASE_URL)

2. **Database is running**:
   ```bash
   docker ps | grep postgres
   ```

3. **Test connection manually**:
   ```bash
   docker exec -it roots-postgres psql -U roots_user -d roots_of_impact
   ```

### Connection Refused

If connection is refused, check:
- PostgreSQL container is healthy: `docker ps`
- Port 5432 is not blocked: `netstat -an | grep 5432`
- Database URL uses `localhost` (from WSL perspective)

### Migration Already Run

If migrations fail saying tables already exist:
- Check what tables exist: `docker exec -it roots-postgres psql -U roots_user -d roots_of_impact -c "\dt"`
- Drop and recreate if needed (⚠️ deletes all data):
  ```bash
  docker exec -it roots-postgres psql -U roots_user -d roots_of_impact -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  ```

## Database Credentials (Development)

- **User**: `roots_user`
- **Password**: `roots_password`
- **Database**: `roots_of_impact`
- **Host**: `localhost` (from backend)
- **Port**: `5432`
