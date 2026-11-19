# What Is It Made Of?

[Open the website](https://yanwugirl.github.io/Ryan-Week5/)

An interactive version of my Week 5 film for ARTD6231 Ideas in Art and Technology.

One falling circle, many sounds. The circle never changes; only the sound does. You can watch each version **alone** or **in a row**, say what you think the circle is made of each time, and then compare your answers side by side.

## Why

After Week 5, Ryan pointed out that watching four versions in a row creates an impression that the same versions alone, or in other groupings, would not necessarily create. This page lets the viewer test that on themselves.

## How to use

1. Turn your sound on.
2. **Alone**: click a card to watch one version with nothing before or after it, then choose a material.
3. **In a row**: play the versions one after another (film order, shuffled, or reversed) and answer after each.
4. **Your answers**: see your answer for each version alone beside your answer in a row. Answers that changed with the context are highlighted.

Answers are saved only in your own browser.

## Versions

| | Name | Sound | Timing |
|---|---|---|---|
| 01 | Silence | none | none |
| 02 | Dry knock | short, dry | on contact |
| 03 | Ring | resonant tone | on contact |
| 04 | Late ring | resonant tone | 0.3 s late |
| 05 | Early knock | short, dry | 0.15 s early (new) |
| 06 | Heavy thud | low, dull | on contact (new) |
| 07 | Glass | bright, short ring | on contact (new) |

01–04 are the four versions from the original film. 05–07 are new.

## Files

- `index.html`: page structure and text
- `versions.js`: the list of versions
- `app.js`: bounce motion, sounds (Web Audio API), the two viewing modes and saved answers
- `style.css`: layout
- `What_Is_It_Made_Of.mp4`: the original Week 5 film

All sounds are synthesised in the browser so each one lines up exactly with the moment of contact. No libraries are needed.

## References

- Chion, M. (1994) *Audio-Vision: Sound on Screen*. Edited and translated by C. Gorbman. New York: Columbia University Press.
- Mera, M. (2026) Guest lecture on sound and image, ARTD6231, University of Southampton, Week 5.
