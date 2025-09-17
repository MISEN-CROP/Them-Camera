// This is a sample API endpoint for Shopify that would handle metafield updates
// In a real implementation, this would be part of a Shopify app or theme app extension

const express = require('express');
const router = express.Router();

// Shopify API library (you would need to install @shopify/shopify-api)
const { Shopify } = require('@shopify/shopify-api');

// Update metafield endpoint
router.post('/api/update-metafield', async (req, res) => {
    try {
        const { productId, metafieldKey, value } = req.body;

        // Validate input
        if (!productId || !metafieldKey || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

        // Get the Shopify session from the request
        const session = res.locals.shopify.session;

        // Create a new Shopify client
        const client = new Shopify.Clients.Rest(session.shop, session.accessToken);

        // Create or update the metafield
        const response = await client.post({
            path: `products/${productId}/metafields`,
            data: {
                metafield: {
                    namespace: 'custom',
                    key: metafieldKey,
                    value: value,
                    type: 'single_line_text_field'
                }
            },
        });

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Metafield updated successfully',
            data: response.body.metafield
        });
    } catch (error) {
        console.error('Error updating metafield:', error);

        // Return error response
        return res.status(500).json({
            success: false,
            message: 'Error updating metafield',
            error: error.message
        });
    }
});

module.exports = router;