console.log("shopify.edit.js loaded");

const elements = document.querySelectorAll('[data-meta]');
const valuesDefault = {};
const newValues = {};
const body = document.body;
const btnSaveChange = document.createElement("button");
btnSaveChange.innerHTML = "Save Changes";
btnSaveChange.classList.add("btn-save-changes");
body.appendChild(btnSaveChange);
btnSaveChange.style.display = "none";
btnSaveChange.addEventListener("click", handleUpdateMetaFields)

const search = window.location.search;
const params = new URLSearchParams(search);
if (params.get("misen") === "auth-login-section") {
    onModalLoginMisen();
}
const loadingOverlay = document.createElement("div");
loadingOverlay.className = `
  fixed inset-0 bg-black/50 flex items-center justify-center z-[999999999]
`;
loadingOverlay.innerHTML = `
  <div class="flex flex-col items-center gap-4 text-white">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
    <span class="text-lg font-medium">Vui lòng chờ...</span>
  </div>
`;

async function fileToBase64(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file); // đọc file thành base64 data URL
    return new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


const checkToken = localStorage.getItem("shopify_misen_login");
if (checkToken) {
    const btnLogout = document.createElement("button");
    btnLogout.innerHTML = "Logout Misen Edit";
    btnLogout.classList.add("btn-logout");
    body.appendChild(btnLogout);
    btnLogout.addEventListener("click", () => {
        const constfirm = window.confirm("Are you sure to logout?");
        if (!constfirm) return;
        localStorage.removeItem("shopify_misen_login");
        window.location.reload();
    });

    elements.forEach(el => {
        // Lấy tất cả các thuộc tính data-meta
        const metaKeys = el.getAttribute("data-meta")?.split(' ') || [];
        const typeMeta = el.getAttribute("data-type");

        // Xử lý từng meta key
        metaKeys.forEach((metaKey, index) => {
            if (!metaKey.trim()) return;

            const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;

            if (!typeMeta) {
                valuesDefault[uniqueKey] = el.innerText;
                newValues[uniqueKey] = el.innerText;
            } else if (typeMeta === "icon") {
                const iconClass = el.className.split(' ').find(c => c.startsWith('fa-'))?.substring(3) || '';
                valuesDefault[uniqueKey] = iconClass;
                newValues[uniqueKey] = iconClass;
            } else if (typeMeta === "image") {
                valuesDefault[uniqueKey] = {
                    url: el.src,
                    type: "image"
                };
                newValues[uniqueKey] = {
                    url: el.src,
                    type: "image"
                };
            }
            else if (typeMeta === "gallery") {
                const images = Array.from(el.querySelectorAll('img')).map(img => {
                    return {
                        url: img.src,
                        type: "image"
                    };
                });
                valuesDefault[uniqueKey] = images;
                newValues[uniqueKey] = images;
            }
        });

        el.setAttribute("contenteditable", "true");
        el.classList.add("editMode");

        if (typeMeta === "image") {
            // Luôn mở modal cho image (dù 1 hay nhiều meta)
            el.addEventListener("click", (e) => {
                e.preventDefault();
                openImageEditModal(metaKeys, el);
            });
        } else if (typeMeta === "icon") {
            el.addEventListener("click", () => {
                const currentIcon = el.className.split(' ').find(c => c.startsWith('fa-'))?.substring(3) || '';
                const iconClass = prompt("Enter FontAwesome icon class (without 'fa-'):", currentIcon);

                if (iconClass) {
                    const newClassName = el.className.split(' ')
                        .filter(c => !c.startsWith('fa-'))
                        .join(' ') + ' fa-' + iconClass;

                    el.className = newClassName;

                    // Cập nhật tất cả meta keys cho icon
                    metaKeys.forEach((metaKey, index) => {
                        if (!metaKey.trim()) return;
                        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                        newValues[uniqueKey] = iconClass;
                    });

                    if (!_.isEqual(valuesDefault, newValues)) {
                        btnSaveChange.style.display = "block";
                    } else {
                        btnSaveChange.style.display = "none";
                    }
                }
            });
        }
        if (typeMeta === "gallery") {
            el.addEventListener("click", () => {
                // Sử dụng meta key đầu tiên cho gallery modal
                const firstMetaKey = metaKeys[0];
                if (firstMetaKey) {
                    openGalleryModal(firstMetaKey);
                }
            });
        }
        else if (!typeMeta) {
            // Nếu có nhiều hơn 1 meta attribute, mở modal để edit
            if (metaKeys.length > 1) {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    openTextEditModal(metaKeys, el);
                });
            } else {
                // Nếu chỉ có 1 meta attribute, edit inline như cũ
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                });
                const onChange = (event) => {
                    // Cập nhật tất cả meta keys cho text content
                    metaKeys.forEach((metaKey, index) => {
                        if (!metaKey.trim()) return;
                        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                        newValues[uniqueKey] = event.target.innerText;
                    });

                    if (!_.isEqual(valuesDefault, newValues)) {
                        btnSaveChange.style.display = "block";
                    } else {
                        btnSaveChange.style.display = "none";
                    }
                }

                el.addEventListener("input", onChange);
            }
        }
    });
}

async function handleUpdateMetaFields() {
    const confirm = window.confirm("Are you sure you want to update the product?");
    if (!confirm) return;
    console.log("check new save: ", {
        token: localStorage.getItem("shopify_misen_login"),
        metafields: newValues,
        product: productData,
        domain: Shopify.shop,
    });

    try {
        document.body.appendChild(loadingOverlay);
        const res = await fetch("https://n8n.misencorp.com/webhook/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: localStorage.getItem("shopify_misen_login"),
                metafields: newValues,
                product: productData,
                domain: Shopify.shop,
            }),
        });
        const data = await res.json();
        if (data.code === 0) {
            btnSaveChange.style.display = "none";
        }
    } catch (error) {
        console.error("Error during login:", error);
    } finally {
        loadingOverlay.remove();
    }
}

function onModalLoginMisen() {
    let root = document.getElementById("react-modal-root");
    if (!root) {
        root = document.createElement("div");
        root.id = "react-modal-root";
        document.body.appendChild(root);
    }

    const modalAuth = ReactDOM.createRoot(root);
    modalAuth.render(<FormLogin />)
}

function FormLogin() {
    const [state, setState] = React.useState({
        username: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            document.body.appendChild(loadingOverlay);
            const res = await fetch("https://n8n.misencorp.com/webhook/shopify-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(state),
            });
            const data = await res.json();
            if (data.code != 0) {
                alert(data.msg || "Login failed");
            } else {
                localStorage.setItem("shopify_misen_login", data.token);
                alert("Login successful");
                const url = window.location.origin + window.location.pathname + window.location.hash;
                window.location.href = url;
            }
        } catch (error) {
            console.error("Error during login:", error);
        } finally {
            loadingOverlay.remove();
        }
    }

    return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div class="px-6 py-12 lg:px-8 bg-[#fff] rounded-lg shadow-lg">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" class="mx-auto h-10 w-auto" />
                <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Sign in to your account</h2>
            </div>
            <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form action="#" method="POST" class="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label for="username" class="block text-sm/6 font-medium text-gray-900">Username address</label>
                        <div class="mt-2">
                            <input value={state.username} onChange={(e) => setState({ ...state, username: e.target.value })} id="username" type="username" name="username" required autocomplete="username" class="block border w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between">
                            <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
                        </div>
                        <div class="mt-2">
                            <input id="password" value={state.password} onChange={(e) => setState({ ...state, password: e.target.value })} type="password" name="password" required autocomplete="current-password" class="border block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                        </div>
                    </div>

                    <div>
                        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
                    </div>
                </form>
            </div>
        </div>
    </div>;
}

function openImageGeneratorModal(uniqueKey) {
    let root = document.getElementById("react-modal-root");
    if (!root) {
        root = document.createElement("div");
        root.id = "react-modal-root";
        document.body.appendChild(root);
    }

    const generatorRoot = ReactDOM.createRoot(root);

    generatorRoot.render(
        <ImageGeneratorModal
            uniqueKey={uniqueKey}
            onSelectImage={(imageUrl) => {
                const event = new CustomEvent('imageGenerated', {
                    detail: { uniqueKey, imageUrl }
                });
                document.dispatchEvent(event);
            }}
            onClose={() => {
                generatorRoot.unmount();
            }}
        />
    );
}

function openImageEditModal(metaKeys, element) {
    let root = document.getElementById("react-modal-root");
    if (!root) {
        root = document.createElement("div");
        root.id = "react-modal-root";
        document.body.appendChild(root);
    }

    const imageEditRoot = ReactDOM.createRoot(root);

    const currentValues = {};
    metaKeys.forEach((metaKey, index) => {
        if (!metaKey.trim()) return;
        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;

        if (newValues[uniqueKey]) {
            if (typeof newValues[uniqueKey] === 'object' && newValues[uniqueKey].url) {
                currentValues[uniqueKey] = newValues[uniqueKey].url;
            } else {
                currentValues[uniqueKey] = newValues[uniqueKey];
            }
        } else if (metaKey.includes('image') && !metaKey.includes('alt')) {
            currentValues[uniqueKey] = element.src || '';
            if (metaKeys.length === 1) {
                currentValues[`${uniqueKey}_alt`] = element.alt || '';
            }
        } else if (metaKey.includes('alt')) {
            currentValues[uniqueKey] = element.alt || '';
        } else {
            currentValues[uniqueKey] = element.innerText || '';
        }
    });

    imageEditRoot.render(
        <ImageEditModal
            metaKeys={metaKeys}
            currentValues={currentValues}
            element={element}
            onSave={(updatedValues) => {
                Object.keys(updatedValues).forEach(key => {
                    const metaKey = metaKeys.find((mk, idx) => {
                        const uniqueKey = metaKeys.length > 1 ? `${mk}_${idx}` : mk;
                        return uniqueKey === key;
                    });

                    if (metaKey && metaKey.includes('image') && !metaKey.includes('alt')) {
                        newValues[key] = {
                            url: updatedValues[key],
                            type: "image"
                        };
                    } else {
                        newValues[key] = updatedValues[key];
                    }
                });

                metaKeys.forEach((metaKey, index) => {
                    if (!metaKey.trim()) return;
                    const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                    const value = updatedValues[uniqueKey];

                    if (value) {
                        if (metaKey.includes('image') && !metaKey.includes('alt')) {
                            element.src = value;
                            if (metaKeys.length === 1) {
                                const altValue = updatedValues[`${uniqueKey}_alt`];
                                if (altValue !== undefined) {
                                    element.alt = altValue;
                                }
                            }
                        }
                        else if (metaKey.includes('alt')) {
                            element.alt = value;
                        }
                    }
                });

                if (!_.isEqual(valuesDefault, newValues)) {
                    btnSaveChange.style.display = "block";
                } else {
                    btnSaveChange.style.display = "none";
                }
            }}
            onClose={() => {
                imageEditRoot.unmount();
            }}
        />
    );
}

function openTextEditModal(metaKeys, element) {
    let root = document.getElementById("react-modal-root");
    if (!root) {
        root = document.createElement("div");
        root.id = "react-modal-root";
        document.body.appendChild(root);
    }

    const textEditRoot = ReactDOM.createRoot(root);

    const currentValues = {};
    metaKeys.forEach((metaKey, index) => {
        if (!metaKey.trim()) return;
        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;

        if (newValues[uniqueKey]) {
            if (typeof newValues[uniqueKey] === 'object' && newValues[uniqueKey].url) {
                currentValues[uniqueKey] = newValues[uniqueKey].url;
            } else {
                currentValues[uniqueKey] = newValues[uniqueKey];
            }
        } else if (metaKey.includes('link') || metaKey.includes('url') || metaKey.includes('href')) {
            currentValues[uniqueKey] = element.href || '';
        } else if (metaKey.includes('image') && !metaKey.includes('alt')) {
            currentValues[uniqueKey] = element.src || '';
        } else if (metaKey.includes('alt')) {
            currentValues[uniqueKey] = element.alt || '';
        } else {
            currentValues[uniqueKey] = element.innerText || '';
        }
    });

    textEditRoot.render(
        <TextEditModal
            metaKeys={metaKeys}
            currentValues={currentValues}
            element={element}
            onSave={(updatedValues) => {
                Object.keys(updatedValues).forEach(key => {
                    newValues[key] = updatedValues[key];
                });

                metaKeys.forEach((metaKey, index) => {
                    if (!metaKey.trim()) return;
                    const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                    const value = updatedValues[uniqueKey];

                    if (value) {
                        if (metaKey.includes('link') || metaKey.includes('url') || metaKey.includes('href')) {
                            element.href = value;
                        }
                        else if (metaKey.includes('image') && !metaKey.includes('alt')) {
                            element.src = value;
                        }
                        else if (metaKey.includes('alt')) {
                            element.alt = value;
                        }
                        else if (metaKey.includes('text') || metaKey.includes('title') || metaKey.includes('label')) {
                            element.innerText = value;
                        }
                        else {
                            element.innerText = value;
                        }
                    }
                });

                if (!_.isEqual(valuesDefault, newValues)) {
                    btnSaveChange.style.display = "block";
                } else {
                    btnSaveChange.style.display = "none";
                }
            }}
            onClose={() => {
                textEditRoot.unmount();
            }}
        />
    );
}

function openGalleryModal(metaKey) {
    let root = document.getElementById("react-modal-root");
    if (!root) {
        root = document.createElement("div");
        root.id = "react-modal-root";
        document.body.appendChild(root);
    }

    const galleryRoot = ReactDOM.createRoot(root);

    galleryRoot.render(
        <GalleryModal
            images={Array.isArray(newValues[metaKey]) ? newValues[metaKey] : []}
            onSave={(images) => {
                Object.keys(newValues).forEach(key => {
                    if (key === metaKey || key.startsWith(metaKey + '_')) {
                        newValues[key] = images;
                    }
                });

                if (!_.isEqual(valuesDefault, newValues)) {
                    btnSaveChange.style.display = "block";
                } else {
                    btnSaveChange.style.display = "none";
                }

                const elements = document.querySelectorAll(`[data-meta*="${metaKey}"]`);
                elements.forEach(elContainer => {
                    const metaKeys = elContainer.getAttribute("data-meta")?.split(' ') || [];
                    if (metaKeys.includes(metaKey)) {
                        let elImage = elContainer.querySelector('img');
                        if (!elImage) {
                            elImage = document.createElement("img");
                        }
                        const className = elImage.getAttribute("class") || "";
                        elContainer.innerHTML = "";
                        images.forEach((file) => {
                            const img = document.createElement("img");
                            img.className = className;
                            img.src = file.url;
                            elContainer.appendChild(img);
                        });
                    }
                });
            }}
            onClose={() => {
                galleryRoot.unmount();
            }}
        />
    );
}

function ImageGeneratorModal({ uniqueKey, onSelectImage, onClose }) {
    const { useState } = React;
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [error, setError] = useState('');

    const generateImages = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Sử dụng config từ ai-config.js
            const config = window.AI_CONFIG || {
                apiEndpoint: 'https://api.openai.com/v1/images/generations',
                requestConfig: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_API_KEY_HERE'
                    }
                },
                generationParams: {
                    n: 4,
                    size: '1024x1024'
                }
            };

            const requestBody = {
                prompt: prompt,
                ...config.generationParams
            };

            const response = await fetch(config.apiEndpoint, {
                ...config.requestConfig,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to generate images');
            }

            const data = await response.json();
            setGeneratedImages(data.data || []);
        } catch (err) {
            console.error('Error generating images:', err);
            setError('Failed to generate images. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const selectImage = (imageUrl) => {
        onSelectImage(imageUrl);
        onClose();
    };

    const config = window.AI_CONFIG || {};
    const uiConfig = config.ui || {};

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl p-6 w-[800px] max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                    {uiConfig.modalTitle || '🎨 AI Image Generator'}
                </h2>
                <p className="text-gray-600 mb-6">
                    {uiConfig.modalDescription || 'Enter a prompt to generate images using AI'}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={uiConfig.placeholder || 'Describe the image you want to generate...'}
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={generateImages}
                            disabled={isGenerating || !prompt.trim()}
                            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (uiConfig.generatingText || 'Generating...') : (uiConfig.generateButtonText || 'Generate Images')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {generatedImages.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium mb-3">Generated Images</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {generatedImages.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={`Generated image ${index + 1}`}
                                            className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-90"
                                            onClick={() => selectImage(image.url)}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button
                                                onClick={() => selectImage(image.url)}
                                                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100"
                                            >
                                                {uiConfig.selectButtonText || 'Select This Image'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ImageEditModal({ metaKeys, currentValues, element, onSave, onClose }) {
    const { useState } = React;
    const [values, setValues] = useState(currentValues);

    const handleInputChange = (uniqueKey, value) => {
        setValues(prev => ({
            ...prev,
            [uniqueKey]: value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const base64Url = await fileToBase64(file);

            // Cập nhật tất cả image meta keys
            metaKeys.forEach((metaKey, index) => {
                if (!metaKey.trim()) return;
                const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                if (metaKey.includes('image') && !metaKey.includes('alt')) {
                    setValues(prev => ({
                        ...prev,
                        [uniqueKey]: base64Url
                    }));
                }
            });
        }
    };

    // Listen for image generation events
    React.useEffect(() => {
        const handleImageGenerated = (event) => {
            const { uniqueKey, imageUrl } = event.detail;
            setValues(prev => ({
                ...prev,
                [uniqueKey]: imageUrl
            }));
        };

        document.addEventListener('imageGenerated', handleImageGenerated);
        return () => {
            document.removeEventListener('imageGenerated', handleImageGenerated);
        };
    }, []);

    const handleSave = () => {
        onSave(values);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-semibold mb-4">🖼️ Edit Image & Alt Text</h2>
                <p className="text-gray-600 mb-6">
                    {metaKeys.length === 1
                        ? 'Edit image and alt text below:'
                        : 'This image element has multiple meta attributes. Edit each field below:'
                    }
                </p>

                <div className="space-y-4">
                    {metaKeys.map((metaKey, index) => {
                        if (!metaKey.trim()) return null;
                        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                        const displayName = metaKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                        // Nếu chỉ có 1 meta và là image, hiển thị cả image và alt fields
                        if (metaKeys.length === 1 && metaKey.includes('image')) {
                            return (
                                <div key={uniqueKey} className="space-y-4">
                                    {/* Image Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {displayName} (Image)
                                        </label>
                                        {values[uniqueKey] && (
                                            <img
                                                src={values[uniqueKey]}
                                                alt="Preview"
                                                className="w-48 h-48 object-cover rounded border mb-2"
                                            />
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={values[uniqueKey] || ''}
                                                onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter image URL..."
                                            />
                                            <label className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600">
                                                Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => openImageGeneratorModal(uniqueKey)}
                                                className="px-4 py-2 bg-purple-500 text-white rounded-md cursor-pointer hover:bg-purple-600"
                                            >
                                                AI Generate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Alt Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Alt Text
                                        </label>
                                        <input
                                            type="text"
                                            value={values[`${uniqueKey}_alt`] || ''}
                                            onChange={(e) => handleInputChange(`${uniqueKey}_alt`, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter alt text..."
                                        />
                                    </div>
                                </div>
                            );
                        }
                        // Nếu có nhiều meta, xử lý như cũ
                        else if (metaKey.includes('image') && !metaKey.includes('alt')) {
                            return (
                                <div key={uniqueKey} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {displayName} (Image)
                                    </label>
                                    {values[uniqueKey] && (
                                        <img
                                            src={values[uniqueKey]}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded border mb-2"
                                        />
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={values[uniqueKey] || ''}
                                            onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter image URL..."
                                        />
                                        <label className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600">
                                            Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => openImageGeneratorModal(uniqueKey)}
                                            className="px-4 py-2 bg-purple-500 text-white rounded-md cursor-pointer hover:bg-purple-600"
                                        >
                                            AI Generate
                                        </button>
                                    </div>
                                </div>
                            );
                        } else if (metaKey.includes('alt')) {
                            return (
                                <div key={uniqueKey} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {displayName} (Alt Text)
                                    </label>
                                    <input
                                        type="text"
                                        value={values[uniqueKey] || ''}
                                        onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter alt text..."
                                    />
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        onClick={handleSave}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function TextEditModal({ metaKeys, currentValues, element, onSave, onClose }) {
    const { useState } = React;
    const [values, setValues] = useState(currentValues);

    const handleInputChange = (uniqueKey, value) => {
        setValues(prev => ({
            ...prev,
            [uniqueKey]: value
        }));
    };

    const handleSave = () => {
        onSave(values);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-semibold mb-4">✏️ Edit Multiple Meta Fields</h2>
                <p className="text-gray-600 mb-6">
                    This element has multiple meta attributes. Edit each field below:
                </p>

                <div className="space-y-4">
                    {metaKeys.map((metaKey, index) => {
                        if (!metaKey.trim()) return null;
                        const uniqueKey = metaKeys.length > 1 ? `${metaKey}_${index}` : metaKey;
                        const displayName = metaKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                        return (
                            <div key={uniqueKey} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {displayName}
                                </label>
                                <input
                                    type="text"
                                    value={values[uniqueKey] || ''}
                                    onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={`Enter ${displayName.toLowerCase()}...`}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        onClick={handleSave}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function GalleryModal({ onClose, onSave, images }) {
    const { useState } = React;
    const { DragDropContext, Droppable, Draggable } = window.ReactBeautifulDnd;
    const [list, setList] = useState(images || []);
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            const base64 = await fileToBase64(file);
            setList(prev => [
                ...prev,
                {
                    url: base64,
                    type: "image"
                }
            ]);
        }
    };

    const reorder = (arr, startIndex, endIndex) => {
        const result = Array.from(arr);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        setList(reorder(list, result.source.index, result.destination.index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl overflow-x-hidden">
                <h2 className="text-xl font-semibold mb-4">📷 Gallery Editor</h2>

                <label className="block mb-4">
                    <span className="sr-only">Upload images</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100 cursor-pointer"
                    />
                </label>

                <DragDropContext onDragEnd={onDragEnd} style={{
                    width: '100%',
                }}>
                    <Droppable droppableId="gallery" direction="horizontal">
                        {(provided) => (
                            <div
                                className="grid grid-cols-3 gap-3"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {list.map((src, i) => (
                                    <Draggable key={i} draggableId={`img-${i}`} index={i}>
                                        {(provided) => (
                                            <div
                                                className="relative group rounded-lg overflow-hidden border"
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <img
                                                    src={src.url}
                                                    className="w-full h-28 object-cover"
                                                />
                                                <button
                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100"
                                                    onClick={() => setList(list.filter((_, idx) => idx !== i))}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                            onSave(list);
                            onClose();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

