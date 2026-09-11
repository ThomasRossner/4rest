# PlantUML Preview Troubleshooting

## VS Code PlantUML Extension Issues

### 1. Java Not Found
**Problem**: Extension shows "Java not found"
**Solution**: 
- Ensure Java is installed: `java -version`
- Install Java 8+ if missing
- Set JAVA_HOME environment variable if needed

### 2. PlantUML JAR Path Not Set
**Problem**: Preview button doesn't work
**Solution**:
1. Open VS Code Settings (Ctrl+,)
2. Search for "PlantUML"
3. Set "PlantUML: Server" to one of:
   - `http://www.plantuml.com/plantuml` (online)
   - `http://localhost:8080` (if running local server)
   - Or leave empty for bundled JAR

### 3. Extension Settings
Add to VS Code settings.json:
```json
{
  "plantuml.server": "http://www.plantuml.com/plantuml",
  "plantuml.render": "PlantUMLServer",
  "plantuml.previewAutoUpdate": true
}
```

### 4. Using Online Server (Easiest)
If local preview doesn't work:
1. Open Command Palette (Ctrl+Shift+P)
2. Type "PlantUML: Change Render"
3. Select "PlantUMLServer"
4. Preview should now use online server

### 5. Verify Syntax
Make sure `.puml` files start with `@startuml` and end with `@enduml`

### 6. Alternative: Use VS Code Command
- Right-click on `.puml` file
- Select "Preview PlantUML Diagram"
- Or use shortcut: `Alt+D` (Windows) or `Cmd+D` (Mac)

### Quick Test
Open `system-overview.puml` and try:
- Right-click → "Preview PlantUML Diagram"
- Or Command Palette → "PlantUML: Preview Current Diagram"

### Alternative Extensions
If PlantUML extension doesn't work, try:
- "Markdown Preview Mermaid Support" with Mermaid diagrams
- Export to plantuml.com online viewer
