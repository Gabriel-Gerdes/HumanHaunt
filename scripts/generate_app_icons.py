#!/usr/bin/env python3
"""Generate placeholder App Icon PNGs for the iOS asset catalog.

Produces solid-color, valid PNGs at the exact pixel dimensions expected by
each scale variant referenced in:
  mobile/ios/mobile/Images.xcassets/AppIcon.appiconset/Contents.json

Usage:
    python scripts/generate_app_icons.py

Requires Pillow:  pip install Pillow
"""

import os

from PIL import Image

# name -> (width, height) in pixels
ICON_SPECS = {
    "AppIcon-20x29@1x.png": (20, 29),
    "AppIcon-20x29@2x.png": (40, 58),
    "AppIcon-20x29@3x.png": (60, 87),
    "AppIcon-29x29@1x.png": (29, 29),
    "AppIcon-29x29@2x.png": (58, 58),
    "AppIcon-29x29@3x.png": (87, 87),
    "AppIcon-40x40@1x.png": (40, 40),
    "AppIcon-40x40@2x.png": (80, 80),
    "AppIcon-40x40@3x.png": (120, 120),
    "AppIcon-60x60@2x.png": (120, 120),
    "AppIcon-60x60@3x.png": (180, 180),
    "AppIcon-1024.png": (1024, 1024),
}

# Solid iOS-system-blue fill; opaque RGBA.
FILL_COLOR = (0, 122, 255, 255)

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "mobile",
    "ios",
    "mobile",
    "Images.xcassets",
    "AppIcon.appiconset",
)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for name, (width, height) in sorted(ICON_SPECS.items()):
        image = Image.new("RGBA", (width, height), FILL_COLOR)
        out_path = os.path.join(OUTPUT_DIR, name)
        image.save(out_path, format="PNG")
        print(f"wrote {out_path} ({width}x{height})")


if __name__ == "__main__":
    main()
