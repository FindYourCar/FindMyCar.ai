# Model images for Live market cards

The card picture must always match the card title. Resolution order lives in
`lib/marketplaces/modelImage.ts`:

1. An explicit entry in `MODEL_IMAGE_MAP`
2. `/images/models/{make}-{model}-{generation}.jpg`
3. `/images/models/{make}-{model}.jpg`
4. `_placeholder.svg` (neutral, brand-free)

## Adding a real photo

Drop the file in this folder using the convention — no code change needed:

```
volkswagen-golf-8.jpg     ← "Volkswagen Golf 8" / "Golf VIII" / "Golf Mk8"
volkswagen-golf-7.jpg
toyota-yaris-4.jpg
bmw-seria-3.jpg
```

Names are lowercased and non-alphanumerics become `-`. Generations are
normalised to a bare number, so `8`, `VIII`, `Mk8` and `8th gen` all map to `-8`.

## Rules

- **Only add a photo you have actually looked at.** The bug this system replaced
  was a stock-photo map where `volkswagen:golf` pointed at a Ford Mustang.
- **Only self-hosted assets.** Don't hotlink stock libraries — we can't verify
  the subject, and the URL can change under us.
- Use a licensed or owned image. Landscape, ideally ~1200×525 (the card crops to
  16:7).
- If you have no verified photo, add nothing. The placeholder is the correct
  answer — a neutral graphic beats a confidently wrong car.
