---
name: Deployment and Requirements Guide
overview: Create a comprehensive deployment guide (DEPLOYMENT_AND_REQUIREMENTS.md) covering Facebook/Instagram API requirements, LinkedIn API setup, production deployment checklist, and token management strategies for moving from localhost to production.
todos:
  - id: research-complete
    content: Research codebase for current implementation details (scopes, tokens, file storage, environment variables)
    status: completed
  - id: create-guide-structure
    content: Create DEPLOYMENT_AND_REQUIREMENTS.md with all 4 main sections and subsections
    status: completed
  - id: write-facebook-section
    content: Write comprehensive Facebook & Instagram requirements section (permissions, app modes, business verification, app review)
    status: completed
  - id: write-linkedin-section
    content: Write LinkedIn API requirements section with scopes and token management
    status: completed
  - id: write-deployment-checklist
    content: Write production deployment checklist (HTTPS, domain verification, env vars, file storage)
    status: completed
  - id: write-token-management
    content: Write token management strategy section (long-lived tokens, refresh strategy, maintenance)
    status: completed
  - id: add-code-examples
    content: Add code examples for token exchange, environment variables, and API endpoints
    status: completed
  - id: format-and-polish
    content: Format with emojis, warning blocks, checklists, and ensure technical accuracy
    status: completed
---

# Depl

oyment and Requirements Guide Plan

## Overview

Create `DEPLOYMENT_AND_REQUIREMENTS.md` - a comprehensive technical guide covering all requirements and steps needed to move SocialSync from localhost development to production with real users and analytics.

## Research Findings

### Current Implementation Analysis

- **Facebook OAuth**: Uses short-lived tokens (1 hour) - no long-lived token exchange implemented
- **LinkedIn OAuth**: Stores refresh tokens in Account model, handles token expiration
- **File Storage**: Uses local `uploads/` folder (will not work on serverless platforms)
- **Facebook Scopes**: Includes `read_insights` which requires App Review
- **Environment Variables**: All redirect URIs use `localhost` - must change for production
- **Token Management**: No automatic token refresh for Facebook (only LinkedIn has refresh logic)

### Key Files to Reference

- `backend/services/oauth.service.js` - OAuth URL generation with scopes
- `backend/controllers/auth.controller.js` - Token exchange logic
- `backend/services/facebook.service.js` - Insights API calls and file upload handling
- `backend/models/Account.model.js` - Token storage structure
- `backend/utils/upload.js` - File upload configuration

## Guide Structure

### 1. Facebook & Instagram Requirements

- **Permissions Matrix**: Detailed breakdown of scopes:
- Posting: `pages_manage_posts`, `instagram_content_publish`
- Analytics: `read_insights`, `pages_read_engagement`
- Basic: `pages_show_list`, `instagram_basic`
- **App Modes**: Development vs Live Mode explanation
- **Business Verification**: When required (Tech Provider vs Individual)
- **App Review Process**: Step-by-step submission guide with required assets

### 2. LinkedIn API Requirements

- Required scopes: `w_member_social`, `openid`, `profile`, `email`
- Token lifespan: 60 days (access), refresh token handling
- Current implementation notes

### 3. Deployment & Production Checklist

- HTTPS requirement for Facebook callbacks
- Domain verification in Facebook Business Manager
- Environment variable migration (localhost → production URLs)
- File storage solutions (AWS S3 / Cloudinary recommendation)
- Serverless vs VPS considerations

### 4. Token Management Strategy

- Facebook: Short-lived (1 hour) vs Long-lived (60 days) tokens
- Long-lived token exchange endpoint implementation
- Token refresh strategy for production
- Maintenance schedule (re-login every 2 months)

## Implementation Details

### Content Sections

1. **Facebook & Instagram Requirements**

- Permission scopes table with use cases
- Development Mode limitations
- Live Mode requirements
- Business Verification process
- App Review submission checklist
- Review Instructions template

2. **LinkedIn API Requirements**

- Scope requirements
- Token management
- Refresh token flow

3. **Production Deployment Checklist**

- Pre-deployment requirements
- Environment variable changes
- HTTPS setup
- Domain verification steps
- File storage migration
- Database considerations

4. **Token Management**

- Current implementation analysis
- Long-lived token exchange code example
- Token refresh strategy
- Maintenance procedures

## Technical Accuracy Requirements

- Reference actual scopes from `backend/services/oauth.service.js` (line 99)
- Include actual environment variable names from codebase
- Reference file upload implementation from `backend/utils/upload.js`
- Note current token management gaps (Facebook long-lived tokens)
- Include code examples for token exchange endpoints

## Formatting Requirements

- Use emojis for visual hierarchy (as requested)
- Include warning blocks for critical steps
- Use checklists for actionable items
- Code blocks for environment variables and API endpoints
- Clear section headers with numbering