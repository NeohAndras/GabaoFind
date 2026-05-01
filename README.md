# GabaoIndex

GabaoIndex is a Gabon business directory with:
- searchable listings
- category filtering
- map view
- hero carousel
- admin panel for content management
- Firebase-backed content and uploads

## Project structure

- `index.html` — public site
- `admin.html` — admin panel
- `app.js` — public site logic
- `admin-server.js` — local admin server
- `firebase-config.js` — Firebase initialization
- `data.json` — seed content
- `style.css` — site styles
- `manifest.json` — PWA metadata
- `sw.js` — service worker
- `img/` — local assets

## Development

Install dependencies:

```bash
npm install
```

Run the local admin server:

```bash
npm start
```

Run a static preview:

```bash
npm run dev
```

## Notes

- Admin access uses Firebase Auth.
- Listings and brand content are stored in Firestore.
- Image/logo uploads use Firebase Storage and Cloudinary from the admin panel.
