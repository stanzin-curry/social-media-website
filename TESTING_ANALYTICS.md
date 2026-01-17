# Testing Facebook Analytics

Since the `read_insights` permission requires Facebook App Review approval, here are several ways to test the analytics functionality:

## Option 1: Use Mock Data (Recommended for Development)

Enable mock analytics data that returns realistic test values without calling Facebook API.

### Setup

1. Add to your `backend/.env` file:
```env
ENABLE_MOCK_ANALYTICS=true
```

2. Restart your backend server

3. When you click "Refresh Stats", you'll get mock data:
   - Likes: Random between 10-110
   - Comments: Random between 2-22
   - Shares: Random between 1-16
   - Reach: Calculated based on likes (typically 1.5-2x)

### Disable Mock Mode

Remove or set to `false`:
```env
ENABLE_MOCK_ANALYTICS=false
```

## Option 2: Facebook Development Mode (For Real API Testing)

In Facebook Development Mode, app admins, developers, and testers can use permissions without App Review.

### Steps:

1. **Go to Facebook App Dashboard**
   - Visit: https://developers.facebook.com/apps/
   - Select your app

2. **Add Yourself as a Tester/Developer**
   - Go to **Roles** > **Roles** in the left sidebar
   - Click **Add People**
   - Add yourself as **Developer** or **Tester**
   - Use your Facebook account email

3. **Ensure App is in Development Mode**
   - Check **Settings** > **Basic**
   - App Mode should be "Development"
   - In Development Mode, permissions work for admins/developers/testers

4. **Reconnect Your Facebook Account**
   - Disconnect your Facebook account in the app
   - Reconnect it
   - The `read_insights` permission should work for you as a developer/tester

## Option 3: Test with Basic Stats Only

The analytics feature already works with basic stats (likes, comments, shares) even without `read_insights`:

- ✅ **Likes** - Works without App Review
- ✅ **Comments** - Works without App Review  
- ✅ **Shares** - Works without App Review
- ❌ **Reach** - Requires `read_insights` permission (App Review)

You can test the full flow with these three metrics, and reach will show as 0 until App Review is approved.

## Option 4: Submit for Facebook App Review (For Production)

If you want to test with real insights data in production:

1. **Go to App Review** in Facebook App Dashboard
2. **Request `read_insights` Permission**
   - Provide use case description
   - Submit privacy policy URL
   - Add test instructions
3. **Wait for Approval** (can take days/weeks)
4. **Once Approved**, insights will work for all users

## Quick Test Commands

### Enable Mock Analytics
```bash
# In backend/.env
echo "ENABLE_MOCK_ANALYTICS=true" >> backend/.env
```

### Test with Real API (Development Mode)
1. Add yourself as developer in Facebook App Dashboard
2. Reconnect Facebook account
3. Refresh analytics - should work!

### Test with Basic Stats Only
Just use the app normally - likes/comments/shares will work, reach will be 0.

## Troubleshooting

### Mock Data Not Working
- Check `ENABLE_MOCK_ANALYTICS=true` is in `backend/.env`
- Restart backend server
- Check console logs for `[Facebook] Using MOCK analytics data`

### Development Mode Not Working
- Verify you're added as Developer/Tester in Facebook App Dashboard
- Ensure app is in Development Mode (not Live)
- Disconnect and reconnect Facebook account
- Check Facebook App permissions include `read_insights`

### Still Getting Permission Errors
- Use Option 1 (Mock Data) for testing
- Or use Option 3 (Basic Stats Only) - works without App Review

