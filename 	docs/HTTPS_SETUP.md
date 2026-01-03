# HTTPS Setup für Kamera-Zugriff

## Problem

Die Kamera-API (`navigator.mediaDevices.getUserMedia`) funktioniert nur über HTTPS oder von localhost. Wenn Sie die App von einem anderen Gerät (z.B. iPhone) aus aufrufen, ist HTTPS erforderlich.

## Lösung: Zertifikat auf iPhone installieren

### Schritt 1: Zertifikat auf iPhone herunterladen

**Option A: Über die App (empfohlen)**
1. Öffnen Sie auf dem iPhone Safari
2. Navigieren Sie zu `https://192.168.178.63:3000/cert.pem`
   (Ersetzen Sie die IP-Adresse durch die tatsächliche IP Ihres Rechners)
3. Das Zertifikat wird heruntergeladen

**Option B: Per AirDrop oder Email**
1. Übertragen Sie die Datei `frontend/.certificates/cert.pem` per AirDrop, Email oder einem anderen Weg auf das iPhone

### Schritt 2: Zertifikat auf iPhone installieren

1. Öffnen Sie die `cert.pem` Datei auf dem iPhone (z.B. in Safari oder Files)
2. Tippen Sie auf "Profil installieren" oder "Installieren"
3. Gehen Sie zu **Einstellungen → Allgemein → VPN & Geräteverwaltung**
4. Tippen Sie auf das installierte Profil
5. Tippen Sie auf "Installieren" (oben rechts)
6. Bestätigen Sie die Installation

### Schritt 3: Zertifikat als vertrauenswürdig markieren

1. Gehen Sie zu **Einstellungen → Allgemein → Info → Zertifikatvertrauenseinstellungen**
2. Aktivieren Sie das Zertifikat "Roots of Impact" oder "localhost"

### Schritt 4: App im Safari öffnen

1. Öffnen Sie Safari auf dem iPhone
2. Navigieren Sie zu `https://192.168.178.63:3000`
3. Akzeptieren Sie die Warnung (falls noch vorhanden)
4. Die Kamera sollte jetzt funktionieren

## Alternative: mkcert verwenden

Für eine einfachere Lösung können Sie `mkcert` verwenden, das lokal vertrauenswürdige Zertifikate erstellt:

```bash
# Installieren Sie mkcert
brew install mkcert

# Installieren Sie das lokale CA
mkcert -install

# Erstellen Sie ein Zertifikat
cd frontend/.certificates
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 192.168.178.63 ::1
```

Mit `mkcert` erstellte Zertifikate werden automatisch von Browsern als vertrauenswürdig erkannt.

## Hinweis

Die Zertifikate sind nur für die Entwicklung gedacht. In der Produktion sollten Sie ein echtes SSL-Zertifikat (z.B. von Let's Encrypt) verwenden.
