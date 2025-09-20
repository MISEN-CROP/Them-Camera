# AI Image Generator Integration

Tính năng AI Image Generator cho phép tạo ảnh từ text prompt và tích hợp vào hệ thống edit meta fields.

## 🚀 Cách sử dụng

### 1. Cấu hình API

Chỉnh sửa file `assets/ai-config.js`:

```javascript
window.AI_CONFIG = {
    // API Configuration
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    apiKey: "YOUR_API_KEY_HERE", // Thay thế bằng API key thực tế

    // Request Configuration
    requestConfig: {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + window.AI_CONFIG.apiKey,
        },
    },

    // Generation Parameters
    generationParams: {
        n: 4, // Số lượng ảnh generate
        size: "1024x1024", // Kích thước ảnh
        quality: "standard", // 'standard' hoặc 'hd'
        style: "vivid", // 'vivid' hoặc 'natural'
    },
};
```

### 2. Load config vào HTML

Thêm vào `layout/theme.liquid`:

```html
<script src="{{ 'ai-config.js' | asset_url }}"></script>
<script src="{{ 'shopify.edit.js' | asset_url }}"></script>
```

### 3. Sử dụng trong editor

1. Click vào ảnh có `data-meta="hero_image hero_image_alt"`
2. Modal sẽ mở với 2 fields
3. Click nút **"AI Generate"** bên cạnh field ảnh
4. Nhập prompt mô tả ảnh muốn tạo
5. Click **"Generate Images"**
6. Chọn ảnh từ kết quả generate
7. Ảnh sẽ được cập nhật vào field

## 🎨 Các API được hỗ trợ

### OpenAI DALL-E 3

```javascript
window.AI_CONFIG = {
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    apiKey: "sk-...",
    generationParams: {
        model: "dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
    },
};
```

### Midjourney API

```javascript
window.AI_CONFIG = {
    apiEndpoint: "https://api.midjourney.com/v1/imagine",
    apiKey: "your-midjourney-key",
    generationParams: {
        aspect_ratio: "1:1",
        quality: "high",
    },
};
```

### Stable Diffusion

```javascript
window.AI_CONFIG = {
    apiEndpoint:
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
    apiKey: "your-stability-key",
    generationParams: {
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 4,
        steps: 30,
    },
};
```

## 🔧 Tùy chỉnh UI

Chỉnh sửa `ui` config trong `ai-config.js`:

```javascript
ui: {
    modalTitle: '🎨 AI Image Generator',
    modalDescription: 'Enter a prompt to generate images using AI',
    placeholder: 'Describe the image you want to generate...',
    generateButtonText: 'Generate Images',
    generatingText: 'Generating...',
    selectButtonText: 'Select This Image'
}
```

## 📝 Ví dụ sử dụng

### HTML Element

```html
<img
    src="{{ template_data.hero_image }}"
    data-meta="hero_image hero_image_alt"
    data-type="image"
    alt="{{ template_data.hero_image_alt }}"
    class="w-full h-auto object-cover"
/>
```

### Workflow

1. **Click ảnh** → Modal mở
2. **Click "AI Generate"** → Generator modal mở
3. **Nhập prompt**: "A beautiful sunset over mountains"
4. **Click "Generate Images"** → API call
5. **Chọn ảnh** → Ảnh được cập nhật
6. **Save** → Lưu vào meta fields

## 🛠️ Troubleshooting

### Lỗi API

-   Kiểm tra API key có đúng không
-   Kiểm tra endpoint URL
-   Kiểm tra CORS policy

### Lỗi UI

-   Kiểm tra console logs
-   Đảm bảo React đã load
-   Kiểm tra CSS classes

### Debug

Mở console để xem logs:

```javascript
// Xem config hiện tại
console.log(window.AI_CONFIG);

// Xem response từ API
// Logs sẽ hiển thị trong console khi generate
```

## 🔒 Bảo mật

-   **Không commit API key** vào git
-   **Sử dụng environment variables** cho production
-   **Rate limiting** để tránh spam API
-   **Validate input** trước khi gọi API

## 📊 Performance

-   **Lazy loading** cho ảnh generate
-   **Caching** kết quả generate
-   **Error handling** cho network issues
-   **Loading states** cho UX tốt hơn
