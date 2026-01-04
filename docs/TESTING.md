# Testing Guide

## Test Structure

```
backend/
  src/
    __tests__/
      services/
      controllers/
      middleware/

frontend/
  src/
    __tests__/
      components/
      services/
      utils/
```

## Running Tests

### All Tests
```bash
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:ui           # UI mode
npm run test:coverage     # With coverage
```

### Backend Tests
```bash
cd backend
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

## Test Categories

### Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Fast execution
- High coverage target: 80%+

### Integration Tests
- Test interactions between components
- Use test database
- Test API endpoints end-to-end
- Test database queries

### E2E Tests
- Test complete user flows
- Use real browser
- Test across multiple pages
- Test offline functionality

## Key Test Scenarios

### Authentication
- User registration
- User login
- JWT token validation
- Password hashing
- Token refresh

### Tasks
- Video task completion
- Quiz answer validation
- QR code scanning
- Photo upload validation
- Points calculation

### Gamification
- Tree planting logic
- Points accumulation
- Level progression
- Achievement unlocking

### Rewards
- Reward redemption
- Voucher generation
- Points deduction
- Balance verification

### Statistics
- CO₂ calculation accuracy
- Statistics aggregation
- Real-time updates
- Cache invalidation

## Test Data Setup

Create test fixtures for:
- Sample users (guest, employee, stakeholder)
- Sample tasks (all types)
- Sample rewards
- Sample completions

## Continuous Integration

Recommended CI/CD pipeline:
1. Run tests on every commit
2. Run linting
3. Build Docker images
4. Run integration tests
5. Deploy to staging if all tests pass
