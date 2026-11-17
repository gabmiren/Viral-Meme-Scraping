# Viral Meme Radar

A browsable page of the viral short-form formats found by the daily Treg scans, built for picking ideas fast.

Open it: https://gabmiren.github.io/Viral-Meme-Scraping/

## What's on the page
- **TikTok**: top 50 formats from the last 7 days, each with hook, what happens, why it works, a futures-trading version and how to make it.
- **Instagram**: top 50 reels from the last 14 days (written from captions).
- **★ Saved**: ideas you starred. Saved in your browser.
- **Daily finds**: new outliers from each 24-hour scan, newest day first.
- **All outliers**: everything else, searchable.

Tips: press `/` to search, tap the blue trading line to copy it, ✓ marks an idea as made, and "Hide used" clears those out.

## Updating after a scan
1. Replace the CSVs in `data/` (`top50.csv`, `top50_ig.csv`, `remainder.csv`, `remainder_ig.csv`, `daily.csv`) and edit `data/meta.json`.
2. Run `python3 scripts/build_data.py` to rebuild `data.js`.
3. Commit and push. GitHub Pages updates in about a minute.
