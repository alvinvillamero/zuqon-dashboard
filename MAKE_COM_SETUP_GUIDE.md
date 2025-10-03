# Make.com Setup Guide for Facebook Publishing

This guide will help you set up Make.com to automatically publish content from your Zuqon Dashboard to Facebook.

## Prerequisites

1. ✅ Airtable base with `Generated_Content` table (you have this)
2. ✅ Content with publishing status fields (you have this)
3. 🔲 Make.com account
4. 🔲 Facebook Page with admin access
5. 🔲 Facebook Developer App (for API access)

## Step 1: Create Make.com Scenario

### 1.1 Create New Scenario
1. Log into Make.com
2. Click "Create a new scenario"
3. Name it "Zuqon Facebook Publishing"

### 1.2 Add Airtable Trigger Module
1. **Module**: Airtable > "Watch Records"
2. **Connection**: Connect your Airtable account
3. **Base**: Select your Zuqon base
4. **Table**: `Generated_Content`
5. **Trigger Field**: `Publish_Status`
6. **Trigger Value**: `Ready_to_Publish`
7. **Max Records**: 10
8. **View**: All records

### 1.3 Add Filter (Optional but Recommended)
1. Add a filter after the Airtable trigger
2. **Condition**: `Publish_Platforms` contains `Facebook`
3. **Label**: "Facebook Publishing Only"

## Step 2: Add Facebook Pages Module

### 2.1 Add Facebook Pages Module
1. **Module**: Facebook Pages > "Create a Post"
2. **Connection**: Connect your Facebook account
3. **Page**: Select your Facebook Page
4. **Message**: Map from Airtable `Facebook_Post` field
5. **Photo URL**: Map from Airtable `Graphic_URL` field (use first attachment URL)

### 2.2 Facebook Module Settings
```
Message: {{1.Facebook_Post}}
Photo URL: {{1.Graphic_URL[].url}}
Published: true
```

## Step 3: Add Status Update Module

### 3.1 Add Success Path
1. **Module**: Airtable > "Update Record"
2. **Connection**: Same Airtable connection
3. **Base**: Your Zuqon base
4. **Table**: `Generated_Content`
5. **Record ID**: `{{1.id}}` (from trigger)

### 3.2 Success Update Fields
```
Publish_Status: Published
Facebook_Status: Published
Facebook_Post_ID: {{2.id}}
Published_At: {{now}}
Last_Updated: {{now}}
```

### 3.3 Add Error Handler
1. Right-click on Facebook module
2. Add "Error Handler" > "Resume"
3. **Module**: Airtable > "Update Record"
4. **Fields**:
```
Publish_Status: Failed
Facebook_Status: Failed
Publishing_Error: {{2.message}}
Last_Updated: {{now}}
```

## Step 4: Test the Scenario

### 4.1 Manual Test
1. In Make.com, click "Run once"
2. Go to your Zuqon Dashboard
3. Click "Test Connection" button
4. Select Facebook platform on a content item
5. Click "Publish Now"
6. Watch Make.com scenario execute

### 4.2 Verify Results
- Check Facebook page for published post
- Check Airtable for updated status
- Check Zuqon Dashboard for status badges

## Step 5: Advanced Configuration (Optional)

### 5.1 Add Webhook Response
To send status back to Zuqon Dashboard:

1. **Module**: HTTP > "Make a Request"
2. **URL**: `https://your-domain.com/api/make-webhook`
3. **Method**: POST
4. **Body**:
```json
{
  "contentId": "{{1.id}}",
  "results": [
    {
      "platform": "Facebook",
      "status": "success",
      "postId": "{{2.id}}",
      "publishedAt": "{{now}}"
    }
  ]
}
```

### 5.2 Scheduling Support
Add a filter for scheduled posts:
1. **Condition**: `Is_Scheduled` equals `true`
2. **Module**: Tools > "Sleep"
3. **Delay**: Until `Scheduled_Time`

## Step 6: Activate Scenario

1. Click "Save" in Make.com
2. Toggle scenario to "ON"
3. Set execution interval (recommended: every 1 minute)

## Troubleshooting

### Common Issues:

1. **"Field not found" errors**
   - Verify all Airtable field names match exactly
   - Check field types (text vs attachment)

2. **Facebook API errors**
   - Verify page permissions
   - Check Facebook app settings
   - Ensure page access token is valid

3. **Image upload issues**
   - Use `{{1.Graphic_URL[].url}}` for attachment fields
   - Ensure image URLs are publicly accessible

4. **Scenario not triggering**
   - Check Airtable connection
   - Verify trigger field value matches exactly
   - Check scenario execution history

### Debug Steps:

1. **Check Make.com execution history**
   - View detailed logs
   - Check input/output data

2. **Test individual modules**
   - Use "Run this module only"
   - Verify data mapping

3. **Check Airtable data**
   - Ensure `Publish_Status` is exactly "Ready_to_Publish"
   - Verify required fields have data

## Security Best Practices

1. **API Keys**: Store securely in Make.com connections
2. **Permissions**: Use minimal required Facebook permissions
3. **Error Handling**: Always include error handlers
4. **Logging**: Enable execution logging for debugging

## Testing Checklist

- [ ] Airtable connection works
- [ ] Facebook connection works
- [ ] Trigger fires on status change
- [ ] Facebook post is created successfully
- [ ] Status is updated in Airtable
- [ ] Error handling works
- [ ] Dashboard shows updated status

## Next Steps

Once Facebook publishing is working:
1. Add Instagram publishing module
2. Add Twitter publishing module
3. Implement scheduling functionality
4. Add analytics tracking

## Support

If you encounter issues:
1. Check Make.com execution logs
2. Verify Airtable field names and data
3. Test Facebook API permissions
4. Review this guide step by step

