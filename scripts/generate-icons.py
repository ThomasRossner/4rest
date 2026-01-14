#!/usr/bin/env python3
"""
Generate 4rester app icons from the design specification.
Requires: pip install pillow numpy
"""

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

def create_gradient_background(size):
    """Create a vertical gradient background (from top to bottom)."""
    # Create gradient using numpy for better performance
    img = np.zeros((size, size, 3), dtype=np.uint8)
    
    # Gradient colors based on the image description
    # Top: darker green
    r1, g1, b1 = 0x3D, 0x82, 0x77
    # Bottom: lighter, more yellowish-green
    r2, g2, b2 = 0x8B, 0xC3, 0x4A
    
    # Create vertical gradient (from top to bottom)
    for y in range(size):
        # Calculate vertical position (0.0 at top to 1.0 at bottom)
        vertical = y / (size - 1) if size > 1 else 0
        vertical = max(0, min(1, vertical))  # Clamp to [0, 1]
        
        # Interpolate colors
        r = int(r1 + (r2 - r1) * vertical)
        g = int(g1 + (g2 - g1) * vertical)
        b = int(b1 + (b2 - b1) * vertical)
        
        # Apply same color to entire row
        img[y, :] = [r, g, b]
    
    return Image.fromarray(img, 'RGB')

def create_rounded_mask(size, radius):
    """Create a rounded rectangle mask."""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius, fill=255)
    return mask

def draw_number_4(draw, size, font):
    """Draw the white number 4, centered. Returns the bounding box for tree positioning."""
    text = "4"
    
    # Calculate text position (centered)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2 - bbox[0]
    text_y = (size - text_height) // 2 - bbox[1]
    
    # Draw white "4"
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Return position info for tree elements
    return {
        'x': text_x,
        'y': text_y,
        'width': text_width,
        'height': text_height,
        'right': text_x + text_width,
        'top': text_y
    }

def draw_tree_elements(draw, size, number4_bbox):
    """Draw the tree/arrow elements in upper right quadrant, slightly overlapping the "4"."""
    # Three overlapping green triangles with transparency
    # Colors from the image description - light green
    tree_colors = [
        (140, 198, 63, 220),   # Medium-dark green (#8CC63F) - innermost/leftmost
        (170, 221, 92, 200),   # Lighter green (#AADD5C) - middle
        (204, 255, 128, 180),  # Lightest green (#CCFF80) - outermost/rightmost
    ]
    
    # Position triangles in the upper right quadrant
    # They should slightly overlap the "4" but be primarily in the upper right area
    number4_right = number4_bbox['right']
    number4_top = number4_bbox['top']
    
    # Position in upper right quadrant: start from around 60-70% of width, top 20-30% of height
    # Base should be positioned to slightly overlap with the "4"
    base_x = int(size * 0.55)  # Start in upper right quadrant
    base_y = int(size * 0.25)  # Upper part of icon
    
    triangle_base_width = int(size * 0.22)  # Width of triangle base
    triangle_height = int(size * 0.18)  # Height of triangles
    
    for i, color in enumerate(tree_colors):
        # Offset each triangle slightly to create layering effect
        # Each triangle is offset to the right and slightly up for 3D effect
        offset_x = i * (triangle_base_width // 6)
        offset_y = -i * (triangle_height // 10)
        
        # Triangle points: 
        # - Base at bottom (slightly overlapping "4")
        # - Point extends upward and to the right (pointing up-right)
        # The triangles should form a tree/arrow shape pointing up-right
        points = [
            (base_x + offset_x, base_y + triangle_height + offset_y),  # Bottom left
            (base_x + triangle_base_width + offset_x, base_y + triangle_height + offset_y),  # Bottom right
            (base_x + triangle_base_width // 2 + offset_x, base_y + offset_y),  # Top point (arrow tip)
        ]
        draw.polygon(points, fill=color)

def create_icon(size, output_path):
    """Create a 4rester app icon with the specified size."""
    # Create gradient background
    img = create_gradient_background(size)
    
    # Apply rounded corners (20% of size for modern app icon style)
    corner_radius = int(size * 0.2)
    mask = create_rounded_mask(size, corner_radius)
    
    # Convert to RGBA and apply mask
    img = img.convert('RGBA')
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Create drawing context
    draw = ImageDraw.Draw(output)
    
    # Load font for the "4" - try to get a bold sans-serif font
    font_size = int(size * 0.7)  # 70% of icon size for prominence
    font = None
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",  # macOS
        "/System/Library/Fonts/Helvetica.ttc",  # macOS alternative
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",  # Linux alternative
    ]
    
    for font_path in font_paths:
        try:
            font = ImageFont.truetype(font_path, font_size)
            break
        except:
            continue
    
    if font is None:
        # Fallback to default font
        font = ImageFont.load_default()
        print(f"⚠️  Warning: Using default font for {size}x{size} icon (may not be bold)")
    
    # Draw the white "4" first to get its bounding box
    number4_bbox = draw_number_4(draw, size, font)
    
    # Draw tree elements integrated with the "4"
    draw_tree_elements(draw, size, number4_bbox)
    
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
        print(f"❌ Error: {public_dir} does not exist!")
        return
    
    print("🎨 Generating 4rester app icons...")
    print(f"📁 Output directory: {public_dir}\n")
    
    # Generate icons in different sizes
    create_icon(32, os.path.join(public_dir, 'favicon.png'))
    create_icon(192, os.path.join(public_dir, 'pwa-192x192.png'))
    create_icon(512, os.path.join(public_dir, 'pwa-512x512.png'))
    
    # Also create a larger version for the login page
    create_icon(128, os.path.join(public_dir, 'app-icon-128.png'))
    
    print("\n✨ All icons generated successfully!")
    print("\n📦 Generated files:")
    print("  - frontend/public/favicon.png (32x32)")
    print("  - frontend/public/pwa-192x192.png (192x192)")
    print("  - frontend/public/pwa-512x512.png (512x512)")
    print("  - frontend/public/app-icon-128.png (128x128)")

if __name__ == '__main__':
    main()
