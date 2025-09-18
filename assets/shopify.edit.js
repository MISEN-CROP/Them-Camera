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
        const metaKey = el.getAttribute("data-meta");
        const typeMeta = el.getAttribute("data-type");
        if (!typeMeta) {
            valuesDefault[metaKey] = el.innerText;
            newValues[metaKey] = el.innerText;
        } else if (typeMeta === "icon") {
            const iconClass = el.className.split(' ').find(c => c.startsWith('fa-'))?.substring(3) || '';
            valuesDefault[metaKey] = iconClass;
            newValues[metaKey] = iconClass;
        } else if (typeMeta === "image") {
            valuesDefault[metaKey] = {
                url: el.src,
                type: "image"
            };
            newValues[metaKey] = {
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
            valuesDefault[metaKey] = images;
            newValues[metaKey] = images;
        }


        el.setAttribute("contenteditable", "true");
        el.classList.add("editMode");
        if (typeMeta === "image") {
            el.addEventListener("click", async () => {
                const inputFile = document.createElement("input");
                inputFile.type = "file";
                inputFile.accept = "image/*";
                inputFile.click();

                inputFile.addEventListener("change", async (event) => {
                    const file = event.target.files[0];
                    newValues[metaKey] = {
                        url: await fileToBase64(file),
                        type: "image"
                    };
                    if (typeof file === "string") {
                        el.src = file;
                    } else {
                        el.src = URL.createObjectURL(file);
                    }
                    if (!_.isEqual(valuesDefault, newValues)) {
                        btnSaveChange.style.display = "block";
                    } else {
                        btnSaveChange.style.display = "none";
                    }
                }
                );
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
                    newValues[metaKey] = iconClass;

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
                openGalleryModal(metaKey);
            });
        }
        else {
            el.addEventListener("click", (e) => {
                e.preventDefault();
            });
            const onChange = (event) => {
                newValues[metaKey] = event.target.innerText;
                if (!_.isEqual(valuesDefault, newValues)) {
                    btnSaveChange.style.display = "block";
                } else {
                    btnSaveChange.style.display = "none";
                }
            }

            el.addEventListener("input", onChange);
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
    })
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
            }),
        });
        const data = await res.json();
        if (data.code === 0) {
            btnSaveChange.style.display = "none";
        }
        console.log("Response from server:", data);
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
                newValues[metaKey] = images;
                if (!_.isEqual(valuesDefault, newValues)) {
                    btnSaveChange.style.display = "block";
                } else {
                    btnSaveChange.style.display = "none";
                }
                const elContainer = document.querySelector(`[data-meta="${metaKey}"]`);
                const elImage = document.querySelector(`[data-meta="${metaKey}"] img`);
                const className = elImage.getAttribute("class") || "";
                elContainer.innerHTML = "";
                images.forEach((file) => {
                    const img = document.createElement("img");
                    img.className = className;
                    img.src = file.url;
                    elContainer.appendChild(img);
                });

            }}
            onClose={() => {
                galleryRoot.unmount();
            }}
        />
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

