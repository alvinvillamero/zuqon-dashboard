# Airtable Field Rename Guide

## 🔧 **Field Names to Change in Airtable**

To fix the "unescaped characters" error, rename these fields in your `Generated_Content` table:

### **Required Changes:**
```
❌ Old Name              ✅ New Name
Publish_Status     →     Publish Status
Publish_Platforms  →     Publish Platforms  
Publishing_Notes   →     Publishing Notes
```

### **Optional Fields (if they exist):**
```
❌ Old Name              ✅ New Name
Facebook_Status    →     Facebook Status
Instagram_Status   →     Instagram Status
Twitter_Status     →     Twitter Status
Published_At       →     Published At
Publishing_Error   →     Publishing Error
Facebook_Post_ID   →     Facebook Post ID
Instagram_Post_ID  →     Instagram Post ID
Twitter_Post_ID    →     Twitter Post ID
Scheduled_Time     →     Scheduled Time
Is_Scheduled       →     Is Scheduled
Last_Updated       →     Last Updated
```

## 📋 **How to Rename Fields in Airtable:**

1. **Go to your Airtable base**
2. **Open the `Generated_Content` table**
3. **Click on the field header** (column name)
4. **Select "Customize field type"**
5. **Change the field name** from underscore to space
6. **Click "Save"**
7. **Repeat for each field**

## 🚀 **After Renaming Fields:**

### **Update Make.com Scenario:**
Your Make.com modules will need to use the new field names:

**Trigger Module:**
```
Watch field: Publish Status (instead of Publish_Status)
Filter: Publish Platforms contains "Facebook"
```

**Update Module:**
```
Publish Status: Published
Publishing Notes: Successfully published to Facebook at {{now}}
```

### **Test the System:**
1. **Refresh your Zuqon Dashboard**
2. **Try the "Test Connection" button**
3. **Use the "🔍 Debug" button** to verify field names
4. **Test publishing workflow**

## ✅ **Benefits of This Change:**

- **Fixes "unescaped characters" error** in Make.com
- **More readable field names** in Airtable
- **Better compatibility** with automation tools
- **Cleaner API requests** without URL encoding issues

## 🎯 **Critical Fields to Rename First:**

Focus on these three fields first (they're the most important):
1. `Publish_Status` → `Publish Status`
2. `Publish_Platforms` → `Publish Platforms`
3. `Publishing_Notes` → `Publishing Notes`

Once these are renamed, your publishing workflow should work without the unescaped characters error!

## 📞 **After Renaming:**

The system will automatically work with the new field names. No additional code changes needed - I've already updated everything to use spaces instead of underscores.
