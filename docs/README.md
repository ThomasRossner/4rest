# Roots of Impact - Architecture Diagrams

This directory contains PlantUML diagrams documenting the Roots of Impact system architecture.

## Diagrams

### 1. System Overview (`system-overview.puml`)
High-level view of the entire system architecture showing:
- Frontend layer (React PWA, Three.js)
- Backend API layer
- Integration layer
- Data layer
- External services

### 2. Database Schema (`database-schema.puml`)
Entity-Relationship diagram showing:
- All database tables
- Primary keys, foreign keys
- Relationships between entities
- Data types and constraints

### 3. API Sequence Flow (`api-sequence.puml`)
Sequence diagram showing:
- Task completion flow
- Interaction between frontend, API, services, and database
- HotelKit integration points

### 4. Component Diagram (`component-diagram.puml`)
Component-level architecture showing:
- Frontend components
- Backend services
- Integration adapters
- Data access layer

### 5. Deployment Diagram (`deployment-diagram.puml`)
Infrastructure and deployment view showing:
- Load balancing
- Cluster architecture
- Database replication
- CDN setup
- External service integrations

### 6. User Journey (`user-journey.puml`)
User flow diagrams showing:
- Guest user journey (registration → tasks → rewards)
- Employee user journey (sync → tasks → benefits)

### 7. Integration Flow (`integration-flow.puml`)
Detailed HotelKit integration showing:
- Task synchronization
- Completion sync
- Webhook handling
- Periodic sync fallback

## How to View

### Online
1. Copy the `.puml` file content
2. Visit http://www.plantuml.com/plantuml
3. Paste the content
4. View the rendered diagram

### VS Code
1. Install the "PlantUML" extension
2. Open any `.puml` file
3. Press `Alt+D` (or `Cmd+D` on Mac) to preview

### Command Line
```bash
# Install PlantUML (requires Java)
# Mac: brew install plantuml
# Or download from: http://plantuml.com/download

# Generate PNG
plantuml system-overview.puml

# Generate SVG
plantuml -tsvg system-overview.puml
```

### Docker
```bash
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
# Then visit http://localhost:8080
```

## Generating All Diagrams

To generate all diagrams at once:

```bash
cd docs/architecture
plantuml *.puml
```

This will create PNG files for each diagram.

## Updating Diagrams

When making architectural changes:
1. Update the relevant `.puml` file
2. Regenerate the diagram
3. Update this README if needed
