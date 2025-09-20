// AI Image Generation Configuration
window.AI_CONFIG = {
    // API Configuration
    apiEndpoint: 'https://api.openai.com/v1/images/generations',
    apiKey: 'YOUR_API_KEY_HERE', // Thay thế bằng API key thực tế

    // Request Configuration
    requestConfig: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.AI_CONFIG.apiKey
        }
    },

    // Generation Parameters
    generationParams: {
        n: 4, // Số lượng ảnh generate
        size: '1024x1024', // Kích thước ảnh
        quality: 'standard', // 'standard' hoặc 'hd'
        style: 'vivid' // 'vivid' hoặc 'natural'
    },

    // UI Configuration
    ui: {
        modalTitle: '🎨 AI Image Generator',
        modalDescription: 'Enter a prompt to generate images using AI',
        placeholder: 'Describe the image you want to generate...',
        generateButtonText: 'Generate Images',
        generatingText: 'Generating...',
        selectButtonText: 'Select This Image'
    }
};

// Alternative API configurations (uncomment to use)
/*
// For DALL-E 3
window.AI_CONFIG = {
    apiEndpoint: 'https://api.openai.com/v1/images/generations',
    apiKey: 'YOUR_OPENAI_API_KEY',
    requestConfig: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.AI_CONFIG.apiKey
        }
    },
    generationParams: {
        model: 'dall-e-3',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
    }
};

// For Midjourney API (example)
window.AI_CONFIG = {
    apiEndpoint: 'https://api.midjourney.com/v1/imagine',
    apiKey: 'YOUR_MIDJOURNEY_API_KEY',
    requestConfig: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.AI_CONFIG.apiKey
        }
    },
    generationParams: {
        prompt: '', // Will be filled dynamically
        aspect_ratio: '1:1',
        quality: 'high'
    }
};

// For Stable Diffusion API (example)
window.AI_CONFIG = {
    apiEndpoint: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    apiKey: 'YOUR_STABILITY_API_KEY',
    requestConfig: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.AI_CONFIG.apiKey
        }
    },
    generationParams: {
        text_prompts: [], // Will be filled dynamically
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 4,
        steps: 30
    }
};
*/
