# Tanjid Shuvro Portfolio

Static site for GitHub Pages with a custom domain. No build step.

## Structure

```
index.html            Main page
404.html              Custom not-found page (GitHub Pages serves it for any missing URL)
assets/css/style.css  All styles (design tokens at the top)
assets/js/main.js     Navigation, gallery, lightbox, contact dialog
assets/favicon.svg    Site icon
data/gallery.json     Gallery photo list
robots.txt, sitemap.xml, .nojekyll
```

Keep your existing `CNAME` file in the repository root.

## Add a gallery photo

Open `data/gallery.json` and add an object to the `photos` array:

```json
{
  "src": "assets/images/gallery/my-photo.jpg",
  "title": "ছবির শিরোনাম",
  "category": "কর্মশালা",
  "date": "২৯ অক্টোবর ২০২৬",
  "featured": true
}
```

- `src` and `title` are required. `category`, `date`, `thumb` (smaller preview image) and `featured` are optional.
- `featured: true` puts the photo in the top slider (first 8 are used). Every photo appears under "সব ছবি দেখুন".
- New categories become filter buttons automatically.
- Encode spaces in file names as `%20`, or better, avoid spaces in file names.
- Tip: resize photos to about 1600px wide and compress them before upload.

## Add a new workshop

In `index.html`, find the `event-feature` block under `#workshops`. Change the title, organizer and the `data-event-date="YYYY-MM-DD"` value. The badge switches between "আসন্ন", "আগামীকাল", "আজ" and "সম্পন্ন" on its own.

## Notes

- Test locally with a small server (`python3 -m http.server`), because `fetch` does not work from `file://`. If the JSON cannot load, the gallery shows a short built-in fallback list.
- The 404 page uses root-relative paths (`/assets/...`), which is correct for a custom domain served from the root.
