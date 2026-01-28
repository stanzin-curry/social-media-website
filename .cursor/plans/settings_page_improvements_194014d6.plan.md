---
name: Settings Page Improvements
overview: Transform the Settings page from a static UI with hardcoded values into a fully functional page with state management, API integration, form validation, and proper user feedback.
todos:
  - id: connect-auth-context
    content: Connect Settings page to AuthContext to get current user data and replace hardcoded values
    status: completed
  - id: implement-state-management
    content: Convert inputs to controlled components with useState and track form changes
    status: completed
    dependencies:
      - connect-auth-context
  - id: add-profile-update
    content: Implement Save Changes functionality using userAPI.updateProfile with loading states
    status: completed
    dependencies:
      - implement-state-management
  - id: add-form-validation
    content: Add email format validation, required field checks, and inline error display
    status: completed
    dependencies:
      - implement-state-management
  - id: add-user-feedback
    content: Add success/error notifications using AppContext and loading indicators
    status: completed
    dependencies:
      - add-profile-update
  - id: extend-user-model
    content: Add fullName, companyName, and notificationPreferences fields to User model
    status: completed
  - id: update-user-controller
    content: Update updateProfile controller to handle new fields and notification preferences
    status: completed
    dependencies:
      - extend-user-model
  - id: implement-notification-preferences
    content: Connect notification checkboxes to state and save functionality
    status: completed
    dependencies:
      - update-user-controller
      - implement-state-management
  - id: add-password-change
    content: Add password change section with backend endpoint and validation
    status: completed
  - id: implement-delete-account
    content: Create delete account backend endpoint and frontend confirmation flow
    status: completed
---

# Settings Page Improvements

## Current Issues Identified

1. **Hardcoded values**: Profile fields show static data instead of actual user data
2. **No state management**: Inputs use `defaultValue` instead of controlled components
3. **No API integration**: Save Changes button doesn't do anything
4. **Missing backend support**: 

- No notification preferences in User model
- No delete account endpoint
- No "Company Name" field in User model

5. **No form validation**: No validation for email format, required fields, etc.
6. **No user feedback**: No loading states, success messages, or error handling
7. **Missing features**: No password change functionality

## Implementation Plan

### Phase 1: Core Functionality (Essential)

1. **Connect to AuthContext** ([`social-media/src/pages/Settings.jsx`](social-media/src/pages/Settings.jsx))

- Import `useAuth` hook to get current user data
- Replace hardcoded values with actual user data from context
- Handle loading state while user data is fetched

2. **Implement State Management**

- Convert inputs to controlled components using `useState`
- Initialize state from user data
- Track form changes (dirty state)

3. **Add Profile Update Functionality**

- Use existing [`social-media/src/api/user.api.js`](social-media/src/api/user.api.js) `updateProfile` method
- Connect Save Changes button to API call
- Update AuthContext user state after successful save
- Add loading state during save operation

4. **Add Form Validation**

- Validate email format
- Validate required fields (username, email)
- Show validation errors inline
- Disable save button when form is invalid

5. **Add User Feedback**

- Use AppContext `addNotification` for success/error messages
- Show loading spinner on Save button during API call
- Display error messages if save fails

### Phase 2: Backend Enhancements (Recommended)

6. **Extend User Model** ([`backend/models/User.model.js`](backend/models/User.model.js))

- Add optional `fullName` field
- Add optional `companyName` field
- Add `notificationPreferences` object with:
    - `postPublished: Boolean`
    - `postFailed: Boolean`

7. **Update User Controller** ([`backend/controllers/user.controller.js`](backend/controllers/user.controller.js))

- Update `updateProfile` to handle `fullName`, `companyName`, and `notificationPreferences`
- Add validation for notification preferences

8. **Implement Notification Preferences**

- Connect checkboxes to state
- Save preferences when Save Changes is clicked
- Load preferences from user data

### Phase 3: Additional Features (Nice to Have)

9. **Add Password Change Section**

- Add new section with current password, new password, confirm password fields
- Create backend endpoint `PUT /api/users/password`
- Add validation (min length, match confirmation)
- Use secure password change flow

10. **Implement Delete Account**

    - Create backend endpoint `DELETE /api/users/account`
    - Add confirmation modal/dialog before deletion
    - Delete all user's posts and accounts
    - Logout and redirect to login after deletion

11. **Improve UX**

    - Add "Cancel" button to reset form to original values
    - Show "Unsaved changes" warning if user tries to navigate away
    - Add form sections with better visual hierarchy
    - Improve responsive design

## Files to Modify

- [`social-media/src/pages/Settings.jsx`](social-media/src/pages/Settings.jsx) - Main settings page component
- [`backend/models/User.model.js`](backend/models/User.model.js) - Add new fields to schema
- [`backend/controllers/user.controller.js`](backend/controllers/user.controller.js) - Update profile handler, add delete account
- [`backend/routes/user.routes.js`](backend/routes/user.routes.js) - Add delete account route
- [`social-media/src/api/user.api.js`](social-media/src/api/user.api.js) - Add delete account and password change methods
- [`social-media/src/context/AuthContext.jsx`](social-media/src/context/AuthContext.jsx) - Add method to update user in context

## Technical Considerations

- Form state should reset to user data on mount and after successful save
- Handle API errors gracefully with user-friendly messages
- Ensure email uniqueness validation on backend
- Password change should require current password verification
- Delete account should be irreversible (consider soft delete vs hard delete)
- Notification preferences should have sensible defaults

## Priority Recommendations

**Must Do:**

- Phase 1 items (1-5) - Core functionality to make settings page work

**Should Do:**

- Phase 2 items (6-8) - Notification preferences are already in UI