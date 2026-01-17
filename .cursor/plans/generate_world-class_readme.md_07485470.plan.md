---
name: Generate World-Class README.md
overview: Create a comprehensive, professional README.md file for the SocialSync social media management dashboard that follows the user's strict structure requirements and creates a stunning first impression on GitHub.
todos:
  - id: read-current-readme
    content: Read the current README.md to understand what needs to be replaced
    status: completed
  - id: generate-readme-content
    content: Generate the complete README.md content following all structure requirements with proper markdown formatting, badges, code blocks, and sections
    status: completed
    dependencies:
      - read-current-readme
  - id: write-readme-file
    content: Write the new README.md file to the root directory
    status: completed
    dependencies:
      - generate-readme-content
---

# Gener

ate World-Class README.md for SocialSync

## Overview

Generate a professional, developer-friendly README.md file that showcases the SocialSync social media management dashboard. The README will follow a strict structure with all required sections, badges, and detailed setup instructions.

## File to Create

- `README.md` (root directory) - Will replace the existing README.md

## Structure and Content

### 1. Header Section

- **Project Title**: Use "SocialSync" (as suggested by user)
- **Hero Image Placeholder**: Add markdown image placeholder for banner
- **Badges**: Generate shields.io badges for:
- License: MIT
- Node Version: >=16.0.0 (from package.json engines)
- Build Status: (placeholder)
- Made with ❤️ badge
- **Elevator Pitch**: 2-sentence hook about solving social media management

### 2. Key Features Section

- Use emoji-enhanced bullet points or 2-column table
- Highlight features from codebase:
- Live Dashboard (Dashboard.jsx, Analytics.jsx)
- Visual Calendar (FullCalendar.jsx, Calendar.jsx)
- Automated Scheduling (cron/scheduler.js)
- Analytics Tracking (real-time via Facebook Graph API - getPostStats in facebook.service.js)
- Secure OAuth (oauth.service.js, auth.controller.js)

### 3. Tech Stack Section

- **Frontend**: React, Vite, Tailwind CSS, React Icons (note: codebase uses react-icons, not Lucide React)
- **Backend**: Node.js, Express, MongoDB, Mongoose, Multer
- **DevOps/Tools**: Axios, node-cron, JWT, bcryptjs

### 4. Getting Started Section

- **Prerequisites**: Node.js >=16, MongoDB (local or Atlas), Facebook Developer App
- **Installation Steps**:

1. Clone command
2. Backend setup (cd backend, npm install)
3. Frontend setup (cd social-media, npm install)

### 5. Environment Configuration Section

- Detailed `.env` file template for `backend/.env`
- Include all variables from codebase:
- `PORT=4000`
- `MONGO_URI`
- `JWT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI`
- `INSTAGRAM_CLIENT_ID` (optional, uses Facebook)
- `INSTAGRAM_REDIRECT_URI`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `FRONTEND_URL`
- `BACKEND_URL`
- Add warning about Facebook App "Live Mode" vs "Dev Mode" (Dev Mode only works for app admins/testers)

### 6. Usage Guide Section

- Walkthrough of happy path: Connect → Create → Schedule → Track
- Mention "Nuclear Reset" fix: If Facebook permissions are missing, remove the app from Facebook Settings > Apps and Websites to reset OAuth scopes

### 7. Project Structure Section

- Clean file tree representation showing:
- `backend/` structure (config, controllers, routes, models, services, cron, utils)
- `social-media/` structure (src/api, src/components, src/pages, src/context, src/utils)

### 8. Contributing Section

- Standard open-source contribution guidelines

### 9. License Section

- MIT License

## Implementation Details

### Badge URLs

- License: `https://img.shields.io/badge/License-MIT-blue.svg`
- Node: `https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg`
- Build: `https://img.shields.io/badge/build-passing-brightgreen.svg` (placeholder)
- Made with: `https://img.shields.io/badge/Made%20with-❤️-red.svg`

### Key Information from Codebase

- Project uses `react-icons` (not Lucide React) - will note this in tech stack
- Facebook OAuth uses scopes: `pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,instagram_basic,instagram_content_publish`
- Analytics feature uses `getPostStats` function in `facebook.service.js` to fetch real-time engagement
- Cron scheduler runs every minute (from `cron/scheduler.js`)
- Frontend runs on port 5173 (Vite default)
- Backend runs on port 4000

### Tone and Formatting

- Professional yet enthusiastic
- Developer-friendly language
- Beautiful markdown with proper syntax highlighting
- Plenty of whitespace for readability
- Code blocks with language tags (bash, env, javascript, etc.)

## Notes

- The existing README.md will be replaced
- All information is based on actual codebase analysis