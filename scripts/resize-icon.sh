#!/bin/bash
# Resize icon PNG to required sizes
# Usage: ./resize-icon.sh <input-icon.png>

if [ -z "$1" ]; then
    echo "Usage: $0 <input-icon.png>"
    echo "Example: $0 ~/Downloads/4rest-logo.png"
    exit 1
fi

INPUT_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${PROJECT_DIR}/frontend/public"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    exit 1
fi

if [ ! -d "$OUTPUT_DIR" ]; then
    echo "❌ Error: Output directory not found: $OUTPUT_DIR"
    exit 1
fi

echo "📐 Resizing icon: $INPUT_FILE"
echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Check if sips is available (macOS)
if command -v sips >/dev/null 2>&1; then
    echo "Using sips (macOS)..."
    sips -z 32 32 "$INPUT_FILE" --out "${OUTPUT_DIR}/favicon.png"
    sips -z 128 128 "$INPUT_FILE" --out "${OUTPUT_DIR}/app-icon-128.png"
    sips -z 192 192 "$INPUT_FILE" --out "${OUTPUT_DIR}/pwa-192x192.png"
    sips -z 512 512 "$INPUT_FILE" --out "${OUTPUT_DIR}/pwa-512x512.png"
    echo "✅ Icons created successfully!"
# Check if convert is available (ImageMagick)
elif command -v convert >/dev/null 2>&1; then
    echo "Using ImageMagick..."
    convert "$INPUT_FILE" -resize 32x32 "${OUTPUT_DIR}/favicon.png"
    convert "$INPUT_FILE" -resize 128x128 "${OUTPUT_DIR}/app-icon-128.png"
    convert "$INPUT_FILE" -resize 192x192 "${OUTPUT_DIR}/pwa-192x192.png"
    convert "$INPUT_FILE" -resize 512x512 "${OUTPUT_DIR}/pwa-512x512.png"
    echo "✅ Icons created successfully!"
# Check if Python with PIL is available
elif python3 -c "from PIL import Image" 2>/dev/null; then
    echo "Using Python PIL..."
    python3 << EOF
from PIL import Image
import sys

input_file = "$INPUT_FILE"
output_dir = "$OUTPUT_DIR"

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
    echo "✅ Icons created successfully!"
else
    echo "❌ Error: No suitable tool found!"
    echo ""
    echo "Please install one of the following:"
    echo "  - macOS: sips is built-in"
    echo "  - ImageMagick: brew install imagemagick"
    echo "  - Python PIL: pip3 install pillow"
    exit 1
fi

echo ""
echo "📦 Generated files:"
echo "  - ${OUTPUT_DIR}/favicon.png (32x32)"
echo "  - ${OUTPUT_DIR}/app-icon-128.png (128x128)"
echo "  - ${OUTPUT_DIR}/pwa-192x192.png (192x192)"
echo "  - ${OUTPUT_DIR}/pwa-512x512.png (512x512)"
