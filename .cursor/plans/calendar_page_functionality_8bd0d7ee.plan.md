---
name: Calendar Page Functionality
overview: Make the Calendar page fully functional by implementing Quick Scheduling (pre-filling date when clicking a day), improving scheduled post display (show on mobile, correct platform icons, caption previews), and adding post interaction capabilities (view/edit scheduled posts).
todos: []
---

# Calendar Page Functionality Implementation

## Overview

The Calendar page currently has basic structure but needs full functionality for displaying scheduled posts and enabling Quick Scheduling via the modal. This plan addresses three main areas: Quick Scheduling, Post Display, and Post Interaction.

## Current State Analysis

### Existing Components

- **[social-media/src/pages/Calendar.jsx](social-media/src/pages/Calendar.jsx)**: Main calendar page with month navigation and Schedule Post button
- **[social-media/src/components/FullCalendar.jsx](social-media/src/components/FullCalendar.jsx)**: Calendar grid that displays scheduled posts (currently limited)
- **[social-media/src/components/ScheduleModal.jsx](social-media/src/components/ScheduleModal.jsx)**: Modal for scheduling posts (doesn't pre-fill date)
- **[social-media/src/context/AppContext.jsx](social-media/src/context/AppContext.jsx)**: Context managing scheduled posts and scheduling functions

### Issues Identified

1. **Quick Scheduling**: Clicking a day doesn't pre-fill the date in the modal
2. **Post Display**: Posts are hidden on mobile (`hidden sm:block`), show hardcoded Instagram icon, only display time
3. **Post Interaction**: No way to view/edit/delete scheduled posts from calendar

## Implementation Plan

### 1. Quick Scheduling Feature

**File: [social-media/src/pages/Calendar.jsx](social-media/src/pages/Calendar.jsx)**

- Add state to track selected day for Quick Scheduling
- Modify `onDayClick` handler to pass selected date to modal
- Update modal opening to accept and use pre-filled date

**File: [social-media/src/components/ScheduleModal.jsx](social-media/src/components/ScheduleModal.jsx)**

- Add `initialDate` prop to pre-fill date field
- Update date input to use `initialDate` when provided
- Reset `initialDate` when modal closes

**File: [social-media/src/components/FullCalendar.jsx](social-media/src/components/FullCalendar.jsx)**

- Update `onDayClick` to pass full date object (year, month, day) instead of just day number
- Format date as YYYY-MM-DD for date input compatibility

### 2. Enhanced Post Display

**File: [social-media/src/components/FullCalendar.jsx](social-media/src/components/FullCalendar.jsx)**

- Remove `hidden sm:block` class to show posts on mobile
- Replace hardcoded Instagram icon with dynamic platform icons
- Add platform icon helper function (similar to Dashboard.jsx)
- Show caption preview (truncated) in addition to time
- Display multiple platforms if post targets multiple platforms
- Improve visual styling for better mobile responsiveness
- Add indicator for posts with multiple platforms

### 3. Post Interaction (View/Edit)

**File: [social-media/src/pages/Calendar.jsx](social-media/src/pages/Calendar.jsx)**

- Add state for selected post (for viewing/editing)
- Add function to handle post click from calendar
- Create or enhance post detail/edit modal component

**File: [social-media/src/components/FullCalendar.jsx](social-media/src/components/FullCalendar.jsx)**

- Make post items clickable (separate from day click)
- Add `onPostClick` prop to handle post selection
- Prevent day click event from firing when clicking on post

**New File: [social-media/src/components/PostDetailModal.jsx](social-media/src/components/PostDetailModal.jsx)** (if needed)

- Create modal to display post details
- Show full caption, platforms, scheduled date/time
- Add edit and delete buttons
- Integrate with post API for updates/deletes

**File: [social-media/src/context/AppContext.jsx](social-media/src/context/AppContext.jsx)**

- Ensure `loadPosts` is called after post updates/deletes
- Add delete post function if not already present

## Data Flow

```javascript
User clicks day → Calendar.jsx → Opens ScheduleModal with pre-filled date
User clicks post → FullCalendar.jsx → Calendar.jsx → Opens PostDetailModal
User schedules post → ScheduleModal → AppContext.schedulePost → API → Reload posts
User edits post → PostDetailModal → API → Reload posts
```



## Technical Details

### Date Formatting

- Use `YYYY-MM-DD` format for date inputs (HTML5 date input standard)
- Convert between Date objects and string formats as needed
- Handle timezone considerations for scheduled dates

### Platform Icons

- Use Font Awesome icons: `fab fa-facebook`, `fab fa-linkedin`, `fab fa-instagram`
- Match the pattern used in Dashboard.jsx for consistency

### Mobile Responsiveness

- Ensure calendar cells are touch-friendly
- Make post items visible and clickable on mobile
- Consider truncation for long captions

## Testing Considerations

- Verify Quick Scheduling pre-fills correct date when clicking different days