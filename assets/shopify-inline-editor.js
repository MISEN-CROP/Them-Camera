/**
 * Shopify Admin Inline Editor
 * 
 * This script adds inline editing capabilities to Shopify themes
 * when viewed from the Shopify admin interface.
 * 
 * Usage:
 * 1. Include this script in your theme
 * 2. Call ShopifyInlineEditor.init() to initialize
 * 3. Configure editable elements as needed
 */

const ShopifyInlineEditor = (function () {
    // Configuration
    const config = {
        cookieName: '_orig_referrer',
        adminDomain: 'admin.shopify.com',
        forceEditorMode: false, // Set to true to test without cookies
        editorToolsId: 'shopify-editor-tools',
        statusElementId: 'editor-status',
        exitButtonId: 'exit-editor-mode'
    };

    // State
    let isActive = false;
    let editableElements = [];

    /**
     * Check if user is coming from Shopify admin
     * @returns {boolean} True if from Shopify admin
     */
    function isFromShopifyAdmin() {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(`${config.cookieName}=`) && cookie.includes(config.adminDomain)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Initialize the editor
     * @param {Array} elements Optional array of editable elements to configure
     */
    function init(elements = []) {
        // Check if we should show edit mode
        if (!isFromShopifyAdmin() && !config.forceEditorMode) {
            return;
        }

        console.log('Shopify admin detected - enabling editor mode');
        isActive = true;

        // Store editable elements
        if (elements.length > 0) {
            editableElements = elements;
        }

        // Create editor UI if it doesn't exist
        createEditorUI();

        // Add edit buttons to elements
        addEditButtons();

        // Setup exit button handler
        setupExitHandler();
    }

    /**
     * Create the editor UI
     */
    function createEditorUI() {
        // Check if editor tools already exist
        let editorTools = document.getElementById(config.editorToolsId);

        if (!editorTools) {
            // Create editor tools panel
            editorTools = document.createElement('div');
            editorTools.id = config.editorToolsId;
            editorTools.className = 'fixed bottom-4 left-4 z-[200] bg-white shadow-xl rounded-lg p-3 border border-slate-200';

            // Create inner content
            editorTools.innerHTML = `
                <div class="flex flex-col gap-2">
                    <div class="text-sm font-bold text-slate-700 pb-1 border-b border-slate-200">Shopify Editor</div>
                    <div id="${config.statusElementId}" class="text-xs text-emerald-600">Edit mode active</div>
                    <button id="${config.exitButtonId}" class="bg-slate-200 text-slate-700 px-3 py-1 text-sm rounded hover:bg-slate-300">
                        Exit Edit Mode
                    </button>
                </div>
            `;

            // Add to document
            document.body.appendChild(editorTools);
        } else {
            // Show existing editor tools
            editorTools.style.display = 'block';
            document.getElementById(config.statusElementId).textContent = 'Edit mode active';
        }
    }

    /**
     * Add edit buttons to editable elements
     */
    function addEditButtons() {
        editableElements.forEach(item => {
            const elements = document.querySelectorAll(item.selector);

            elements.forEach(element => {
                // Make the element position relative to position the edit button
                if (getComputedStyle(element).position === 'static') {
                    element.style.position = 'relative';
                }

                // Create edit button
                const editButton = document.createElement('button');
                editButton.className = 'absolute -top-4 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-50';
                editButton.innerHTML = '<i class="fas fa-pen text-xs"></i>';
                editButton.dataset.metafield = item.metafield;
                editButton.dataset.elementId = item.id;

                // Add edit button click handler
                editButton.addEventListener('click', function () {
                    startEditing(element, this.dataset.metafield);
                });

                // Add button to the element
                element.appendChild(editButton);

                // Add an ID to the element if it doesn't have one
                if (!element.id) {
                    element.id = item.id;
                }
            });
        });
    }

    /**
     * Setup exit button handler
     */
    function setupExitHandler() {
        const exitButton = document.getElementById(config.exitButtonId);
        if (exitButton) {
            exitButton.addEventListener('click', function () {
                const editorTools = document.getElementById(config.editorToolsId);
                editorTools.style.display = 'none';

                // Remove all edit buttons
                document.querySelectorAll('[data-metafield]').forEach(button => {
                    button.remove();
                });

                isActive = false;
            });
        }
    }

    /**
     * Start editing an element
     * @param {HTMLElement} element The element to edit
     * @param {string} metafieldKey The metafield key
     */
    function startEditing(element, metafieldKey) {
        const originalText = element.innerText;
        const originalHtml = element.innerHTML;

        // Create textarea for editing
        const textarea = document.createElement('textarea');
        textarea.value = originalText;
        textarea.className = 'w-full p-2 border border-blue-500 rounded';
        textarea.style.minHeight = '100px';

        // Clear the element and add the textarea
        element.innerHTML = '';
        element.appendChild(textarea);
        textarea.focus();

        // Create save and cancel buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2 mt-2';

        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.className = 'bg-emerald-500 text-white px-3 py-1 rounded';

        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.className = 'bg-red-500 text-white px-3 py-1 rounded';

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        element.appendChild(buttonContainer);

        // Save button click handler
        saveButton.addEventListener('click', function () {
            const newText = textarea.value;

            // Update UI
            element.innerHTML = originalHtml;

            // Update the text content (find the first text node)
            const textNode = Array.from(element.childNodes).find(node =>
                node.nodeType === Node.TEXT_NODE ||
                (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'span')
            );

            if (textNode) {
                if (textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = newText;
                } else {
                    textNode.innerText = newText;
                }
            }

            // Update status message
            updateStatus('Saving changes...');

            // Send to Shopify API
            saveToShopifyAPI(metafieldKey, newText);
        });

        // Cancel button click handler
        cancelButton.addEventListener('click', function () {
            element.innerHTML = originalHtml;
        });
    }

    /**
     * Save content to Shopify API
     * @param {string} metafieldKey The metafield key
     * @param {string} value The new value
     */
    function saveToShopifyAPI(metafieldKey, value) {
        // Get product ID from the page
        const productId = window.ProductMetaFields ? window.ProductMetaFields.id : null;

        if (!productId) {
            console.error('Product ID not found');
            updateStatus('Error: Product ID not found', true);
            return;
        }

        // Log saving message
        console.log(`Saving metafield ${metafieldKey} with value "${value}" for product ${productId}`);

        // In a real implementation, you would use fetch to call the Shopify API
        // Example:
        /*
        fetch('/api/update-metafield', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                metafieldKey: metafieldKey,
                value: value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatus('Changes saved!');
            } else {
                updateStatus('Error saving changes', true);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            updateStatus('Error saving changes', true);
        });
        */

        // For demo purposes, simulate successful API call
        setTimeout(() => {
            updateStatus('Changes saved!');
        }, 1000);
    }

    /**
     * Update the status message
     * @param {string} message The message to display
     * @param {boolean} isError Whether this is an error message
     */
    function updateStatus(message, isError = false) {
        const statusElement = document.getElementById(config.statusElementId);
        if (statusElement) {
            statusElement.textContent = message;

            if (isError) {
                statusElement.className = 'text-xs text-red-600';
            } else {
                statusElement.className = 'text-xs text-emerald-600';
            }

            // Reset after 3 seconds
            setTimeout(() => {
                statusElement.textContent = 'Edit mode active';
                statusElement.className = 'text-xs text-emerald-600';
            }, 3000);
        }
    }

    /**
     * Add an editable element configuration
     * @param {Object} element The element configuration
     */
    function addEditableElement(element) {
        editableElements.push(element);

        // If already active, add edit button immediately
        if (isActive) {
            const elements = document.querySelectorAll(element.selector);
            elements.forEach(el => {
                // Make the element position relative
                if (getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }

                // Create edit button
                const editButton = document.createElement('button');
                editButton.className = 'absolute -top-4 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-50';
                editButton.innerHTML = '<i class="fas fa-pen text-xs"></i>';
                editButton.dataset.metafield = element.metafield;
                editButton.dataset.elementId = element.id;

                // Add edit button click handler
                editButton.addEventListener('click', function () {
                    startEditing(el, this.dataset.metafield);
                });

                // Add button to the element
                el.appendChild(editButton);

                // Add an ID to the element if it doesn't have one
                if (!el.id) {
                    el.id = element.id;
                }
            });
        }
    }

    // Public API
    return {
        init,
        addEditableElement,
        isActive: () => isActive
    };
})();