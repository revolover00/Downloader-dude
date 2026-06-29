# 🚀 Downloader dude — Universal Media Downloader

<p align="center">
  <img src="/public/favicon.svg" width="120" height="120" alt="Downloader dude Logo" />
</p>

<p align="center">
  <strong>The fastest and easiest full-stack web utility to download videos, reels, photos, and albums from top social media platforms instantly, for free, and without watermarks.</strong>
</p>

<p align="center">
  <a href="https://downloaderdude.com/">🌐 Web App</a> •
  <a href="#-key-features">✨ Features</a> •
  <a href="#-technical-architecture">🏗️ Architecture</a> •
  <a href="#-project-structure">📁 Directory Layout</a> •
  <a href="#-local-setup--development">💻 Local Run</a>
</p>

---

## 📖 About the Project

**Downloader dude** is a high-performance, responsive full-stack media downloader designed to fetch and package public media (videos, photos, multi-image albums, and audio formats) from popular social media platforms.

The application acts as a secure server-side proxy to circumvent cross-origin resource sharing (CORS) blocks and browser download restrictions. It retrieves original high-quality CDN endpoints directly from social media platforms, rendering them beautifully to the client inside an elegant **Bento Grid** container styled with rich, eye-safe typography, dynamic visual effects, and strict SEO, GEO, and AEO optimization.

---

## ✨ Key Features

*   **⚡ Smart Multi-Image & Story Scrapers**:
    *   **Instagram**: Fully extracts multi-slide carousel posts (combining both photos and videos) seamlessly.
    *   **Pinterest**: Features an advanced v2 custom scraper that parses underlying page models and recursive JSON matrices (`#__PWS_DATA__` and `initial-state`) to systematically extract all images from **Story/Idea Pins** and **Carousel Albums** instead of just fetching the initial fallback image.
*   **🚫 Watermark-Free Content**: Fetches raw media directly from TikTok, Instagram, and Pinterest source servers, ensuring pristine, original resolution without logos or overlay promotions.
*   **📋 One-Click Intelligent Paste**: Integrates native Clipboard API controls allowing users to grant clipboard permissions for instantaneous pasting and automated processing on mobile and desktop browsers alike.
*   **📱 Bento Grid Responsive UI**: Organizes extracted media into clean, responsive cards featuring thumbnails, platform labels, media descriptions, resolution indicators, and high-contrast, direct CDN download triggers.
*   **🔍 SEO, GEO & AEO Ready**:
    *   Features a comprehensive `<head>` metadata layout designed for indexability, complete with canonical routing, structured JSON-LD payloads, Open Graph tags, and customizable robots rules.
    *   Adheres to strict performance practices to guarantee low Cumulative Layout Shift (CLS < 0.1) and rapid Largest Contentful Paint (LCP < 2.5s) to satisfy Google’s Core Web Vitals requirements.

---

## 🗺️ Supported Platforms

| Platform | Supported Media | Highlights & Features | Icon |
| :--- | :--- | :--- | :---: |
| **TikTok** | Videos, Slideshows, Audios | No watermark, MP3 extraction, individual album photos | 🎵 |
| **Instagram** | Reels, Carousel Posts, Photos | Full FHD support, handles combined video/photo carousels | 📸 |
| **Pinterest** | Standard Pins, Idea Pins, Carousels | High-resolution image/video discovery, recursive JSON parsing | 📌 |
| **YouTube** | Videos, Shorts, MP3 Audio | High-definition formats, fast server-side processing | 🎥 |
| **Twitter / X** | Videos, Animated GIFs, Images | Choice of multiple video bitrates and dimensions | 🐦 |
| **Snapchat** | Public Stories, Spotlight Reels | High-speed direct downloads | 👻 |
| **SoundCloud** | Audio Tracks | Pristine MP3 format downloads | 🎧 |

---

## 🏗️ Technical Architecture

Adhering to strict, professional software engineering best practices, **Downloader dude** features:

1.  **Strict Modularization (150-Line Guideline)**: Frontend layouts and controllers are split into self-contained, highly legible React components and route handlers, eliminating giant, unmaintainable single-file script structures.
2.  **Total Separation of Concerns**:
    *   `server/`: Houses the downstream web scrapers, proxy algorithms, and client asset managers.
    *   `hooks/`: Processes asynchronous loading states, validation patterns, and native pasting integrations.
    *   `components/`: Reusable, highly optimized presentational UI components.
3.  **Maximum Security (Zero Client-Side Keys)**: All third-party scrapers, API keys, and downstream endpoints are handled exclusively on the backend (`server.ts` and `/server/*`) to prevent leakages and browser-based token extraction.
4.  **Robust Async State Machine**: Implements `useMediaDownloader` to orchestrate multi-step transitions, validate raw inputs, and present friendly feedback upon failures.

---

## 📁 Project Structure

```
├── /server.ts                 # Main Express server and Single-Page Application (SPA) router
├── /server/                   # Backend services and custom platform scrapers
│   ├── downloadController.ts   # Express request controllers, validator, and error handlers
│   ├── downloaderService.ts    # Main scraper router connecting with Cobalt and MediaSnap engines
│   ├── instagramService.ts     # Specialized Instagram Reels, carousel, and IGTV scraper
│   └── pinterestService.ts     # Advanced Pinterest Idea Pins, carousels, and image-harvesting engine
├── /src/                      # Frontend Client-Side Application (React + Vite)
│   ├── App.tsx                # App layout, bento grids, and background glow styling
│   ├── index.css              # Custom font bindings and global Tailwind utility imports
│   ├── main.tsx               # Client entry point and React root rendering
│   ├── types/
│   │   └── index.ts           # Strict TypeScript interfaces and state models
│   ├── hooks/
│   │   └── useMediaDownloader.ts # React custom hook orchestrating scraper requests
│   └── components/            # Visual React components
│       ├── Header.tsx         # Responsive header showcasing supported platforms
│       ├── SearchInput.tsx    # Link input panel with native paste integration
│       ├── DownloadResult.tsx # Bento grid rendering download choices and quality controls
│       └── Footer.tsx         # Platform rules, developers context, and disclaimers
├── /public/                   # Static SEO and PWA assets
│   ├── favicon.svg            # Crisp, scalable brand logo
│   ├── robots.txt             # Web-crawler rules mapping indexed directories
│   ├── sitemap.xml            # Indexed site map of active landing pages
│   └── manifest.json          # Progressive Web App configuration for native mobile look
├── vercel.json                # URL rewrite configurations to support SPA path routing
├── vite.config.ts             # Vite build pipeline configuration
└── tsconfig.json              # Strict TypeScript compiler options
```

---

## 💻 Local Setup & Development

### Prerequisites:
*   **Node.js** (v18 or higher recommended).
*   **npm** or **yarn** package manager.

### Step-by-Step Run Guide:

1. **Install Dependencies**:
   Retrieve and compile all frontend and backend npm packages:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Establish a local environment variable settings configuration file:
   ```bash
   cp .env.example .env
   ```

3. **Launch the Development Server**:
   Start the Express server bundled with hot-reloading Vite asset middleware:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your favorite web browser.*

4. **Prepare Production Build**:
   To compile, bundle, and optimize the application for live production deployment:
   ```bash
   npm run build
   ```
   Launch the compiled, self-contained standalone server:
   ```bash
   npm run start
   ```

---

## 🔒 Legal Disclaimer

*   **Downloader dude** is an educational, helper utility designed to download public media for personal archiving, educational research, and offline viewing under legal fair-use regulations.
*   This application does *not* host, clone, re-upload, or redistribute any media on its servers. All media is streamed/downloaded directly from the platforms' public CDNs to the client's local storage. The final user holds full responsibility for respecting intellectual property rights and adhering to the copyright policies of the respective platforms.

---

<p align="center">
  Engineered with absolute precision, speed, and design integrity. 💖
</p>
