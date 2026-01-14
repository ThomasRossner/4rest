# Icon-Größen erstellen - Schnellanleitung

Du hast bereits ein PNG mit dem richtigen Logo. Hier sind die einfachsten Methoden, um die benötigten Größen zu erstellen:

## Methode 1: Mit dem Skript (empfohlen)

```bash
cd /Users/thomas/Development/4rester
./scripts/resize-icon.sh /pfad/zu/deinem/logo.png
```

**Beispiel:**
```bash
./scripts/resize-icon.sh ~/Downloads/4rester-logo.png
```

Das Skript erstellt automatisch alle benötigten Größen:
- `favicon.png` (32x32)
- `app-icon-128.png` (128x128)
- `pwa-192x192.png` (192x192)
- `pwa-512x512.png` (512x512)

## Methode 2: Mit sips (macOS - eingebaut)

```bash
cd /Users/thomas/Development/4rester/frontend/public

sips -z 32 32 /pfad/zu/deinem/logo.png --out favicon.png
sips -z 128 128 /pfad/zu/deinem/logo.png --out app-icon-128.png
sips -z 192 192 /pfad/zu/deinem/logo.png --out pwa-192x192.png
sips -z 512 512 /pfad/zu/deinem/logo.png --out pwa-512x512.png
```

## Methode 3: Mit ImageMagick

Falls ImageMagick installiert ist:
```bash
brew install imagemagick  # Falls nicht installiert

cd /Users/thomas/Development/4rester/frontend/public

convert /pfad/zu/deinem/logo.png -resize 32x32 favicon.png
convert /pfad/zu/deinem/logo.png -resize 128x128 app-icon-128.png
convert /pfad/zu/deinem/logo.png -resize 192x192 pwa-192x192.png
convert /pfad/zu/deinem/logo.png -resize 512x512 pwa-512x512.png
```

## Methode 4: Mit Python PIL

```bash
pip3 install pillow  # Falls nicht installiert

python3 << 'EOF'
from PIL import Image

input_file = "/pfad/zu/deinem/logo.png"
output_dir = "frontend/public"

sizes = [
    (32, "favicon.png"),
    (128, "app-icon-128.png"),
    (192, "pwa-192x192.png"),
    (512, "pwa-512x512.png")
]

img = Image.open(input_file)
for size, filename in sizes:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(f"{output_dir}/{filename}", "PNG")
    print(f"✅ Created {filename} ({size}x{size})")
EOF
```

## Methode 5: Online-Tool

1. Gehe zu https://www.iloveimg.com/resize-image oder https://www.resizepixel.com/
2. Lade dein Logo hoch
3. Erstelle die Größen: 32x32, 128x128, 192x192, 512x512
4. Lade die Dateien herunter und benenne sie entsprechend
5. Kopiere sie nach `frontend/public/`

## Wichtig

- Das Original-Logo sollte idealerweise mindestens 512x512px groß sein für beste Qualität
- Alle Icons müssen quadratisch sein (1:1 Seitenverhältnis)
- Die Dateien müssen nach `frontend/public/` kopiert werden

## Nach dem Erstellen

Nachdem du die Icons erstellt hast, kannst du sie testen:
```bash
cd /Users/thomas/Development/4rester
# Frontend neu starten oder rebuilden
```

Die Icons werden automatisch verwendet für:
- Browser-Tab (favicon.png)
- PWA-Installation (pwa-192x192.png, pwa-512x512.png)
- Login-Seite (app-icon-128.png)
