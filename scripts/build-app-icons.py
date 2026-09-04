"""
Builds every launcher and notification icon from the brand wordmark.

Run with `python scripts/build-app-icons.py` (needs Pillow). Committed rather than done by
hand because the numbers below are the whole point: an app icon that is a few per cent off
centre looks broken in a way nobody can name, and redoing it by eye each time guarantees drift.

## The safe zone, which is what went wrong

An Android adaptive icon is a 108dp canvas of which the launcher may mask away everything
outside the centre 72dp, and only the centre **66dp** is guaranteed visible on every device.
So foreground artwork has to occupy about 61% of its canvas, centred on it.

The cook app handed Android `spoon-brand-logo.png` directly. That file is 4096 square with the
mark sitting in the TOP HALF -- its ink centre is 739px above the canvas centre, an 18% upward
offset -- and no safe-zone margin at all. Android scaled the whole canvas to 108dp, so the mark
rendered high and oversized, which is the misalignment visible on the home screen.

The customer app never got this far: it still shipped Expo's blue chevron template icon.

## Why the ink bounding box rather than the canvas

Every source here has dead space, and different amounts of it. Centring the CANVAS keeps the
dead space and centres nothing; centring the INK puts the mark where a person looking at the
icon would say the middle is. That is the only measurement that survives a new export from
Figma with different padding.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COOK_ROOT = ROOT.parent / "spoonCook-frontend"

# The wordmark on a transparent background, at the largest export available.
WORDMARK = COOK_ROOT / "assets/images/figma-v13/spoon-brand-logo.png"

# Android's guaranteed-visible fraction of the adaptive canvas: 66 of 108dp.
SAFE = 66 / 108
# A little tighter for the notification tray, where the icon is also given its own padding
# and the shape is read at about 24dp.
NOTIFICATION_SAFE = 0.78
# iOS and the legacy launcher icon mask corners but never crop as hard as an adaptive icon.
LEGACY_SAFE = 0.66

SIZE = 1024


def ink_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    """The tight box around everything visible. Alpha only -- colour is not the question."""
    alpha = np.array(image.convert("RGBA"))[..., 3]
    ys, xs = np.where(alpha > 16)
    if len(xs) == 0:
        raise SystemExit(f"no visible pixels in the source mark")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def centred(mark: Image.Image, size: int, safe: float) -> Image.Image:
    """The mark OPTICALLY centred on a transparent square, scaled to fill `safe` of it.

    Optically, not geometrically. This wordmark has a long thin fork handle rising well above
    the letters, so its bounding box is much taller than the thing a person actually looks at.
    Centring that box drops the word "spoon" about a tenth of the canvas below the middle and
    leaves a conspicuous gap underneath -- which is roughly the fault this script exists to fix,
    reintroduced from the other direction.

    The eye centres on mass, so this does too: the alpha centroid goes to the middle, and the
    fork is allowed to overhang it. The shift is then clamped so the bounding box still fits
    inside the safe square, because an optically pleasing icon with its handle masked off is
    not an improvement.
    """
    cropped = mark.crop(ink_bbox(mark))
    budget = size * safe
    scale = min(budget / cropped.width, budget / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.LANCZOS,
    )

    alpha = np.array(resized)[..., 3].astype(float)
    total = alpha.sum()
    ys, xs = np.mgrid[0 : resized.height, 0 : resized.width]
    centroid_x = float((alpha * xs).sum() / total)
    centroid_y = float((alpha * ys).sum() / total)

    # Where the top-left goes if the centroid is to land dead centre.
    left = round(size / 2 - centroid_x)
    top = round(size / 2 - centroid_y)

    # Clamp so the whole mark stays inside the SAFE SQUARE -- the centred `safe` fraction of the
    # canvas -- not inside its own centred position, which would clamp every shift back to zero
    # and silently undo the optical centring above.
    safe_origin = (size - size * safe) / 2
    safe_limit = safe_origin + size * safe
    left = round(min(max(left, safe_origin), safe_limit - resized.width))
    top = round(min(max(top, safe_origin), safe_limit - resized.height))

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, (left, top), resized)
    return canvas


def recoloured(mark: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Every visible pixel to one colour, alpha untouched.

    Android draws a notification icon as an alpha SILHOUETTE: it throws away colour and fills
    what is left with the accent. A full-colour logo therefore arrives as a solid blob, which
    is what the cook app was shipping. Flattening to white here means what we preview is what
    the tray will draw.
    """
    out = np.array(mark.convert("RGBA"))
    out[..., 0], out[..., 1], out[..., 2] = rgb
    return Image.fromarray(out, "RGBA")


def diagonal_gradient(size: int, start: tuple[int, int, int], end: tuple[int, int, int],
                      mid: tuple[int, int, int]) -> Image.Image:
    """The designed tile's top-left to bottom-right sweep, rebuilt at full bleed.

    Rebuilt rather than upscaled from `auth/logo.png`, because that export is a rounded tile on
    a cream page: scaling it leaves cream in the corners, and the corners are exactly where a
    launcher's mask differs from ours. A gradient generated to the edges cannot show a seam
    whatever shape is cut out of it.
    """
    t = (np.add.outer(np.linspace(0, 1, size), np.linspace(0, 1, size)) / 2)[..., None]
    lo, hi = np.array(start, float), np.array(end, float)
    md = np.array(mid, float)
    # Two segments through the sampled midpoint, so the lighter middle of the real tile survives.
    first = lo + (md - lo) * np.clip(t / 0.5, 0, 1)
    second = md + (hi - md) * np.clip((t - 0.5) / 0.5, 0, 1)
    rgb = np.where(t < 0.5, first, second)
    out = np.dstack([rgb.astype(np.uint8), np.full((size, size, 1), 255, np.uint8)])
    return Image.fromarray(out, "RGBA")


def on_background(foreground: Image.Image, background: Image.Image) -> Image.Image:
    flat = background.copy()
    flat.alpha_composite(foreground)
    return flat.convert("RGB")


def write(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    print(f"  {path.relative_to(path.parents[3]) if len(path.parents) > 3 else path}")


def main() -> None:
    if not WORDMARK.exists():
        raise SystemExit(f"missing source wordmark: {WORDMARK}")
    mark = Image.open(WORDMARK).convert("RGBA")

    # Sampled from the designed tile in assets/figma/auth/logo.png.
    GRADIENT_START = (246, 226, 32)   # golden yellow, top-left
    GRADIENT_MID = (225, 254, 104)    # the lighter middle the design actually has
    GRADIENT_END = (212, 255, 35)     # lime, bottom-right
    BRAND_YELLOW = (255, 214, 0)      # the cook app's flat tile

    black = recoloured(mark, (0, 0, 0))
    white = recoloured(mark, (255, 255, 255))

    print("customer app:")
    customer = ROOT / "assets/images"
    gradient = diagonal_gradient(SIZE, GRADIENT_START, GRADIENT_MID, GRADIENT_END)
    write(on_background(centred(black, SIZE, LEGACY_SAFE), gradient), customer / "icon.png")
    write(gradient.convert("RGB"), customer / "android-icon-background.png")
    write(centred(black, SIZE, SAFE), customer / "android-icon-foreground.png")
    # Themed icons AND the notification tray read this one, and both use its alpha only.
    write(centred(white, SIZE, NOTIFICATION_SAFE), customer / "android-icon-monochrome.png")

    print("cook app:")
    cook = COOK_ROOT / "assets/images"
    yellow = Image.new("RGBA", (SIZE, SIZE), (*BRAND_YELLOW, 255))
    write(on_background(centred(black, SIZE, LEGACY_SAFE), yellow), cook / "app-icon.png")
    write(centred(black, SIZE, SAFE), cook / "android-icon-foreground.png")
    write(centred(white, SIZE, NOTIFICATION_SAFE), cook / "android-icon-monochrome.png")


if __name__ == "__main__":
    sys.exit(main())
