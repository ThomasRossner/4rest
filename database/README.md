# Database Setup

## Prerequisites
- PostgreSQL 14+ installed and running
- Database created: `roots_of_impact`

## Running Migrations

1. Set up your database connection string in `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/roots_of_impact
   ```

2. Run the migration:
   ```bash
   cd backend
   npm run migrate
   ```

   Or manually:
   ```bash
   psql -U your_user -d roots_of_impact -f migrations/001_initial_schema.sql
   ```

## Schema Overview

- **users**: User accounts and authentication
- **tasks**: Available sustainability tasks/challenges
- **user_tasks**: Task completion tracking
- **rewards**: Available rewards and benefits
- **reward_redemptions**: Reward redemption history
- **forest_trees**: Virtual forest tree placements
- **statistics**: Cached statistics for performance
