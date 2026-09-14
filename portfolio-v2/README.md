# portfolio-v2

Static alternate homepage for iterative portfolio refinement without changing the current root site.

## Files

- `/portfolio-v2/index.html`
- `/portfolio-v2/styles.css`
- `/portfolio-v2/README.md`

## GitHub Pages preview

- Production-style preview URL: `https://carolbales.github.io/portfolio-v2/`
- Because `index.html` references `styles.css` relatively, the alternate page works from the `/portfolio-v2/` path on GitHub Pages without build tooling.

## Local review

From the repository root, serve the site with a static server, for example:

```bash
cd /home/runner/work/carolbales.github.io/carolbales.github.io
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/portfolio-v2/`

## Promote this version to the root later

1. Back up the current root homepage if needed:
   ```bash
   cp /home/runner/work/carolbales.github.io/carolbales.github.io/index.html /home/runner/work/carolbales.github.io/carolbales.github.io/index.html.bak
   ```
2. Copy the alternate homepage into the site root:
   ```bash
   cp /home/runner/work/carolbales.github.io/carolbales.github.io/portfolio-v2/index.html /home/runner/work/carolbales.github.io/carolbales.github.io/index.html
   cp /home/runner/work/carolbales.github.io/carolbales.github.io/portfolio-v2/styles.css /home/runner/work/carolbales.github.io/carolbales.github.io/styles.css
   ```
3. Verify the root page renders correctly and that links to existing case studies still resolve.
4. If the new root version is accepted, keep `/portfolio-v2/` as a draft archive or remove it in a follow-up change.

Because the mini-site uses a relative stylesheet reference (`styles.css`) and links existing case-study paths with absolute URLs, promotion only requires copying the two files above.
