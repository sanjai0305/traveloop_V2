import os
import base64
import json
from PIL import Image, ImageDraw

def get_processed_logo(source_path):
    print(f"Loading source logo from: {source_path}")
    img = Image.open(source_path).convert("RGBA")
    
    # Flood fill corners to make black background transparent
    w, h = img.size
    print(f"Original image size: {w}x{h}")
    
    # Corners to floodfill
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for corner in corners:
        ImageDraw.floodfill(img, corner, (0, 0, 0, 0), thresh=20)
        
    # Crop to content bounding box
    bbox = img.getbbox()
    if bbox:
        print(f"Content bounding box: {bbox}")
        cropped = img.crop(bbox)
        cw, ch = cropped.size
        # Center the cropped logo on a transparent square canvas
        square_size = max(cw, ch)
        square_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
        x = (square_size - cw) // 2
        y = (square_size - ch) // 2
        square_img.paste(cropped, (x, y), cropped)
        print(f"Centered on square canvas of size: {square_size}x{square_size}")
        return square_img
    
    return img

def create_legacy_icon(logo, target_size, make_circle=False):
    img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    icon_size = int(target_size * 0.85)
    
    w, h = logo.size
    scale = min(icon_size / w, icon_size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    if make_circle:
        mask = Image.new("L", (new_w, new_h), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, new_w, new_h), fill=255)
        
        logo_masked = Image.new("RGBA", (new_w, new_h), (0, 0, 0, 0))
        logo_masked.paste(logo_resized, (0, 0), mask=mask)
        logo_resized = logo_masked
        
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    img.paste(logo_resized, (x, y), logo_resized)
    return img

def create_foreground_icon(logo, target_size):
    img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    safe_size = int(target_size * 0.65)
    
    w, h = logo.size
    scale = min(safe_size / w, safe_size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    img.paste(logo_resized, (x, y), logo_resized)
    return img

def create_play_store_icon(logo):
    img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # Play Store icons should be centered and fill about 80%
    w, h = logo.size
    scale = min(819 / w, 819 / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    x = (1024 - new_w) // 2
    y = (1024 - new_h) // 2
    img.paste(logo_resized, (x, y), logo_resized)
    return img

def create_splash_screen(logo, width, height):
    # premium dark navy background: rgb(11, 19, 37) / #0B1325
    img = Image.new("RGBA", (width, height), (11, 19, 37, 255))
    logo_size = int(min(width, height) * 0.4)
    w, h = logo.size
    scale = min(logo_size / w, logo_size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    x = (width - new_w) // 2
    y = (height - new_h) // 2
    img.paste(logo_resized, (x, y), logo_resized)
    return img.convert("RGB")

def create_ios_icon(logo, target_size):
    # ios app icons do not support transparency, so paste onto navy background
    img = Image.new("RGBA", (target_size, target_size), (11, 19, 37, 255))
    icon_size = int(target_size * 0.85)
    w, h = logo.size
    scale = min(icon_size / w, icon_size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    img.paste(logo_resized, (x, y), logo_resized)
    return img.convert("RGB")

def main():
    source_logo_path = "src/assets/logo.jpg"
    if not os.path.exists(source_logo_path):
        print(f"Error: Source logo not found at {source_logo_path}")
        return
        
    logo = get_processed_logo(source_logo_path)
    
    # 1. Generate Android Launcher Icons
    android_res_path = "android/app/src/main/res"
    if not os.path.exists(android_res_path):
        print(f"Error: Android res folder not found at {android_res_path}")
        return
        
    mipmap_configs = {
        "mipmap-mdpi": {"legacy": 48, "foreground": 108},
        "mipmap-hdpi": {"legacy": 72, "foreground": 162},
        "mipmap-xhdpi": {"legacy": 96, "foreground": 216},
        "mipmap-xxhdpi": {"legacy": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"legacy": 192, "foreground": 432},
    }
    
    for folder, sizes in mipmap_configs.items():
        folder_path = os.path.join(android_res_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # ic_launcher.png
        legacy_icon = create_legacy_icon(logo, sizes["legacy"], make_circle=False)
        legacy_icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        
        # ic_launcher_round.png
        round_icon = create_legacy_icon(logo, sizes["legacy"], make_circle=True)
        round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
        
        # ic_launcher_foreground.png
        foreground_icon = create_foreground_icon(logo, sizes["foreground"])
        foreground_icon.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        print(f"Generated launcher icons in {folder}")
        
    # 2. Generate Play Store Icon
    play_store_icon_path = "android/app/src/main/play_store_icon.png"
    play_store_icon = create_play_store_icon(logo)
    play_store_icon.save(play_store_icon_path, "PNG")
    print(f"Generated Play Store icon at {play_store_icon_path}")
    
    # 3. Generate Android Splash Screens
    splash_configs = {
        "drawable-land-hdpi": (800, 480),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
        "drawable": (480, 320)
    }
    
    for folder, size in splash_configs.items():
        folder_path = os.path.join(android_res_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        splash_img = create_splash_screen(logo, size[0], size[1])
        splash_img.save(os.path.join(folder_path, "splash.png"), "PNG")
        print(f"Generated splash screen in {folder} size {size}")
        
    # 4. Generate Web favicon and PWA icons
    public_path = "public"
    os.makedirs(public_path, exist_ok=True)
    
    # favicon.png (256x256)
    favicon_png = logo.resize((256, 256), Image.Resampling.LANCZOS)
    favicon_png.save(os.path.join(public_path, "favicon.png"), "PNG")
    
    # icon-192x192.png
    icon_192 = logo.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(public_path, "icon-192x192.png"), "PNG")
    
    # icon-512x512.png
    icon_512 = logo.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(public_path, "icon-512x512.png"), "PNG")
    
    # apple-touch-icon.png (requires flat background)
    apple_icon = create_ios_icon(logo, 180)
    apple_icon.save(os.path.join(public_path, "apple-touch-icon.png"), "PNG")
    
    # favicon.ico
    logo.resize((64, 64), Image.Resampling.LANCZOS).save(
        os.path.join(public_path, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    
    # favicon.svg (embedding base64 512x512 PNG)
    with open(os.path.join(public_path, "icon-512x512.png"), "rb") as f:
        png_data = f.read()
    b64_png = base64.b64encode(png_data).decode("utf-8")
    
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,{b64_png}"/>
</svg>
"""
    with open(os.path.join(public_path, "favicon.svg"), "w") as f:
        f.write(svg_content)
        
    print("Generated PWA and web icons in public folder successfully!")

    # 5. Generate iOS App Icons
    ios_assets_path = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    os.makedirs(ios_assets_path, exist_ok=True)
    
    ios_configs = [
        {"filename": "icon-20x20@2x.png", "size": 40},
        {"filename": "icon-20x20@3x.png", "size": 60},
        {"filename": "icon-29x29@1x.png", "size": 29},
        {"filename": "icon-29x29@2x.png", "size": 58},
        {"filename": "icon-29x29@3x.png", "size": 87},
        {"filename": "icon-40x40@1x.png", "size": 40},
        {"filename": "icon-40x40@2x.png", "size": 80},
        {"filename": "icon-40x40@3x.png", "size": 120},
        {"filename": "icon-60x60@2x.png", "size": 120},
        {"filename": "icon-60x60@3x.png", "size": 180},
        {"filename": "icon-20x20@1x.png", "size": 20},
        {"filename": "icon-76x76@1x.png", "size": 76},
        {"filename": "icon-76x76@2x.png", "size": 152},
        {"filename": "icon-83.5x83.5@2x.png", "size": 167},
        {"filename": "icon-1024x1024.png", "size": 1024}
    ]
    
    for config in ios_configs:
        ios_icon = create_ios_icon(logo, config["size"])
        ios_icon.save(os.path.join(ios_assets_path, config["filename"]), "PNG")
        print(f"Generated iOS icon {config['filename']} of size {config['size']}")
        
    # Write Contents.json
    contents = {
      "images" : [
        { "size" : "20x20", "idiom" : "iphone", "filename" : "icon-20x20@2x.png", "scale" : "2x" },
        { "size" : "20x20", "idiom" : "iphone", "filename" : "icon-20x20@3x.png", "scale" : "3x" },
        { "size" : "29x29", "idiom" : "iphone", "filename" : "icon-29x29@1x.png", "scale" : "1x" },
        { "size" : "29x29", "idiom" : "iphone", "filename" : "icon-29x29@2x.png", "scale" : "2x" },
        { "size" : "29x29", "idiom" : "iphone", "filename" : "icon-29x29@3x.png", "scale" : "3x" },
        { "size" : "40x40", "idiom" : "iphone", "filename" : "icon-40x40@2x.png", "scale" : "2x" },
        { "size" : "40x40", "idiom" : "iphone", "filename" : "icon-40x40@3x.png", "scale" : "3x" },
        { "size" : "60x60", "idiom" : "iphone", "filename" : "icon-60x60@2x.png", "scale" : "2x" },
        { "size" : "60x60", "idiom" : "iphone", "filename" : "icon-60x60@3x.png", "scale" : "3x" },
        { "size" : "20x20", "idiom" : "ipad", "filename" : "icon-20x20@1x.png", "scale" : "1x" },
        { "size" : "20x20", "idiom" : "ipad", "filename" : "icon-20x20@2x.png", "scale" : "2x" },
        { "size" : "29x29", "idiom" : "ipad", "filename" : "icon-29x29@1x.png", "scale" : "1x" },
        { "size" : "29x29", "idiom" : "ipad", "filename" : "icon-29x29@2x.png", "scale" : "2x" },
        { "size" : "40x40", "idiom" : "ipad", "filename" : "icon-40x40@1x.png", "scale" : "1x" },
        { "size" : "40x40", "idiom" : "ipad", "filename" : "icon-40x40@2x.png", "scale" : "2x" },
        { "size" : "76x76", "idiom" : "ipad", "filename" : "icon-76x76@1x.png", "scale" : "1x" },
        { "size" : "76x76", "idiom" : "ipad", "filename" : "icon-76x76@2x.png", "scale" : "2x" },
        { "size" : "83.5x83.5", "idiom" : "ipad", "filename" : "icon-83.5x83.5@2x.png", "scale" : "2x" },
        { "size" : "1024x1024", "idiom" : "ios-marketing", "filename" : "icon-1024x1024.png", "scale" : "1x" }
      ],
      "info" : { "version" : 1, "author" : "xcode" }
    }
    with open(os.path.join(ios_assets_path, "Contents.json"), "w") as f:
        json.dump(contents, f, indent=2)
    print("Generated Contents.json for iOS app icons. iOS icons generation complete!")

if __name__ == "__main__":
    main()
