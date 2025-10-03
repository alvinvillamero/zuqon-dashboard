# Make.com Facebook Integration Troubleshooting

## Error: [400] Invalid parameter (100, OAuthException)

This error indicates a Facebook API authentication or permission issue.

## 🔧 **Immediate Fixes to Try:**

### 1. Reconnect Facebook in Make.com
1. Go to your Make.com scenario
2. Click on the Facebook Pages module
3. Click "Change" next to the connection
4. Delete the existing connection
5. Create a new connection
6. **Important**: Grant ALL permissions when prompted

### 2. Check Facebook App Status
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Check if app is in "Development" or "Live" mode
4. If in Development, add your Facebook account as a test user

### 3. Verify Page Permissions
1. Go to your Facebook Page
2. Settings → Page Roles
3. Ensure your account has "Admin" access
4. The connected Facebook account must be an admin

## 🛠️ **Detailed Troubleshooting Steps:**

### Step 1: Facebook App Setup
```
Required Permissions:
- pages_show_list
- pages_manage_posts  
- pages_read_engagement
```

### Step 2: Make.com Module Configuration
```
Facebook Pages > Create a Post:
- Page: [Select your page]
- Message: {{1.Facebook_Post}}
- Photo URL: {{1.Graphic_URL[].url}}
- Published: true
```

### Step 3: Test Data Format
Your Airtable data should look like:
```
Publish_Status: "Ready_to_Publish"
Publish_Platforms: ["Facebook"]
Facebook_Post: "Your post content here..."
Graphic_URL: [attachment with valid image URL]
```

## 🧪 **Debug Steps:**

### 1. Use Debug Button
1. Go to Zuqon Dashboard → To Publish
2. Find content with "Ready to Publish" status
3. Click "🔍 Debug" button
4. Check console for data validation

### 2. Test Make.com Manually
1. In Make.com, click "Run once"
2. Trigger from dashboard
3. Check execution history for detailed errors

### 3. Validate Content
Common issues:
- Empty Facebook post content
- Invalid image URLs
- Post too long (>63,206 characters)
- Special characters causing encoding issues

## 🔍 **Common Error Codes:**

### Error 100 (OAuthException)
- **Cause**: Invalid access token or permissions
- **Fix**: Reconnect Facebook account

### Error 190 (OAuthException) 
- **Cause**: Access token expired
- **Fix**: Refresh connection in Make.com

### Error 200 (OAuthException)
- **Cause**: Insufficient permissions
- **Fix**: Grant all required permissions

### Error 803 (OAuthException)
- **Cause**: App not approved for pages_manage_posts
- **Fix**: Submit app for review or use test mode

## 🚀 **Step-by-Step Fix Process:**

### Phase 1: Facebook App Check
1. **Go to Facebook Developers Console**
2. **Select your app**
3. **Check App Review status**
4. **Verify permissions are approved**

### Phase 2: Make.com Connection
1. **Delete existing Facebook connection**
2. **Create new connection**
3. **Grant ALL permissions**
4. **Test connection**

### Phase 3: Content Validation
1. **Use Debug button in dashboard**
2. **Check Facebook post content**
3. **Verify image URLs are accessible**
4. **Test with simple text-only post first**

### Phase 4: Test Execution
1. **Run Make.com scenario manually**
2. **Check execution history**
3. **Look for detailed error messages**

## 📋 **Quick Checklist:**

- [ ] Facebook app has required permissions
- [ ] Connected account is page admin
- [ ] Make.com connection is fresh (< 60 days)
- [ ] Facebook post content is not empty
- [ ] Image URLs are publicly accessible
- [ ] Airtable trigger field is exactly "Ready_to_Publish"
- [ ] Publish_Platforms contains "Facebook"

## 🆘 **If Still Not Working:**

### Test with Minimal Setup
1. **Remove image from post** (test text-only)
2. **Use simple post content** (no special characters)
3. **Test with different Facebook page**
4. **Check Make.com execution logs**

### Alternative Approach
If Facebook API continues to fail, consider:
1. **Use Zapier instead of Make.com**
2. **Use Facebook's Creator Studio**
3. **Direct Facebook Graph API integration**

## 📞 **Getting Help:**

1. **Make.com Support**: Check their Facebook integration docs
2. **Facebook Developer Support**: For API-specific issues
3. **Debug Console**: Use browser console for detailed errors

## 🎯 **Success Indicators:**

When working correctly, you should see:
- ✅ Make.com execution shows "Success"
- ✅ Post appears on Facebook page
- ✅ Airtable status updates to "Published"
- ✅ No error notifications from Make.com

