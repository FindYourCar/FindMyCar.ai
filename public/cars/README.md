# Curated car images

Local, watermark-free imagery only. Everything the app renders for a car comes
from `lib/carImages` — components never pick images themselves.

## Sources

Use **Unsplash** or **Pexels** only. Both are free for commercial use and neither
requires attribution. Do not use paid automotive image APIs, and never use a
source that stamps a watermark (the imagin.studio demo bucket does — avoid it).

## Adding an image

1. Download a clean landscape photo of the car.
2. Save it at the exact path below (lowercase, hyphenated).
3. That's it — no code change. The catalog already points at these paths.

Recommended: ~1200×525 (cards crop to 16:7), JPEG, under ~250 KB.

## Files still to add

Seeded models — each needs its photo:

```
public/cars/volkswagen/golf.jpg
public/cars/skoda/octavia.jpg
public/cars/audi/a3.jpg
public/cars/bmw/3-series.jpg
public/cars/mercedes-benz/a-class.jpg
public/cars/seat/leon.jpg
public/cars/renault/clio.jpg
public/cars/peugeot/208.jpg
```

Optional make-level fallbacks (used when the model isn't in the catalog):

```
public/cars/volkswagen/_make.jpg
public/cars/skoda/_make.jpg
public/cars/audi/_make.jpg
public/cars/bmw/_make.jpg
public/cars/mercedes-benz/_make.jpg
public/cars/seat/_make.jpg
public/cars/renault/_make.jpg
public/cars/peugeot/_make.jpg
```

Generic fallback (optional — an SVG placeholder already ships):

```
public/cars/fallback/car-placeholder.jpg
```

## Already present

```
public/cars/fallback/car-placeholder.svg   ← committed, always resolves
```

## Rules

- **Only add a photo you have actually looked at.** The system this replaced had
  a "Volkswagen Golf" entry pointing at a photo of a Ford Mustang.
- Match by make + model, not trim. One clean Golf photo covers Golf 7, Golf 8
  and Golf GTI — add aliases in `lib/carImages/carImageMap.ts` instead of files.
- No hotlinking. Download and host it here; remote URLs drift and can't be audited.
- If you have no verified photo, add nothing. The placeholder is the correct
  answer — a neutral graphic beats a confidently wrong car.
