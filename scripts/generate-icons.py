#!/usr/bin/env python3
"""
Generate 4rester app icons from the design specification.
Requires: pip install pillow numpy
"""

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

def create_gradient_background(size):
    """Create a diagonal gradient background."""
    # Create gradient using numpy for better performance
    img = np.zeros((size, size, 3), dtype=np.uint8)
    
    # Gradient colors
    # Top-left: darker teal-green (#3D8277 or #488C7E)
    r1, g1, b1 = 0x48, 0x8C, 0x7E
    # Bottom-right: lighter lime-green (#7AB958 or #8BC34A)
    r2, g2, b2 = 0x8B, 0xC3, 0x4A
    
    # Create diagonal gradient (135 degrees)
    for y in range(size):
        for x in range(size):
            # Calculate diagonal position (0.0 to 1.0)
            # Diagonal from top-left to bottom-right
            diag = (x + y) / (size * 2 - 2) if size > 1 else 0
            
            # Interpolate colors
            r = int(r1 + (r2 - r1) * diag)
            g = int(g1 + (g2 - g1) * diag)
            b = int(b1 + (b2 - b1) * diag)
            
            img[y, x] = [r, g, b]
    
    return Image.fromarray(img, 'RGB')

def create_rounded_mask(size, radius):
    """Create a rounded rectangle mask."""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius, fill=255)
    return mask

def draw_number_4(draw, size, font):
    """Draw the white number 4."""
    text = "4"
    
    # Calculate text position (centered)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2 - bbox[0]
    text_y = (size - text_height) // 2 - bbox[1]
    
    # Draw white "4"
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

def draw_tree_elements(draw, size):
    """Draw the tree/arrow elements in upper right."""
    # Three overlapping green triangles
    tree_colors = [
        (140, 198, 63, 200),   # Medium-dark green (#8CC63F)
        (170, 221, 92, 180),   # Lighter green (#AADD5C)
        (204, 255, 128, 160),  # Lightest green (#CCFF80)
    ]
    
    # Position triangles in upper right, overlapping the "4"
    # Base position: upper right quadrant
    base_x = int(size * 0.6)
    base_y = int(size * 0.2)
    triangle_width = int(size * 0.3)
    triangle_height = int(size * 0.25)
    
    for i, color in enumerate(tree_colors):
        # Offset each triangle slightly
        offset_x = i * (triangle_width // 8)
        offset_y = -i * (triangle_height // 12)
        
        # Triangle points: base at bottom, point at top
        points = [
            (base_x + offset_x, base_y + triangle_height + offset_y),  # Bottom left
            (base_x + triangle_width + offset_x, base_y + triangle_height + offset_y),  # Bottom right
            (base_x + triangle_width // 2 + offset_x, base_y + offset_y),  # Top point
        ]
        draw.polygon(points, fill=color)

def create_icon(size, output_path):
    """Create a 4rester app icon with the specified size."""
    # Create gradient background
    img = create_gradient_background(size)
    
    # Apply rounded corners
    corner_radius = int(size * 0.2)  # 20% of size for app icon style
    mask = create_rounded_mask(size, corner_radius)
    
    # Convert to RGBA and apply mask
    img = img.convert('RGBA')
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Create drawing context
    draw = ImageDraw.Draw(output)
    
    # Load font for the "4"
    font_size = int(size * 0.65)  # 65% of icon size
    try:
        # Try system fonts (macOS)
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except:
        try:
            # Try Helvetica
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            try:
                # Try Linux font
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                # Fallback to default font (may not be bold)
                font = ImageFont.load_default()
                print(f"Warning: Using default font for {size}x{size} icon")
    
    # Draw the white "4"
    draw_number_4(draw, size, font)
    
    # Draw tree elements in upper right
    draw_tree_elements(draw, size)
    
    # Save the image
    output.save(output_path, 'PNG', optimize=True)
    print(f"✅ Created {output_path} ({size}x{size})")

def main():
    """Generate all required icon files."""
    # Get the frontend/public directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    public_dir = os.path.join(project_root, 'frontend', 'public')
    
    if not os.path.exists(public_dir):
        print(f"Error: {public_dir} does not exist!")
        return
    
    print("🎨 Generating 4rester app icons...")
    print(f"📁 Output directory: {public_dir}\n")
    
    # Generate icons
    create_icon(32, os.path.join(public_dir, 'favicon.png'))
    create_icon(192, os.path.join(public_dir, 'pwa-192x192.png'))
    create_icon(512, os.path.join(public_dir, 'pwa-512x512.png'))
    
    print("\n✨ All icons generated successfully!")
    print("\n📦 Generated files:")
    print("  - frontend/public/favicon.png (32x32)")
    print("  - frontend/public/pwa-192x192.png (192x192)")
    print("  - frontend/public/pwa-512x512.png (512x512)")

if __name__ == '__main__':
    main()
