# Anleitung: 4rest Icon erstellen

## Spezifikationen basierend auf dem Original

### Grundlegende Eigenschaften
- **Format**: Quadratisch (z.B. 512x512px für PWA)
- **Ecken**: Abgerundet (ca. 20% des Radius)
- **Hintergrund**: Vertikaler Gradient

### Hintergrund-Gradient
- **Oben**: Dunkleres Grün (z.B. #3D8277 oder ähnlich)
- **Unten**: Helleres, gelblicheres Grün (z.B. #8BC34A oder ähnlich)
- **Richtung**: Vertikal (von oben nach unten)

### Die "4"
- **Farbe**: Weiß (#FFFFFF)
- **Position**: Zentriert
- **Größe**: Sehr groß und prominent (ca. 70% der Icon-Größe)
- **Schriftart**: Fett, Sans-Serif (z.B. Arial Bold, Helvetica Bold)

### Dreieckiges Element (oberer rechter Quadrant)
- **Position**: Oberer rechter Quadrant, leicht überlappend mit der "4"
- **Form**: Stilisiertes dreieckiges Element, das aus 2-3 überlappenden Dreiecken besteht
- **Farbe**: Hellgrün (heller als der Hintergrund)
- **Ausrichtung**: Zeigt nach oben und leicht nach rechts
- **Effekt**: Subtiler 3D/Layering-Effekt durch überlappende Dreiecke mit leichter Transparenz

## Option 1: Mit Figma (empfohlen)

1. **Neues Design erstellen** (512x512px)
2. **Abgerundete Ecken**: Rectangle mit 20% Corner Radius
3. **Gradient-Hintergrund**:
   - Erstelle ein Rectangle, das das gesamte Icon ausfüllt
   - Gradient: Linear, vertikal (0°)
   - Startfarbe (oben): #3D8277
   - Endfarbe (unten): #8BC34A
4. **Die "4"**:
   - Text-Tool: "4"
   - Schriftart: Arial Bold oder Helvetica Bold
   - Größe: ca. 360px (70% von 512px)
   - Farbe: Weiß (#FFFFFF)
   - Zentrieren (horizontal und vertikal)
5. **Dreieckiges Element**:
   - Erstelle 2-3 überlappende Dreiecke mit Polygon-Tool
   - Position: Oberer rechter Quadrant (ca. 60-80% von links, 10-30% von oben)
   - Größe: Ca. 20-25% der Icon-Größe
   - Farben: Verschiedene Hellgrün-Töne (z.B. #AADD5C, #CCFF80)
   - Leichte Transparenz (80-90% Opacity) für Layering-Effekt
   - Ausrichtung: Nach oben und leicht nach rechts zeigend
6. **Export**: Als PNG in verschiedenen Größen (32x32, 192x192, 512x512)

## Option 2: Mit Photoshop/GIMP

1. **Neues Dokument**: 512x512px
2. **Abgerundete Ecken**: 
   - Photoshop: Rounded Rectangle Tool mit 20% Radius
   - GIMP: Rectangle Select → Select → Rounded Corners
3. **Gradient-Hintergrund**:
   - Gradient Tool, vertikal
   - Von #3D8277 (oben) zu #8BC34A (unten)
4. **Die "4"**:
   - Text-Tool, "4", Arial Bold, 360px, weiß, zentriert
5. **Dreieckiges Element**:
   - Polygon Tool für Dreiecke
   - 2-3 überlappende Dreiecke im oberen rechten Quadranten
   - Hellgrüne Farben mit Transparenz
6. **Export**: PNG in verschiedenen Größen

## Option 3: Python-Skript korrigieren

Das aktuelle Skript in `scripts/generate-icons.py` kann angepasst werden. Die Hauptprobleme sind wahrscheinlich:
- Die Positionierung der Dreiecke
- Die Größe/Form der Dreiecke
- Die Farben der Dreiecke

## Option 4: Online-Tool

- **Canva**: Kann Icons mit Gradienten und Formen erstellen
- **Photopea**: Kostenlose Online-Alternative zu Photoshop

## Wichtige Details für das Original

Basierend auf der Beschreibung:
- Das dreieckige Element ist **stilisiert** und besteht aus **2-3 überlappenden Dreiecken**
- Es hat einen **subtilen 3D-Effekt** durch das Layering
- Die Dreiecke sind **hellgrün** (heller als der Hintergrund)
- Sie **überlappen leicht** die "4" im oberen rechten Bereich
- Die Ausrichtung ist **nach oben und leicht nach rechts**

## Export-Größen

Für die App werden folgende Größen benötigt:
- `favicon.png`: 32x32px
- `app-icon-128.png`: 128x128px
- `pwa-192x192.png`: 192x192px
- `pwa-512x512.png`: 512x512px

## Tipp

Erstelle zuerst eine große Version (512x512px) und skaliere dann herunter für die anderen Größen. So bleiben die Details erhalten.
