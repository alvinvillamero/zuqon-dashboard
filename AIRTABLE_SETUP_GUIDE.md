# Airtable Setup Guide for Make.com Publishing Integration

This guide explains how to set up your Airtable base to work with the Zuqon Dashboard and Make.com publishing automation.

## Required Tables

### 1. Generated_Content Table

This table stores all generated social media content and publishing status.

#### Required Fields:

**Basic Content Fields:**
- `Name` (Single line text) - Content title
- `Original_URL` (URL) - Source article URL
- `Facebook_Post` (Long text) - Facebook post content
- `Instagram_Post` (Long text) - Instagram post content
- `Twitter_X_Post` (Long text) - Twitter/X post content
- `Video_Script` (Long text) - Video script content
- `Generation_Date` (Date) - When content was generated
- `Graphic_URL` (Attachment) - Generated graphic image

**Publishing Status Fields (for Make.com integration):**
- `Publish_Status` (Single select) - Options: "Draft", "Ready_to_Publish", "Publishing", "Published", "Failed", "Scheduled"
- `Publish_Platforms` (Single line text) - Comma-separated list of platforms
- `Publishing_Notes` (Long text) - Publishing notes and timestamps
- `Last_Updated` (Date & time) - Last update timestamp
- `Is_Scheduled` (Checkbox) - Whether post is scheduled
- `Scheduled_Time` (Date & time) - When to publish (if scheduled)

**Facebook-Specific Fields:**
- `Facebook_Ready` (Checkbox) - Ready for Facebook publishing
- `Facebook_Status` (Single select) - Options: "Pending", "Publishing", "Published", "Failed"
- `Facebook_Post_ID` (Single line text) - Facebook post ID after publishing

**Instagram-Specific Fields:**
- `Instagram_Ready` (Checkbox) - Ready for Instagram publishing
- `Instagram_Status` (Single select) - Options: "Pending", "Publishing", "Published", "Failed"
- `Instagram_Post_ID` (Single line text) - Instagram post ID after publishing

**Twitter-Specific Fields:**
- `Twitter_Ready` (Checkbox) - Ready for Twitter publishing
- `Twitter_Status` (Single select) - Options: "Pending", "Publishing", "Published", "Failed"
- `Twitter_Post_ID` (Single line text) - Twitter post ID after publishing

**Error Handling Fields:**
- `Publishing_Error` (Long text) - Error messages from failed publishing attempts
- `Published_At` (Date & time) - When successfully published

### 2. Topic Table

This table stores source articles for content generation.

#### Required Fields:
- `Topic` (Single line text) - Article title
- `URL` (URL) - Article URL
- `Source` (Single line text) - Source name
- `Content` (Long text) - Article content
- `Date Fetched` (Date) - When article was fetched
- `Has_Generated_Content` (Checkbox) - Whether content has been generated

### 3. Prompts Table

This table stores AI prompts for content generation.

#### Required Fields:
- `Name` (Single line text) - Prompt name
- `System_Prompt` (Long text) - System prompt
- `User_Prompt` (Long text) - User prompt template
- `Category` (Single line text) - Prompt category
- `Is_Active` (Checkbox) - Whether prompt is active
- `Version` (Single line text) - Prompt version

## Make.com Integration Workflow

### 1. Trigger Setup
- **Module**: Airtable "Watch Records"
- **Table**: Generated_Content
- **Trigger Field**: `Publish_Status`
- **Trigger Value**: "Ready_to_Publish"

### 2. Facebook Publishing Module
- **Module**: Facebook Pages "Create a Post"
- **Page ID**: Your Facebook Page ID
- **Message**: Map from `Facebook_Post` field
- **Photo URL**: Map from `Graphic_URL` field (first attachment URL)

### 3. Status Update Module
- **Module**: Airtable "Update Record"
- **Record ID**: Same as trigger record
- **Fields to Update**:
  - `Facebook_Status`: "Published" (on success) or "Failed" (on error)
  - `Facebook_Post_ID`: Post ID from Facebook response
  - `Publish_Status`: "Published" (if all platforms successful) or "Failed"
  - `Published_At`: Current timestamp
  - `Publishing_Error`: Error message (if failed)

### 4. Error Handling
- Add error handling routes to update status fields with failure information
- Set `Publishing_Error` field with detailed error messages

## Testing the Integration

1. **Generate Content**: Use the Zuqon Dashboard to generate social media content
2. **Initiate Publishing**: Select Facebook platform and click "Publish Now"
3. **Monitor Status**: Watch the status badges update in real-time
4. **Verify Results**: Check Facebook page for published content

## Webhook Setup (Optional)

For real-time status updates, you can set up a webhook from Make.com back to your application:

1. **Webhook URL**: `https://your-domain.com/api/make-webhook`
2. **Method**: POST
3. **Payload**: 
```json
{
  "contentId": "{{record_id}}",
  "results": [
    {
      "platform": "Facebook",
      "status": "success",
      "postId": "{{facebook_post_id}}",
      "publishedAt": "{{timestamp}}"
    }
  ]
}
```

## Troubleshooting

### Common Issues:

1. **Field Not Found Errors**: Ensure all required fields exist in your Airtable base
2. **Permission Errors**: Check Airtable API permissions and Make.com Facebook app permissions
3. **Image Upload Issues**: Ensure `Graphic_URL` is an Attachment field, not Text
4. **Status Not Updating**: Check Make.com scenario is active and webhook URLs are correct

### Debug Steps:

1. Check browser console for error messages
2. Verify Airtable field names match exactly (case-sensitive)
3. Test Make.com scenario manually
4. Check Facebook Page permissions and app settings

## Security Considerations

- Store API keys securely in environment variables
- Use HTTPS for all webhook endpoints
- Implement proper authentication for webhook endpoints
- Regularly rotate API keys and access tokens
