# Social Media Integration Setup Guide

## Overview
The Zuqon AI Dashboard now includes functional social media integration for Facebook, Instagram, and Twitter/X. This allows you to connect your social media accounts and publish generated content directly to these platforms.

## Required Environment Variables

Add these to your `.env` file:

```env
# Core API Keys
VITE_AIRTABLE_API_KEY=your_airtable_api_key_here
VITE_AIRTABLE_BASE_ID=your_airtable_base_id_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_NEWSAPI_KEY=your_newsapi_key_here

# Social Media API Keys
# Facebook/Instagram (Meta Developer Console)
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret_here
VITE_INSTAGRAM_APP_ID=your_instagram_app_id_here
VITE_INSTAGRAM_APP_SECRET=your_instagram_app_secret_here

# Twitter/X API Keys
VITE_TWITTER_CLIENT_ID=your_twitter_client_id_here
VITE_TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
```

## Social Media API Setup

### 1. Facebook & Instagram Setup

1. **Create a Meta Developer Account**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app and select "Business" as the app type

2. **Configure Facebook App**
   - Add Facebook Login product
   - Set redirect URI: `http://localhost:5173/auth/facebook/callback`
   - Add permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`

3. **Configure Instagram App**
   - Add Instagram Basic Display product
   - Set redirect URI: `http://localhost:5173/auth/instagram/callback`
   - Add permissions: `user_profile`, `user_media`

4. **Get App Credentials**
   - Copy App ID and App Secret to your `.env` file

### 2. Twitter/X Setup

1. **Create Twitter Developer Account**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create a new project and app

2. **Configure Twitter App**
   - Enable OAuth 2.0
   - Set callback URI: `http://localhost:5173/auth/twitter/callback`
   - Add scopes: `tweet.read`, `tweet.write`, `users.read`

3. **Get App Credentials**
   - Copy Client ID and Client Secret to your `.env` file

## Airtable Schema Updates

Add a new table called `Social_Accounts` with these fields:

- **Platform** (Single select): facebook, instagram, twitter
- **Name** (Single line text): Account display name
- **Username** (Single line text): Account username/handle
- **Account_ID** (Single line text): Platform-specific account ID
- **Access_Token** (Long text): OAuth access token
- **Refresh_Token** (Long text): OAuth refresh token (optional)
- **Expires_At** (Date): Token expiration date
- **Is_Connected** (Checkbox): Connection status
- **Last_Sync** (Date): Last sync timestamp
- **Permissions** (Long text): Comma-separated permissions list

## Features

### ✅ **Implemented Features**
- **OAuth Authentication**: Secure login flow for all platforms
- **Account Management**: Connect/disconnect social media accounts
- **Content Publishing**: Publish generated content to connected accounts
- **Image Support**: Include generated graphics in posts
- **Error Handling**: Comprehensive error handling and user feedback
- **Token Management**: Automatic token refresh and expiration handling

### 🔄 **OAuth Flow**
1. User clicks "Connect" on a platform
2. Redirected to platform's OAuth page
3. User authorizes the app
4. Redirected back to `/auth/{platform}/callback`
5. App exchanges code for access token
6. Account saved to Airtable
7. User redirected to To Publish page

### 📱 **Supported Platforms**
- **Facebook**: Pages management and posting
- **Instagram**: Business account posting with images
- **Twitter/X**: Tweet posting with media support

## Usage

1. **Connect Accounts**: Go to To Publish → Social Media Accounts tab
2. **Publish Content**: Go to To Publish → Generated Content tab
3. **Schedule Posts**: Use the schedule functionality (coming soon)
4. **Manage Accounts**: View connection status and sync accounts

## Security Notes

- Access tokens are stored securely in Airtable
- OAuth flow follows industry best practices
- Tokens are refreshed automatically when needed
- All API calls are made server-side (in production)

## Troubleshooting

### Common Issues:
1. **"App not configured"**: Check your environment variables
2. **"Invalid redirect URI"**: Ensure callback URLs match exactly
3. **"Permission denied"**: Check app permissions in developer console
4. **"Token expired"**: Tokens will be refreshed automatically

### Debug Mode:
- Check browser console for detailed error messages
- Verify API keys in Settings page
- Test OAuth flow step by step

## Next Steps

- [ ] Implement post scheduling
- [ ] Add analytics and engagement tracking
- [ ] Support for more platforms (LinkedIn, TikTok)
- [ ] Bulk posting capabilities
- [ ] Content calendar view
