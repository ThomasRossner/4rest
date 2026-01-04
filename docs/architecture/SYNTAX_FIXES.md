# PlantUML Syntax Fixes Applied

## Issues Fixed

### 1. Special Characters
- Removed `&` symbols (replaced with "and")
- Removed parentheses in labels (e.g., "(70%)" → "70 percent")
- Removed curly braces from labels (e.g., `{param}` → "with param")
- Removed quotes from entity names in database schema
- Simplified VARCHAR types (removed size specifications that could cause parsing issues)

### 2. Relationship Labels
- Changed quoted relationship labels to unquoted
- Removed spaces from relationship labels (e.g., "tracked in" → "tracked_in")

### 3. Sequence Diagram Messages
- Simplified JSON-like syntax in message labels
- Removed colons after WebSocket labels
- Changed function call syntax (e.g., `createTask()` → `createTask`)

### 4. Deployment Diagram
- Removed `\n` from database node labels
- Simplified service names

## Notes
- PlantUML can be sensitive to special characters in certain contexts
- When in doubt, simplify the syntax rather than using complex expressions
- Test diagrams incrementally if preview fails
