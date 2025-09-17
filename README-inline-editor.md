# Shopify Inline Editor

This implementation allows Shopify merchants to edit content directly on their theme when viewing it from the Shopify admin interface. It adds edit buttons to editable elements when the user is detected as coming from the Shopify admin.

## How It Works

1. The script detects if the user is coming from Shopify admin by checking the `_orig_referrer` cookie for `admin.shopify.com`
2. If the user is from Shopify admin, edit buttons are added to configured elements
3. When an edit button is clicked, the element is replaced with a textarea for editing
4. When saved, the changes are sent to a Shopify API endpoint to update the metafield

## Files

-   `assets/shopify-inline-editor.js`: Main editor script that can be reused across pages
-   `sections/product-lp00526.liquid`: Example implementation in a product landing page
-   `server/api-endpoints.js`: Sample server-side code for handling metafield updates

## Setup Instructions

1. Add the `shopify-inline-editor.js` file to your theme's assets folder
2. Include the script in your theme with:
    ```liquid
    {{ 'shopify-inline-editor.js' | asset_url | script_tag }}
    ```
3. Initialize the editor with your editable elements:
    ```javascript
    document.addEventListener("DOMContentLoaded", function () {
        ShopifyInlineEditor.init([
            {
                id: "element-id",
                selector: ".element-selector",
                metafield: "metafield_key",
            },
        ]);
    });
    ```

## Editable Element Configuration

Each editable element requires:

-   `id`: A unique identifier for the element
-   `selector`: CSS selector to find the element in the DOM
-   `metafield`: The key of the metafield to update (without the namespace)

## API Implementation

In a real implementation, you would need to create a Shopify app or theme app extension to handle the metafield updates. The `server/api-endpoints.js` file contains sample code for how this might be implemented.

## Testing

You can test the editor without being in the Shopify admin by setting the `forceEditorMode` option to `true` in the `ShopifyInlineEditor` configuration:

```javascript
// In assets/shopify-inline-editor.js
const config = {
    // ...
    forceEditorMode: true,
    // ...
};
```

## Notes for Implementation

-   Ensure all editable elements have proper structure with `<span>` elements for the text content
-   The script assumes all metafields are in the "custom" namespace
-   The actual API implementation will depend on your Shopify setup
-   Remember to set `forceEditorMode` back to `false` before deploying to production

## License

This code is provided as-is under MIT license.
