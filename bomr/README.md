# Book of Mormon Random Image Viewer

A minimalist web experience that displays a randomly selected reverent, symbolic, and artistic image inspired by The Book of Mormon on every page load.

## Features

- Full-screen image display with no interface or controls
- Random image selection on each refresh
- Static hosting compatible (no server-side logic required)
- Client-side only, works offline after initial load
- Right-click/long-press for native browser image actions

## Setup

1. Add image files to the `images/` directory
2. Run `node generate-manifest.js` to update the manifest
3. The site is ready to deploy as static files

## Technical Details

- Images are listed in `manifest.json` for fast loading
- Random selection happens client-side
- Supports common image formats (JPG, PNG, GIF, WebP)
- Responsive design that fills the viewport