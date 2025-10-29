# Open Questions for Client Clarification

This document lists questions that need to be answered to ensure accurate implementation of the Roots of Impact platform.

## 1. Authentication & User Management

### User Registration
- **Q1.1**: How should users initially register? 
  - Self-registration via email/password?
  - Invitation-only system?
  - Integration with existing hotel guest management system?
- **Q1.2**: Do guests need to provide booking confirmation or room number to verify they're hotel guests?
- **Q1.3**: How are employees identified and added to the system?
  - Manual addition by admin?
  - Automatic sync from HotelKit?
  - Employee self-registration with verification?

### Social Login
- **Q1.4**: Which social login providers should be supported? (Google, Facebook, Apple, etc.)
- **Q1.5**: Is social login mandatory or optional alongside email/password?

### Role Management
- **Q1.6**: Can users have multiple roles? (e.g., a guest who also becomes a stakeholder)
- **Q1.7**: How should stakeholder accounts be created? Any verification required?

## 2. Video Content & Hosting

### Video Creation
- **Q2.1**: Who will create the video content?
  - Hotel staff?
  - External agency (Beyond Content GmbH mentioned)?
  - Mix of both?
- **Q2.2**: What is the expected volume of videos? (number of videos, total storage needs)

### Video Hosting
- **Q2.3**: Where should videos be hosted?
  - AWS S3 with CloudFront?
  - Vimeo/Youtube embedding?
  - Self-hosted solution?
- **Q2.4**: What are the video format requirements? (resolution, duration limits, file size)
- **Q2.5**: Should videos be downloadable or streaming-only?

### Video Content Management
- **Q2.6**: Who approves/manages video content? Is an admin panel needed?
- **Q2.7**: Should videos support subtitles/captions for accessibility?
- **Q2.8**: Do videos need multi-language versions or just German?

## 3. QR Code System

### QR Code Generation
- **Q3.1**: How are QR codes generated and distributed?
  - Automatically generated per task?
  - Pre-printed QR codes placed at physical locations?
  - Hybrid approach?
- **Q3.2**: Should QR codes be unique per user or per task/location?
- **Q3.3**: What happens if a QR code is scanned multiple times by the same user?
- **Q3.4**: How are QR codes protected against misuse? (expiration, one-time use, etc.)

### QR Code Placement
- **Q3.5**: Where will QR codes be physically placed in the hotel?
  - Reception, rooms, spa, restaurant?
  - Multiple locations per task type?
- **Q3.6**: How should QR codes be designed/printed? (size, style, branding)

## 4. Rewards & Voucher System

### Reward Types
- **Q4.1**: What specific types of rewards will be offered?
  - Discount percentages? (e.g., 10% off spa)
  - Fixed amount vouchers?
  - Free services/products?
  - Vacation days for employees?
  - Team events?
- **Q4.2**: What is the points-to-reward conversion rate? (e.g., 100 points = 5€ discount)
- **Q4.3**: Should there be different reward tiers based on points collected?

### Voucher Integration
- **Q4.4**: Which external voucher/providers need to be integrated?
  - Hotel's existing POS system?
  - Third-party voucher platforms?
  - Custom voucher generation only?
- **Q4.5**: What voucher information needs to be tracked? (expiration, usage, refunds?)
- **Q4.6**: How should vouchers be delivered to users? (Email, in-app display, printable?)

### Reward Limits
- **Q4.7**: Are there limits on reward redemption? (daily, monthly, per user)
- **Q4.8**: Can rewards be transferred between users or are they non-transferable?

## 5. HotelKit Integration

### API Details
- **Q5.1**: What is the exact HotelKit API documentation/endpoints we need to integrate with?
- **Q5.2**: What authentication method does HotelKit use? (API key, OAuth, etc.)
- **Q5.3**: What is the HotelKit base URL and API version?
- **Q5.4**: Which HotelKit entities need to be synced? (tasks, employees, completions)

### Sync Behavior
- **Q5.5**: How frequently should HotelKit sync occur? (real-time, hourly, daily)
- **Q5.6**: Should HotelKit task completions automatically complete Roots of Impact tasks?
- **Q5.7**: Should Roots of Impact task completions sync back to HotelKit?

## 6. Task System

### Task Creation & Management
- **Q6.1**: Who creates and manages tasks? 
  - Hotel administrators?
  - Need for admin dashboard/panel?
- **Q6.2**: Should tasks be scheduled (available only at certain times)?
- **Q6.3**: Can tasks be location-specific? (only available when user is at hotel)
- **Q6.4**: Should tasks have categories/tags for filtering?

### Quiz System
- **Q6.5**: For video quizzes, what's the minimum passing score? (currently set to 70%)
- **Q6.6**: Should users be able to retake quizzes if they fail?
- **Q6.7**: How many questions per quiz are expected? (currently supports 2-3)

### Photo Tasks
- **Q6.8**: Who moderates/approves photo submissions?
  - Automatic approval?
  - Manual review required?
- **Q6.9**: What happens if inappropriate content is uploaded?
- **Q6.10**: Should photos be publicly visible or private to user only?

## 7. Virtual Forest

### Forest Visualization
- **Q7.1**: How many trees should be visible in the collective forest? (currently limited to 1000)
- **Q7.2**: Should trees have different types/models based on task type or points earned?
- **Q7.3**: Should the forest support zooming/panning boundaries? What's the world size?
- **Q7.4**: Do stakeholders contribute to the same forest or separate forests per organization?

### Tree Placement
- **Q7.5**: Should tree placement be random or follow a specific pattern/algorithm?
- **Q7.6**: Can users see trees planted by others or only anonymized view?
- **Q7.7**: Should there be special/rare trees for major achievements?

## 8. Statistics & Reporting

### Metrics & KPIs
- **Q8.1**: What specific KPIs need to be tracked and reported?
- **Q8.2**: Who should have access to statistics? (admins, employees, guests, public?)
- **Q8.3**: Are there specific reporting periods required? (daily, weekly, monthly reports)
- **Q8.4**: Do CO₂ calculations need to be verified/certified by external auditors?

### Dashboard Requirements
- **Q8.5**: Is an admin dashboard needed for managing the platform?
- **Q8.6**: What kind of analytics/reports are needed for management?
- **Q8.7**: Should statistics be exportable? (CSV, PDF, Excel)

## 9. Team Features

### Team Structure
- **Q9.1**: How should teams be organized?
  - Department-based? (Housekeeping, Reception, etc.)
  - Self-formed teams?
  - Hotel-wide teams?
- **Q9.2**: Can guests join teams or only employees?
- **Q9.3**: What team features are needed? (leaderboards, team challenges, shared rewards?)

### Competition
- **Q9.4**: Should there be competitions/challenges between teams?
- **Q9.5**: How long do competitions last? (weekly, monthly, quarterly?)
- **Q9.6**: What rewards are given for team achievements?

## 10. Notifications & Communications

### Notification Preferences
- **Q10.1**: What types of notifications are needed?
  - Task reminders?
  - Reward availability?
  - Achievement milestones?
  - Team updates?
- **Q10.2**: Preferred notification channels?
  - In-app only?
  - Email notifications?
  - Push notifications (mobile)?
  - SMS?

### Email System
- **Q10.3**: Should there be email capabilities? (welcome emails, rewards, reports)
- **Q10.4**: What email service should be used? (SendGrid, AWS SES, custom SMTP?)

## 11. Multi-language Support

### Language Requirements
- **Q11.1**: Which languages need to be supported initially?
  - German (mentioned as primary)
  - English?
  - Others?
- **Q11.2**: Should the UI support language switching, or one language per deployment?
- **Q11.3**: Will content (tasks, videos) be translated or only the UI?

## 12. Content Moderation & Safety

### Moderation
- **Q12.1**: Who moderates user-generated content? (photos, comments if any)
- **Q12.2**: What moderation tools are needed? (flagging, reporting, auto-detection?)
- **Q12.3**: What's the response time for moderation actions?

## 13. Deployment & Infrastructure

### Hosting Environment
- **Q13.1**: Where should the application be hosted? (AWS, Azure, DigitalOcean, on-premise?)
- **Q13.2**: What's the expected user scale? (number of concurrent users, total users)
- **Q13.3**: Are there specific compliance requirements for hosting? (data residency, certifications)

### Domain & Branding
- **Q13.4**: What will be the production domain name?
- **Q13.5**: Are there specific branding guidelines? (colors, logos, fonts, styling)

### Backups & Disaster Recovery
- **Q13.6**: What are the backup requirements? (frequency, retention period)
- **Q13.7**: What's the acceptable downtime/RTO/RPO?

## 14. Integration & Third-Party Services

### Analytics
- **Q14.1**: Should Google Analytics or similar be integrated?
- **Q14.2**: What analytics events need to be tracked?

### Payment Processing
- **Q14.3**: Is payment processing needed for any features? (premium rewards, etc.)

### Other Integrations
- **Q14.4**: Are there other hotel systems that need integration? (PMS, POS, booking systems?)

## 15. Mobile App

### Native App
- **Q15.1**: Is a native mobile app required, or is the PWA sufficient?
- **Q15.2**: If native app, which platforms? (iOS, Android, both)

### App Store
- **Q15.3**: Should the app be published to App Store/Play Store or enterprise distribution?

## 16. Advanced Features

### NFT Integration
- **Q16.1**: Is NFT integration actually needed, or was this optional/future feature?
- **Q16.2**: If yes, which blockchain? What NFT standards? Costs?

### Social Features
- **Q16.3**: Should users be able to see other users' progress/achievements?
- **Q16.4**: Should there be social sharing? (share achievements on social media)
- **Q16.5**: Comments, likes, or other social interactions needed?

## 17. Legal & Compliance

### Terms & Conditions
- **Q17.1**: Are there specific Terms of Service and Privacy Policy that need to be integrated?
- **Q17.2**: Should users accept terms during registration?

### Data Retention
- **Q17.3**: What are the data retention policies? (how long to keep user data, completed tasks)

## 18. Testing & Launch

### Pilot Phase
- **Q18.1**: When is the pilot phase planned to start?
- **Q18.2**: How many users will participate in the pilot?
- **Q18.3**: What's the timeline for full rollout?

### Testing
- **Q18.4**: Who will be involved in user acceptance testing (UAT)?
- **Q18.5**: Are there specific use cases/scenarios that must be tested?

## Priority Questions

**These should be answered first as they impact core architecture:**

1. **Q1.1-Q1.3**: User registration and management flow
2. **Q2.3-Q2.4**: Video hosting solution (affects infrastructure)
3. **Q5.1-Q5.4**: HotelKit API details (critical for integration)
4. **Q4.1-Q4.3**: Reward system specifics (affects database and business logic)
5. **Q13.1-Q13.2**: Hosting and scale (affects deployment approach)
6. **Q6.1**: Admin panel requirement (affects scope and timeline)

---

**Note**: Please prioritize answering questions marked as "Priority Questions" to proceed with core development decisions.
