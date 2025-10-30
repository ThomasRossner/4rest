# Test Accounts for Development

## Quick Start: Create Your First Account

Since there are no default users in the database, you have two options:

### Option 1: Register via API (Easiest)

Make sure your backend is running (`cd backend && npm run dev`), then:

```bash
# Using curl (or use Postman/Thunder Client)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "guest"
  }'
```

Or use the helper script:
```bash
# In WSL
wsl bash database/create-test-user.sh
```

### Option 2: Register via Frontend

1. Start the frontend: `cd frontend && npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Register" 
4. Fill in:
   - Email: `test@example.com`
   - Password: `Test123!`
   - Name: `Test User`
   - Role: `guest`

## Recommended Test Accounts

Create these accounts for testing different user roles:

### Guest User
- **Email:** `test@example.com`
- **Password:** `Test123!`
- **Role:** `guest`
- **Use for:** Testing guest features, task completion, rewards

### Employee User
- **Email:** `employee@example.com`
- **Password:** `Test123!`
- **Role:** `employee`
- **Use for:** Testing employee features, HotelKit integration

### Stakeholder User
- **Email:** `stakeholder@example.com`
- **Password:** `Test123!`
- **Role:** `stakeholder`
- **Use for:** Testing stakeholder dashboard, global statistics

## Login Credentials

After registration, use these credentials to login:

**All test accounts use the same password:** `Test123!`

You can login via:
- Frontend: `http://localhost:3000/login`
- API: `POST http://localhost:5000/api/auth/login`

## Quick Test User Creation Script

To create all test users at once, you can create a simple script or use the registration endpoint multiple times.

**Note:** Make sure your database migrations have been run first!
```bash
# In WSL
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker exec -it roots-postgres psql -U roots_user -d roots_of_impact -f database/migrations/001_initial_schema.sql"
```

## Seeding an Example Task

Add a ready-to-complete QR task to the database:

```bash
# In WSL (from project root)
wsl bash -c "cd /mnt/c/Users/werner/Documents/roots-of-impact && docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/seed_example_task.sql"
```

This creates a task:
- **title**: Bring your reusable bottle
- **type**: qr
- **points**: 20
- **qr_code**: QR-LOBBY-WATER-001
