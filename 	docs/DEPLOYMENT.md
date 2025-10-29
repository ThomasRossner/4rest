# Deployment and Testing Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Set up production database (PostgreSQL)
- [ ] Configure Redis cache
- [ ] Set up environment variables for production
- [ ] Configure domain name and SSL certificates
- [ ] Set up CDN for static assets and video content
- [ ] Configure email service (for notifications)
- [ ] Set up monitoring and logging (CloudWatch, ELK, etc.)

### 2. Security Review
- [ ] Change all default passwords and API keys
- [ ] Review and update JWT secret keys
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly for production
- [ ] Review database connection security
- [ ] Enable database encryption at rest
- [ ] Set up backup strategy
- [ ] Review GDPR compliance measures

### 3. Database Migration
- [ ] Run database migrations on production database
- [ ] Verify all tables created successfully
- [ ] Create database indexes for performance
- [ ] Set up database backup procedures
- [ ] Test database connection pooling

### 4. Code Review
- [ ] Remove all debug logs and console statements
- [ ] Verify error handling is production-ready
- [ ] Check for hardcoded development URLs/credentials
- [ ] Review API rate limiting
- [ ] Verify input validation on all endpoints

## Testing Strategy

### 1. Unit Testing

**Frontend:**
```bash
cd frontend
npm run test
```

**Backend:**
```bash
cd backend
npm run test
```

**Key Areas to Test:**
- Component rendering
- Service functions
- API endpoint handlers
- Data validation
- Authentication logic
- Points calculation
- CO₂ savings calculations

### 2. Integration Testing

**Test Scenarios:**
- [ ] User registration and login flow
- [ ] Task completion flow (all types: video, QR, photo)
- [ ] Points system and tree planting
- [ ] Reward redemption flow
- [ ] HotelKit synchronization
- [ ] Statistics calculation
- [ ] GDPR data export/deletion

**Commands:**
```bash
# Start services for integration tests
docker-compose up -d

# Run integration tests
npm run test:integration
```

### 3. End-to-End (E2E) Testing

**Recommended Tool:** Playwright or Cypress

**Critical User Journeys:**
1. **Guest User:**
   - Register → Complete video task → View forest → Redeem reward
   
2. **Employee User:**
   - Login → HotelKit sync → Complete task → View statistics
   
3. **QR Code Task:**
   - Scan QR code → Offline storage → Sync when online
   
4. **Photo Task:**
   - Upload photo → Validation → Task completion

### 4. Performance Testing

**Areas to Test:**
- [ ] API response times (< 200ms for standard endpoints)
- [ ] Database query performance
- [ ] 3D forest rendering performance
- [ ] Page load times
- [ ] Concurrent user handling
- [ ] File upload performance

**Tools:** Apache JMeter, k6, or artillery.io

### 5. Security Testing

- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Rate limiting effectiveness
- [ ] Data encryption verification

### 6. Accessibility Testing

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Mobile touch targets
- [ ] ARIA labels

## Development Environment Setup

### Local Development

1. **Install Dependencies:**
```bash
npm run install:all
```

2. **Start Services with Docker:**
```bash
docker-compose up -d
```

3. **Run Database Migrations:**
```bash
cd backend
npm run migrate
```

4. **Start Development Servers:**
```bash
npm run dev
```

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/roots_of_impact
REDIS_URL=redis://host:6379
JWT_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://yourdomain.com
BASE_URL=https://api.yourdomain.com
HOTELKIT_API_URL=https://api.hotelkit.net
HOTELKIT_API_KEY=<your-key>
VOUCHER_API_URL=<voucher-provider-url>
VOUCHER_API_KEY=<your-key>
UPLOAD_DIR=/app/uploads
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Deployment Steps

### 1. Build Applications

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
cd backend
npm run build
# Output in backend/dist/
```

### 2. Docker Build

```bash
# Build production images
docker build -t roots-frontend:latest ./frontend
docker build -t roots-backend:latest ./backend

# Or use docker-compose
docker-compose -f docker-compose.prod.yml build
```

### 3. Database Migration (Production)

```bash
# Connect to production database
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/migrations/002_gdpr_consent.sql
```

### 4. Deploy to Production

**Option A: Docker Swarm/Kubernetes**
```bash
docker stack deploy -c docker-compose.prod.yml roots
```

**Option B: Cloud Platform (AWS/Azure/DigitalOcean)**
- Upload Docker images to container registry
- Deploy using cloud container service
- Configure load balancer and auto-scaling

**Option C: Traditional Server**
- Copy built files to server
- Install Node.js and PostgreSQL
- Set up PM2 or systemd service
- Configure nginx reverse proxy

### 5. Post-Deployment Verification

- [ ] Health check endpoint: `GET /health`
- [ ] Frontend accessible and loading
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Redis cache operational
- [ ] File uploads working
- [ ] Authentication flow working
- [ ] 3D forest rendering

## Production Environment Checklist

### Infrastructure
- [ ] Load balancer configured
- [ ] Auto-scaling groups set up
- [ ] Database replication configured
- [ ] Redis cluster configured
- [ ] CDN configured for static assets
- [ ] SSL certificates installed and auto-renewing

### Monitoring & Alerts
- [ ] Application monitoring (uptime, errors)
- [ ] Database monitoring (slow queries, connection pool)
- [ ] Server monitoring (CPU, memory, disk)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Log aggregation (CloudWatch, ELK)
- [ ] Alert notifications configured

### Backup Strategy
- [ ] Database automated backups (daily)
- [ ] Backup retention policy (30+ days)
- [ ] Disaster recovery plan documented
- [ ] Backup restoration tested

### Maintenance
- [ ] Update procedures documented
- [ ] Rollback procedures tested
- [ ] Scheduled maintenance windows
- [ ] Security patch procedures

## Testing Checklist

### Manual Testing
- [ ] Test user registration with various email formats
- [ ] Test login with correct/incorrect credentials
- [ ] Test video task completion with quiz
- [ ] Test QR code scanning (online and offline)
- [ ] Test photo upload (various formats, sizes)
- [ ] Test reward redemption
- [ ] Test forest visualization on different devices
- [ ] Test statistics dashboard
- [ ] Test GDPR data export
- [ ] Test GDPR data deletion

### Browser Testing
- [ ] Chrome (desktop and mobile)
- [ ] Firefox (desktop and mobile)
- [ ] Safari (desktop and mobile)
- [ ] Edge (desktop and mobile)

### Device Testing
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (iPad, Android tablets)
- [ ] Mobile (iOS and Android phones)
- [ ] Test offline functionality
- [ ] Test PWA installation

## Performance Optimization

### Frontend
- [ ] Enable code splitting
- [ ] Optimize images (WebP, compression)
- [ ] Minimize bundle size
- [ ] Enable gzip/brotli compression
- [ ] Configure CDN caching
- [ ] Optimize Three.js rendering (LOD, culling)

### Backend
- [ ] Enable database query caching
- [ ] Configure connection pooling
- [ ] Enable API response caching
- [ ] Optimize database indexes
- [ ] Enable compression middleware

## Rollback Plan

If deployment fails:
1. Stop new deployment
2. Revert to previous Docker images/version
3. Rollback database migrations if needed
4. Verify application is functioning
5. Investigate and fix issues
6. Schedule new deployment after fixes

## Next Steps Summary

### Immediate (Before First Deployment)
1. Set up production infrastructure
2. Configure all environment variables
3. Run database migrations
4. Deploy to staging environment
5. Perform comprehensive testing
6. Security review
7. Load testing

### Short-term (First Week)
1. Deploy to production
2. Monitor closely for errors
3. Gather user feedback
4. Fix critical bugs
5. Performance tuning

### Medium-term (First Month)
1. Collect analytics and metrics
2. Optimize based on real usage
3. Add missing features identified during testing
4. Scale infrastructure as needed
5. Document operational procedures

### Long-term (Ongoing)
1. Regular security updates
2. Feature enhancements
3. Performance monitoring and optimization
4. User support and documentation
5. Continuous integration/deployment pipeline
