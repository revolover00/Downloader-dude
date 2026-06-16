# Universal Media Downloader

An elegant, robust, and lightning-fast media downloader utility built with a TypeScript full-stack architecture (Express and React). Extract high-quality videos, images, and audio directly from popular social feeds without registration or watermarks.

## About the Project

Universal Media Downloader is a high-performance web utility that allows users to capture public media from a wide list of feeds, facilitating offline archiving and references. By relying on a lightweight backend proxy, it securely parses direct, CDN-hosted media streams from platforms like TikTok, X, and YouTube, bypassing complex client-side CORS issues and displaying them in an intuitive, responsive dashboard.

## Key Features

- **Multi-Platform Capabilities**: Seamless support for YouTube (Shorts & videos), TikTok, X (Twitter), Instagram, Snapchat, Threads, SoundCloud, Spotify, and more.
- **Bento Card Results Grid**: Parsed links are presented elegantly with a live video thumbnail, platform tag, duration indicators, and separate files for each format.
- **Micro-Actions**: Instant copy-to-clipboard trigger buttons alongside safe direct download anchors.
- **Clipboard Fast Paste**: One-click button to automatically paste URLs from the device clipboard with appropriate browser fallback security.
- **No Watermarks**: Delivers unwatermarked, high-speed CDN source endpoints whenever supported.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React (vector interface icons)
- **Backend**: Node.js, Express (API routes, static hosting, and Vite development middleware proxy)
- **Engine Core**: `mediasnap` (custom high-performance scraping and media extraction parser)
- **Module System**: Compiled using Vite for fast asset delivery, bundled into a single CommonJS node module using `esbuild` for production servers.

## Project Structure

```
├── /server.ts               # Express bootstrapper & static hosting fallback
├── /server/
│   ├── downloadController.ts # JSON validation, rate control & route response handler
│   └── downloaderService.ts  # Media parsing service using mediasnap wrapper
├── /src/
│   ├── App.tsx              # Main layout, router & background glow decorations
│   ├── index.css            # Custom fonts and global overrides
│   ├── main.tsx             # DOM React client mounting entry
│   ├── types/
│   │   └── index.ts         # Strictly-typed interfaces for the states
│   ├── hooks/
│   │   └── useMediaDownloader.ts # Custom async state hook managing API fetches
│   └── components/          # Extracted pure presentational components
│       ├── Header.tsx       # Brand typography & supported platform list
│       ├── SearchInput.tsx  # Dynamic paste-inputs and submit actions
│       ├── ResultDetails.tsx# Extracted download links groups
│       └── Footer.tsx       # Safety disclaimers and terms details
├── package.json             # App configurations, dependencies & scripts
└── tsconfig.json            # Strict TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js version 18.0.0 or higher
- npm or yarn package manager

### Local Setup Instructions

1. **Clone or Extract the folder**:
   Ensure you are in the directory containing the project.

2. **Install Dependencies**:
   Install all package files for both client and backend:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   A `.env.example` file is included at the root level. Customize its credentials or copy it to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Launch Development Mode**:
   Launch the dual client-server development process. Express binds to `0.0.0.0:3000` and configures hot module asset handling via the built-in Vite dev middlewares:
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000) to view the tool.

### Production Build & Launch

To prepare the repository for production deployment or severe containers:

1. **Produce the Production Build**:
   Combines client-side Vite minifiers on static assets and bundles the Express server file (`server.ts`) into a standalone CommonJS output `/dist/server.cjs`:
   ```bash
   npm run build
   ```

2. **Run the Standalone Build**:
   ```bash
   npm run start
   ```

## Deployment

The application is fully configured and optimized for zero-configuration deployments on serverless systems (e.g., **Google Cloud Run**). It binds automatically to host `0.0.0.0` and port `3000` inside the build artifact for production execution.
