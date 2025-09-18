# Shopify Inline Editor with Image Upload

This feature allows merchants to edit both text and images directly on their Shopify storefront when coming from the Shopify admin interface.

## Features

### Text Editing

-   Edit text content directly on the page
-   Changes are saved to product metafields
-   Visual indicators for editable elements

### Image Editing

-   Update images directly from the storefront
-   Upload new images from your device
-   Image preview before saving
-   Changes are saved to product metafields

### Logging

-   Shows detailed information when changes are saved
-   Logs liquid variable names, values, and product IDs
-   Provides console and alert notifications for debugging
-   Helps track all edits made through the inline editor

## How It Works

The editor detects when users come from the Shopify admin interface by checking for the `_orig_referrer` cookie. When detected, edit buttons appear on editable elements.

### Text Editing Flow

1. Click the pen icon on any editable text
2. Edit the text in the provided textarea
3. Click "Save" to update the content

### Image Editing Flow

1. Click the camera icon on any editable image
2. A modal appears showing the current image
3. Click "Choose Image" to select a new image from your device
4. Preview the new image
5. Click "Save Changes" to upload and update

## Technical Implementation

### Files

-   `assets/shopify-inline-editor.js` - Core functionality
-   `server/api-endpoints.js` - Server-side endpoints for saving changes

### Installation

1. Include the inline editor script in your theme.liquid:

```liquid
{{ 'shopify-inline-editor.js' | asset_url | script_tag }}
```

2. Add the image upload modal HTML to your product template:

```liquid
<!-- Image Upload Modal -->
<div id="image-upload-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-xl w-full relative premium-shadow">
        <button id="image-modal-close" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
            <i class="fas fa-times text-xl"></i>
        </button>

        <div class="p-6">
            <h3 class="font-space font-bold text-2xl text-slate-900 mb-4">Update Image</h3>

            <div class="space-y-4">
                <!-- Current Image -->
                <div>
                    <p class="text-sm text-slate-600 mb-2">Current Image:</p>
                    <div id="current-image-container" class="relative border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-100">
                        <img id="current-image" src="" alt="Current image" class="w-full h-full object-contain">
                    </div>
                </div>

                <!-- Upload New Image -->
                <div>
                    <p class="text-sm text-slate-600 mb-2">Upload New Image:</p>
                    <div class="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <input type="file" id="image-upload" class="hidden" accept="image/*">
                        <label for="image-upload" class="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg inline-block mb-3 hover:bg-blue-600 transition-colors">
                            <i class="fas fa-upload mr-2"></i>Choose Image
                        </label>
                        <p id="file-name" class="text-sm text-slate-500">No file selected</p>
                    </div>
                </div>

                <!-- Image Preview -->
                <div>
                    <p class="text-sm text-slate-600 mb-2">Preview:</p>
                    <div id="image-preview-container" class="relative border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-100 flex items-center justify-center">
                        <p id="no-preview" class="text-slate-400">Preview will appear here</p>
                        <img id="image-preview" src="" alt="Image preview" class="w-full h-full object-contain hidden">
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-2">
                    <button id="upload-image-btn" class="bg-emerald-500 text-white px-6 py-2 rounded-lg flex-1 font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-save mr-2"></i>Save Changes
                    </button>
                    <button id="cancel-upload-btn" class="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg flex-1 font-medium hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
```

3. Initialize the editor in your product template:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const editableElements = [
        // Define your editable elements here
        {
            id: 'hero-title',
            selector: '.hero-headline span',
            metafield: 'hero_title'
        },
        {
            id: 'hero-subtitle',
            selector: '.hero-subheadline span',
            metafield: 'hero_subtitle'
        }
        // Add more editable elements as needed
    ];

    ShopifyInlineEditor.init(editableElements);
    ShopifyInlineEditor.initImageEditing();

    // Make product data available globally for API calls
    window.ProductMetaFields = {
        id: {{ product.id | json }},
        title: {{ product.title | json }},
        handle: {{ product.handle | json }}
    };
});
```

4. Add image edit buttons to your images:

```liquid
<img
    id="hero-image"
    src="{{ product.metafields.custom.hero_image | img_url: 'master' }}"
    alt="{{ product.metafields.custom.hero_image_alt | default: product.title }}"
    class="w-full h-auto object-cover">

<!-- Edit button (hidden by default, shown by JS when in admin mode) -->
<button
    id="hero-image-edit-btn"
    class="absolute top-4 right-4 bg-blue-500 text-white rounded-full w-10 h-10 hidden items-center justify-center shadow-lg z-20"
    data-image-id="hero-image"
    data-metafield="hero_image">
    <i class="fas fa-camera"></i>
</button>
```

## Logging Features

When saving changes, the editor will:

1. Display an alert showing:

    - Product ID
    - Liquid variable name (e.g., `product.metafields.custom.hero_title`)
    - New value being saved

2. Log detailed information to the console:
    - For text edits: variable name, value, product ID, and timestamp
    - For image uploads: variable name, image details, product ID, and timestamp

This helps with debugging and ensures all changes are properly tracked before being sent to the API.

## Error Handling

The editor includes robust error handling for:

1. **File validation**:

    - Checks if selected files are valid images
    - Validates file size (maximum 5MB)
    - Ensures the proper file format

2. **API communication**:

    - Handles errors during API calls
    - Provides meaningful error messages
    - Prevents invalid data submission

3. **User feedback**:
    - Shows status messages for all operations
    - Indicates success or failure clearly
    - Provides visual cues for loading states

### Customization

You can customize the editor by modifying the configuration options in `shopify-inline-editor.js`:

```javascript
const config = {
    cookieName: "_orig_referrer",
    adminDomain: "admin.shopify.com",
    forceEditorMode: true, // Set to true for testing, false for production
    editorToolsId: "shopify-editor-tools",
    statusElementId: "editor-status",
    exitButtonId: "exit-editor-mode",
};
```

## Server-Side Implementation

The editor requires server-side endpoints to save changes to Shopify metafields:

-   `/api/update-metafield` - Updates text content
-   `/api/upload-image` - Handles image uploads and updates

In a production environment, these endpoints should:

1. Authenticate the user
2. Upload images to Shopify CDN
3. Update metafields with new values
4. Return appropriate responses

## Testing

For local testing, set `forceEditorMode: true` in the configuration to enable editing without admin cookies.

## Browser Compatibility

Tested and working in:

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Edge (latest)
