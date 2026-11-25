# Trading meme account (Halcyon 3 Instagram)

The record of every meme we've approved and scheduled for @halcyonintern. Use it as the filing system and as the base for reporting later on.

## Files
- `posts.csv`: one row per approved post. It has the post time (MYT and US Eastern), the on-screen text, the caption, the footage, the reference video we recreated, the Drive file and the Metricool post id.
- `metrics.csv`: weekly numbers per post (views, reach, likes, comments, shares, saves, follows). It starts empty and gets a new block of rows each week.

## Where things live
- Finished videos: the Meme Account folder in Google Drive (Halcyon Trading › Meme Account). Each row in `posts.csv` links to its file or to the folder.
- Scheduling: Metricool, Halcyon 3 brand. `metricool_uuid` stays the same even when a post is rescheduled.
- Idea list and rankings: the "Trading Memes: Recreation Ideas" sheet. `idea_rank` points back to it.

## Adding a week of numbers
1. Fill in the week's numbers in the tracking sheet.
2. Copy them into `metrics.csv`, one row per post, with that week's label (e.g. `Week 1 (23-29 Nov)`).
3. Add any new posts to `posts.csv` with the next `post_id` (M014, M015, ...).

Post ids run in posting order: M001 is the first post.
