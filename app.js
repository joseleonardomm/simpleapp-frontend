// app.js - Lógica principal de la aplicación

// Estado de la aplicación
let appState = {
    currentUser: null,
    currentStore: null,
    products: [],
    cart: [],
    storeId: null,
    isAdmin: false,
    userEnabled: false,
    categories: [],
    currentCategoryFilter: null,
    viewerImages: [],
    viewerIndex: 0,
    editingProductImages: [], // Para manejar imágenes durante edición
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
};

// Referencias a elementos DOM
const elements = {
    authBtn: document.getElementById('auth-btn'),
    myStoreBtn: document.getElementById('my-store-btn'),
    viewCart: document.getElementById('view-cart'),
    configBtn: document.getElementById('config-btn'),
    addProduct: document.getElementById('add-product'),
    clearCart: document.getElementById('clear-cart'),
    checkoutWhatsapp: document.getElementById('checkout-whatsapp'),
    saveConfig: document.getElementById('save-config'),
    copyLink: document.getElementById('copy-link'),
    financeBtn: document.getElementById('finance-btn'),
    financeButtonContainer: document.getElementById('finance-button-container'),
    
    // Nuevos elementos para carrito flotante y paginación
    floatingCart: document.getElementById('floating-cart'),
    floatingCartCount: document.getElementById('floating-cart-count'),
    paginationContainer: document.getElementById('pagination-container'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    currentPageDisplay: document.getElementById('current-page-display'),
    totalPagesDisplay: document.getElementById('total-pages-display'),
    
    authModal: document.getElementById('auth-modal'),
    configModal: document.getElementById('config-modal'),
    productModal: document.getElementById('product-modal'),
    cartModal: document.getElementById('cart-modal'),
    categoryModal: document.getElementById('category-modal'),
    imageViewerModal: document.getElementById('image-viewer-modal'),
    
    adminPanel: document.getElementById('admin-panel'),
    catalogPanel: document.getElementById('catalog-panel'),
    productsList: document.getElementById('products-list'),
    catalogProducts: document.getElementById('catalog-products'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    storeName: document.getElementById('store-name'),
    storeTagline: document.getElementById('store-tagline'),
    storeIdDisplay: document.getElementById('store-id-display'),
    catalogDescription: document.getElementById('catalog-description'),
    currentYear: document.getElementById('current-year'),
    
    brandLogo: document.getElementById('brand-logo'),
    defaultLogo: document.getElementById('default-logo'),
    
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    productForm: document.getElementById('product-form'),
    
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    registerStoreName: document.getElementById('register-store-name'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerWhatsapp: document.getElementById('register-whatsapp'),
    whatsappNumber: document.getElementById('whatsapp-number'),
    storeDisplayName: document.getElementById('store-display-name'),
    storeLinkInput: document.getElementById('store-link-input'),
    productId: document.getElementById('product-id'),
    productName: document.getElementById('product-name'),
    productPrice: document.getElementById('product-price'),
    productDescription: document.getElementById('product-description'),
    productCategory: document.getElementById('product-category'),
    
    brandLogoUpload: document.getElementById('brand-logo-upload'),
    logoPreviewImage: document.getElementById('logo-preview-image'),
    logoPreview: document.getElementById('logo-preview'),
    selectedColorScheme: document.getElementById('selected-color-scheme'),
    colorSchemeOptions: document.querySelectorAll('.color-scheme-option'),
    
    manageCategoriesBtn: document.getElementById('manage-categories'),
    newCategoryName: document.getElementById('new-category-name'),
    addCategoryBtn: document.getElementById('add-category'),
    categoriesList: document.getElementById('categories-list'),
    
    viewerMainImage: document.getElementById('viewer-main-image'),
    viewerPrev: document.getElementById('viewer-prev'),
    viewerNext: document.getElementById('viewer-next'),
    currentImageIndex: document.getElementById('current-image-index'),
    totalImages: document.getElementById('total-images'),
    
    tabBtns: document.querySelectorAll('.tab-btn'),
    authModalTitle: document.getElementById('auth-modal-title'),
    authError: document.getElementById('auth-error')
};

// Inicializar la aplicación
async function initApp() {
    console.log("Iniciando aplicación...");
    
    try {
        elements.currentYear.textContent = new Date().getFullYear();
        setupEventListeners();
        handleHistory(); // Agregar manejo de historial
        checkURLParams();
        await setupFirebaseAuth();
        
        console.log("Aplicación inicializada correctamente");
    } catch (error) {
        console.error("Error inicializando aplicación:", error);
        showNotification("Error al iniciar la aplicación", "error");
    }
}

// Función para manejar el historial del navegador
function handleHistory() {
    // Agregar un estado inicial al historial
    if (!history.state) {
        history.replaceState({ modal: null, page: 1 }, '', window.location.href);
    }
    
    // Manejar el botón de atrás
    window.addEventListener('popstate', function(event) {
        if (event.state) {
            // Cerrar modales si estamos volviendo atrás
            if (event.state.modal === null) {
                closeAllModals();
            }
            
            // Restaurar página si está en el estado
            if (event.state.page) {
                appState.currentPage = event.state.page;
                updateUI();
            }
        }
    });
}

// Configurar parámetros de URL
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    
    if (storeId) {
        appState.storeId = storeId;
        console.log("Modo CLIENTE - storeId:", storeId);
        loadStoreForCustomer(storeId);
    } else {
        console.log("Modo ADMIN - esperando autenticación");
        elements.catalogDescription.textContent = "Inicia sesión para administrar tu tienda";
    }
}

// Configurar autenticación de Firebase
async function setupFirebaseAuth() {
    try {
        const { auth, onAuthStateChanged } = window.firebaseServices;
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                appState.currentUser = user;
                console.log("Usuario autenticado:", { uid: user.uid, email: user.email });
                
                if (user.email === "jmcristiano7.18@gmail.com") {
                    appState.isAdmin = true;
                }
                
                if (!appState.storeId) {
                    appState.storeId = user.uid;
                    console.log("Modo ADMIN activado para usuario:", user.uid);
                    await loadUserStore(user.uid);
                } else {
                    if (appState.storeId === user.uid) {
                        await loadUserStore(user.uid);
                    }
                }
                
                updateAuthUI();
            } else {
                console.log("Usuario NO autenticado");
                appState.currentUser = null;
                appState.userEnabled = false;
                updateAuthUI();
            }
        });
        
        console.log("Firebase Auth configurado correctamente");
    } catch (error) {
        console.error("Error configurando Firebase Auth:", error);
        throw error;
    }
}

// Cargar tienda del usuario
async function loadUserStore(storeId) {
    console.log("loadUserStore llamado con storeId:", storeId);
    
    try {
        const { db, doc, getDoc, setDoc, serverTimestamp } = window.firebaseServices;
        
        const userDocRef = doc(db, "users", storeId);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            await setDoc(userDocRef, {
                email: appState.currentUser.email,
                storeId: storeId,
                enabled: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            appState.userEnabled = false;
            showAccountDisabledMessage();
        } else {
            const userData = userSnap.data();
            const isEnabled = userData.enabled === true;
            appState.userEnabled = isEnabled;
            
            if (!isEnabled) {
                console.log("Usuario NO está habilitado");
                showAccountDisabledMessage();
                return;
            }
            
            console.log("Usuario está habilitado, continuando...");
        }
        
        const storeRef = doc(db, "stores", storeId);
        const storeSnap = await getDoc(storeRef);
        
        if (storeSnap.exists()) {
            console.log("Tienda encontrada:", storeSnap.data());
            appState.currentStore = storeSnap.data();
            await updateStoreBranding(appState.currentStore);
            elements.storeIdDisplay.textContent = storeId;
            await loadStoreProducts(storeId);
            
            if (appState.userEnabled) {
                console.log("Mostrando panel de administración...");
                elements.adminPanel.classList.remove('hidden');
                elements.catalogPanel.classList.add('hidden');
                elements.configBtn.classList.remove('hidden');
                elements.myStoreBtn.classList.remove('hidden');
                elements.addProduct.classList.remove('hidden');
                elements.manageCategoriesBtn.classList.remove('hidden');
            }
            
            loadCartFromLocalStorage();
        } else {
            console.log("Tienda NO existe, creando...");
            await createStoreForUser(storeId);
        }
        
    } catch (error) {
        console.error("Error cargando tienda:", error);
        showNotification("Error cargando tienda", "error");
    }
}

// Actualizar branding de la tienda
async function updateStoreBranding(storeData) {
    elements.storeName.textContent = storeData.storeName || "Mi Tienda";
    elements.storeIdDisplay.textContent = appState.storeId;
    
    if (storeData.logoUrl) {
        elements.brandLogo.src = storeData.logoUrl;
        elements.brandLogo.classList.remove('hidden');
        elements.defaultLogo.classList.add('hidden');
    } else {
        elements.brandLogo.classList.add('hidden');
        elements.defaultLogo.classList.remove('hidden');
    }
    
    if (storeData.colorScheme) {
        applyColorScheme(storeData.colorScheme);
    } else {
        applyColorScheme('whatsapp');
    }
}

// Aplicar esquema de colores
function applyColorScheme(scheme) {
    document.body.classList.remove(
        'color-scheme-whatsapp',
        'color-scheme-blue',
        'color-scheme-green',
        'color-scheme-purple',
        'color-scheme-red',
        'color-scheme-orange',
        'color-scheme-black-silver'
    );
    
    document.body.classList.add(`color-scheme-${scheme}`);
    
    if (elements.colorSchemeOptions) {
        elements.colorSchemeOptions.forEach(option => {
            if (option.dataset.scheme === scheme) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    if (elements.selectedColorScheme) {
        elements.selectedColorScheme.value = scheme;
    }
}

// Mostrar mensaje de cuenta deshabilitada
function showAccountDisabledMessage() {
    console.log("Mostrando mensaje de cuenta deshabilitada");
    
    elements.adminPanel.classList.add('hidden');
    elements.catalogPanel.classList.remove('hidden');
    elements.configBtn.classList.add('hidden');
    elements.addProduct.classList.add('hidden');
    elements.manageCategoriesBtn.classList.add('hidden');
    elements.financeButtonContainer.classList.add('hidden');
    
    elements.catalogDescription.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <h3><i class="fas fa-hourglass-half"></i> Cuenta Pendiente de Activación</h3>
            <p>Tu cuenta está pendiente de activación por el administrador.</p>
            <p>Una vez activada, podrás acceder a todas las funciones de tu tienda.</p>
            <p>Para más información, contacta al administrador.</p>
        </div>
    `;
    
    showNotification("Tu cuenta está pendiente de activación", "warning");
}

// Cargar tienda para cliente
async function loadStoreForCustomer(storeId) {
    try {
        console.log("Cargando tienda para cliente:", storeId);
        
        const { db, doc, getDoc } = window.firebaseServices;
        
        const storeRef = doc(db, "stores", storeId);
        const storeSnap = await getDoc(storeRef);
        
        if (storeSnap.exists()) {
            appState.currentStore = storeSnap.data();
            await updateStoreBranding(appState.currentStore);
            elements.catalogDescription.textContent = `Explora los productos de ${appState.currentStore.storeName}`;
            
            elements.authBtn.classList.add('hidden');
            elements.configBtn.classList.add('hidden');
            elements.myStoreBtn.classList.add('hidden');
            elements.financeButtonContainer.classList.add('hidden');
            
            await loadStoreProducts(storeId);
            loadCartFromLocalStorage();
        } else {
            showNotification("Tienda no encontrada", "error");
            elements.catalogDescription.textContent = "Tienda no encontrada";
        }
    } catch (error) {
        console.error("Error cargando tienda para cliente:", error);
        showNotification("Error cargando tienda", "error");
    }
}

// Crear tienda para usuario
async function createStoreForUser(storeId) {
    try {
        const { db, doc, setDoc, serverTimestamp } = window.firebaseServices;
        
        const storeData = {
            storeName: "Mi Tienda",
            ownerId: storeId,
            ownerEmail: appState.currentUser.email,
            whatsappNumber: "",
            logoUrl: "",
            colorScheme: "whatsapp",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "stores", storeId), storeData);
        appState.currentStore = storeData;
        await updateStoreBranding(storeData);
        
        if (appState.userEnabled) {
            elements.adminPanel.classList.remove('hidden');
            elements.catalogPanel.classList.add('hidden');
            elements.configBtn.classList.remove('hidden');
            elements.myStoreBtn.classList.remove('hidden');
            elements.addProduct.classList.remove('hidden');
            elements.manageCategoriesBtn.classList.remove('hidden');
        }
        
        loadCartFromLocalStorage();
        
        console.log("Tienda creada exitosamente");
    } catch (error) {
        console.error("Error creando tienda:", error);
        showNotification("Error creando tienda", "error");
    }
}

// Cargar productos de la tienda
async function loadStoreProducts(storeId) {
    try {
        console.log("Cargando productos para tienda:", storeId);
        
        const { db, collection, getDocs, query, orderBy } = window.firebaseServices;
        
        const productsRef = collection(db, "stores", storeId, "products");
        const productsQuery = query(productsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(productsQuery);
        
        appState.products = [];
        querySnapshot.forEach((doc) => {
            appState.products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Productos cargados: ${appState.products.length}`);
        
        await loadCategories();
        updateUI();
    } catch (error) {
        console.error("Error cargando productos:", error);
        showNotification("Error cargando productos", "error");
    }
}

// Cargar categorías
async function loadCategories() {
    if (!appState.storeId) return;
    
    try {
        const { db, collection, getDocs } = window.firebaseServices;
        
        const categoriesRef = collection(db, "stores", appState.storeId, "categories");
        const querySnapshot = await getDocs(categoriesRef);
        
        appState.categories = [];
        querySnapshot.forEach((doc) => {
            appState.categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        updateCategorySelect();
        
        if (elements.categoryModal && elements.categoryModal.classList.contains('active')) {
            renderCategoriesList();
        }
        
        console.log(`Categorías cargadas: ${appState.categories.length}`);
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// Actualizar selector de categorías
function updateCategorySelect() {
    if (!elements.productCategory) return;
    
    const currentValue = elements.productCategory.value;
    elements.productCategory.innerHTML = '<option value="">Sin categoría</option>';
    
    appState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        elements.productCategory.appendChild(option);
    });
    
    if (currentValue) {
        elements.productCategory.value = currentValue;
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log("Configurando event listeners...");
    
    if (elements.authBtn) elements.authBtn.addEventListener('click', openAuthModal);
    if (elements.myStoreBtn) elements.myStoreBtn.addEventListener('click', () => {
        if (appState.currentUser) {
            window.location.href = `/?store=${appState.currentUser.uid}`;
        }
    });
    if (elements.viewCart) elements.viewCart.addEventListener('click', () => {
        openModal(elements.cartModal);
        updateCartUI();
    });
    if (elements.configBtn) elements.configBtn.addEventListener('click', openConfigModal);
    if (elements.addProduct) elements.addProduct.addEventListener('click', openAddProductModal);
    if (elements.clearCart) elements.clearCart.addEventListener('click', clearCart);
    if (elements.checkoutWhatsapp) elements.checkoutWhatsapp.addEventListener('click', checkoutViaWhatsApp);
    if (elements.saveConfig) elements.saveConfig.addEventListener('click', saveStoreConfig);
    if (elements.copyLink) elements.copyLink.addEventListener('click', copyStoreLink);
    if (elements.financeBtn) elements.financeBtn.addEventListener('click', () => {
        window.location.href = 'finanzas.html';
    });
    
    // Nuevos event listeners para carrito flotante y paginación
    if (elements.floatingCart) {
        elements.floatingCart.addEventListener('click', () => {
            openModal(elements.cartModal);
            updateCartUI();
        });
    }
    
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', goToNextPage);
    }
    
    if (elements.manageCategoriesBtn) elements.manageCategoriesBtn.addEventListener('click', openCategoryModal);
    if (elements.addCategoryBtn) elements.addCategoryBtn.addEventListener('click', addCategory);
    
    if (elements.viewerPrev) elements.viewerPrev.addEventListener('click', showPreviousImage);
    if (elements.viewerNext) elements.viewerNext.addEventListener('click', showNextImage);
    
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegister);
    if (elements.productForm) elements.productForm.addEventListener('submit', handleProductSubmit);
    
    if (elements.tabBtns) {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchAuthTab(tab);
            });
        });
    }
    
    if (elements.colorSchemeOptions) {
        elements.colorSchemeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const scheme = option.dataset.scheme;
                elements.colorSchemeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                elements.selectedColorScheme.value = scheme;
                applyColorScheme(scheme);
            });
        });
    }
    
    if (elements.brandLogoUpload) {
        elements.brandLogoUpload.addEventListener('change', previewBrandLogo);
    }
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Botón para agregar nueva imagen - CORREGIDO PARA MÓVILES
    const addImageBtn = document.getElementById('add-image');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addNewImageRow();
        });
    }
    
    // Event delegation para botones dinámicos
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-product')) {
            const productId = e.target.closest('.edit-product').dataset.id;
            openEditProductModal(productId);
        }
        
        if (e.target.closest('.delete-product')) {
            const productId = e.target.closest('.delete-product').dataset.id;
            deleteProduct(productId);
        }
        
        if (e.target.closest('.add-to-cart')) {
            const productId = e.target.closest('.add-to-cart').dataset.id;
            addToCart(productId);
        }
        
        if (e.target.closest('.remove-from-cart')) {
            const productId = e.target.closest('.remove-from-cart').dataset.id;
            removeFromCart(productId);
        }
        
        if (e.target.closest('.decrease-quantity')) {
            const productId = e.target.closest('.decrease-quantity').dataset.id;
            updateCartQuantity(productId, -1);
        }
        
        if (e.target.closest('.increase-quantity')) {
            const productId = e.target.closest('.increase-quantity').dataset.id;
            updateCartQuantity(productId, 1);
        }
        
        if (e.target.closest('.cart-item-remove')) {
            const productId = e.target.closest('.cart-item-remove').dataset.id;
            removeFromCart(productId);
        }
        
        // Imágenes clickables para visor - MODIFICADO para usar product-image-single
        if (e.target.closest('.product-image-single') || e.target.closest('.no-image-placeholder')) {
            const productCard = e.target.closest('.product-card');
            const productId = productCard.dataset.id;
            const product = appState.products.find(p => p.id === productId);
            
            if (product && product.images && product.images.length > 0) {
                openImageViewer(product.images, 0); // Siempre abrir desde la primera imagen
            }
        }
        
        // Filtros de categoría
        if (e.target.closest('.category-filter')) {
            const filterBtn = e.target.closest('.category-filter');
            const categoryId = filterBtn.dataset.category;
            
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (categoryId === appState.currentCategoryFilter) {
                appState.currentCategoryFilter = null;
                appState.currentPage = 1;
            } else {
                filterBtn.classList.add('active');
                appState.currentCategoryFilter = categoryId;
                appState.currentPage = 1;
            }
            
            renderCatalogProducts();
        }
        
        if (e.target.closest('.edit-category')) {
            const categoryId = e.target.closest('.edit-category').dataset.id;
            editCategory(categoryId);
        }
        
        if (e.target.closest('.delete-category')) {
            const btn = e.target.closest('.delete-category');
            if (!btn.disabled) {
                const categoryId = btn.dataset.id;
                deleteCategory(categoryId);
            }
        }
    });
    
    // Event delegation para imágenes dentro del modal de producto
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('image-file')) {
            const row = e.target.closest('.image-input-row');
            if (row) {
                handleImageFileSelect(e, row);
            }
        }
    });
}

// Función para calcular paginación
function calculatePagination(products) {
    const totalProducts = products.length;
    appState.totalPages = Math.ceil(totalProducts / appState.itemsPerPage);
    
    // Asegurar que currentPage esté dentro de los límites
    if (appState.currentPage > appState.totalPages) {
        appState.currentPage = 1;
    }
    
    return {
        totalPages: appState.totalPages,
        currentPage: appState.currentPage,
        startIndex: (appState.currentPage - 1) * appState.itemsPerPage,
        endIndex: Math.min(appState.currentPage * appState.itemsPerPage, totalProducts)
    };
}

// Funciones para cambiar de página
function goToNextPage() {
    if (appState.currentPage < appState.totalPages) {
        appState.currentPage++;
        updateUI();
        // Agregar al historial
        history.pushState({ modal: null, page: appState.currentPage }, '', window.location.href);
    }
}

function goToPrevPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        updateUI();
        // Agregar al historial
        history.pushState({ modal: null, page: appState.currentPage }, '', window.location.href);
    }
}

// Función para actualizar UI de paginación
function updatePaginationUI() {
    if (elements.currentPageDisplay) {
        elements.currentPageDisplay.textContent = appState.currentPage;
    }
    if (elements.totalPagesDisplay) {
        elements.totalPagesDisplay.textContent = appState.totalPages;
    }
    
    // Habilitar/deshabilitar botones
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = appState.currentPage === 1;
        elements.prevPageBtn.classList.toggle('disabled', appState.currentPage === 1);
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = appState.currentPage === appState.totalPages;
        elements.nextPageBtn.classList.toggle('disabled', appState.currentPage === appState.totalPages);
    }
}

// Función para renderizar inputs de imágenes con controles de portada - CORREGIDA PARA MÓVILES
function renderImageInputs(images = [], isNew = false) {
    const container = document.getElementById('image-inputs-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Limpiar eventos anteriores para evitar duplicados
    const newContainer = container.cloneNode(false);
    container.parentNode.replaceChild(newContainer, container);
    const newContainerRef = newContainer;
    
    if (images.length === 0) {
        // Si no hay imágenes, crear un input vacío
        const inputRow = createImageInputRow(null, 0, true);
        newContainerRef.appendChild(inputRow);
    } else {
        // Renderizar cada imagen con sus controles
        images.forEach((image, index) => {
            const inputRow = createImageInputRow(image, index, index === 0);
            newContainerRef.appendChild(inputRow);
        });
    }
    
    // NO agregar fila extra automáticamente - el usuario la agregará si quiere
}

// Función para crear una fila de input de imagen - SOLUCIONADO: sin scroll
function createImageInputRow(imageData, index, isFeatured = false) {
    const row = document.createElement('div');
    row.className = 'image-input-row';
    row.dataset.index = index;
    
    let html = `
        <div class="image-input-preview">
    `;
    
    if (imageData) {
        // Si es una imagen existente (URL string) o un nuevo objeto File
        if (typeof imageData === 'string') {
            html += `<img src="${imageData}" alt="Imagen ${index + 1}" class="image-preview">`;
            html += `<input type="hidden" class="existing-image-input" value="${imageData}">`;
        } else if (imageData instanceof File) {
            const previewUrl = URL.createObjectURL(imageData);
            html += `<img src="${previewUrl}" alt="Nueva imagen ${index + 1}" class="image-preview">`;
        }
    } else {
        html += `<div class="no-preview">Sin imagen</div>`;
    }
    
    html += `</div>`;
    
    html += `
        <div class="image-input-controls">
            <div class="image-featured">
                <label class="featured-checkbox">
                    <input type="radio" name="featured-image" value="${index}" 
                           ${isFeatured ? 'checked' : ''} ${imageData ? '' : 'disabled'}>
                    <span class="featured-label">Portada</span>
                    ${isFeatured ? '<span class="featured-badge">PRINCIPAL</span>' : ''}
                </label>
            </div>
            
            <div class="image-actions">
                <label class="btn-file-upload">
                    <i class="fas fa-camera"></i> ${imageData ? 'Cambiar' : 'Seleccionar'}
                    <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg, image/webp" 
                           style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;"
                           ${index === 0 && !imageData ? 'required' : ''}>
                </label>
                
                <button type="button" class="btn-remove-image" ${!imageData ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                
                <button type="button" class="btn-move-up" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                
                <button type="button" class="btn-move-down" 
                        ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
            
            <div class="image-info">
                ${imageData ? 
                    `<span class="image-name">${typeof imageData === 'string' ? 'Imagen existente' : imageData.name}</span>` : 
                    '<span class="image-name">Nueva imagen</span>'
                }
                <span class="image-size">
                    ${imageData && imageData instanceof File ? 
                        `(${(imageData.size / 1024).toFixed(1)} KB)` : 
                        ''}
                </span>
            </div>
        </div>
    `;
    
    row.innerHTML = html;
    
    // Agregar event listeners
    const fileInput = row.querySelector('.image-file');
    const removeBtn = row.querySelector('.btn-remove-image');
    const moveUpBtn = row.querySelector('.btn-move-up');
    const moveDownBtn = row.querySelector('.btn-move-down');
    const featuredRadio = row.querySelector('input[name="featured-image"]');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleImageFileSelect(e, row);
        });
        
        // Agregar también para evitar scroll en focus
        fileInput.addEventListener('focus', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removeImageRow(row);
        });
    }
    
    if (moveUpBtn) {
        moveUpBtn.addEventListener('click', function() {
            moveImageRow(row, -1);
        });
    }
    
    if (moveDownBtn) {
        moveDownBtn.addEventListener('click', function() {
            moveImageRow(row, 1);
        });
    }
    
    if (featuredRadio) {
        featuredRadio.addEventListener('change', function() {
            if (this.checked) {
                updateFeaturedBadge(row, true);
                // Quitar badge de otras filas
                document.querySelectorAll('.image-input-row').forEach(otherRow => {
                    if (otherRow !== row) {
                        updateFeaturedBadge(otherRow, false);
                    }
                });
            }
        });
    }
    
    return row;
}

// Manejar selección de archivo - SOLUCIONADO: sin scroll
function handleImageFileSelect(event, row) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        showNotification("La imagen es demasiado grande (máximo 2MB)", "error");
        event.target.value = '';
        return;
    }
    
    // PREVENIR SCROLL - guardar posición actual
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const container = document.querySelector('.modal-content');
    const containerScroll = container ? container.scrollTop : 0;
    
    const previewContainer = row.querySelector('.image-input-preview');
    const imageInfo = row.querySelector('.image-info');
    const featuredRadio = row.querySelector('input[name="featured-image"]');
    const removeBtn = row.querySelector('.btn-remove-image');
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}" class="image-preview">
        `;
        
        // Actualizar info
        imageInfo.innerHTML = `
            <span class="image-name">${file.name}</span>
            <span class="image-size">(${(file.size / 1024).toFixed(1)} KB)</span>
        `;
        
        // Habilitar controles
        if (featuredRadio) featuredRadio.disabled = false;
        if (removeBtn) removeBtn.disabled = false;
        
        // Habilitar botones de movimiento
        const moveUpBtn = row.querySelector('.btn-move-up');
        const moveDownBtn = row.querySelector('.btn-move-down');
        if (moveUpBtn && row.previousElementSibling) {
            moveUpBtn.disabled = false;
        }
        if (moveDownBtn && row.nextElementSibling) {
            moveDownBtn.disabled = false;
        }
        
        // RESTAURAR POSICIÓN DEL SCROLL
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
            if (container) {
                container.scrollTop = containerScroll;
            }
        }, 50);
    };
    reader.readAsDataURL(file);
}

// Eliminar fila de imagen
function removeImageRow(row) {
    if (!confirm("¿Estás seguro de eliminar esta imagen?")) return;
    
    const container = document.getElementById('image-inputs-container');
    const rows = container.querySelectorAll('.image-input-row');
    
    if (rows.length <= 1) {
        showNotification("Debe haber al menos una imagen", "error");
        return;
    }
    
    row.remove();
    
    // Renumerar índices y actualizar controles
    updateImageRows();
}

// Mover fila de imagen
function moveImageRow(row, direction) {
    const container = document.getElementById('image-inputs-container');
    
    if (direction === -1 && row.previousElementSibling) {
        container.insertBefore(row, row.previousElementSibling);
    } else if (direction === 1 && row.nextElementSibling) {
        container.insertBefore(row.nextElementSibling, row);
    }
    
    updateImageRows();
}

// Actualizar todas las filas de imágenes
function updateImageRows() {
    const container = document.getElementById('image-inputs-container');
    if (!container) return;
    
    const rows = container.querySelectorAll('.image-input-row');
    
    rows.forEach((row, index) => {
        row.dataset.index = index;
        
        // Actualizar radio buttons de portada
        const radio = row.querySelector('input[name="featured-image"]');
        if (radio) {
            radio.value = index;
            
            // Si esta es la primera fila y no hay portada seleccionada, marcarla como portada
            if (index === 0 && !document.querySelector('input[name="featured-image"]:checked')) {
                radio.checked = true;
                updateFeaturedBadge(row, true);
            }
        }
        
        // Actualizar botones de movimiento
        const moveUpBtn = row.querySelector('.btn-move-up');
        const moveDownBtn = row.querySelector('.btn-move-down');
        
        if (moveUpBtn) {
            moveUpBtn.disabled = index === 0;
        }
        
        if (moveDownBtn) {
            moveDownBtn.disabled = index === rows.length - 1;
        }
        
        // Actualizar badge de portada
        const isFeatured = row.querySelector('input[name="featured-image"]:checked') !== null;
        updateFeaturedBadge(row, isFeatured);
    });
}

// Actualizar badge de portada
function updateFeaturedBadge(row, isFeatured) {
    const badge = row.querySelector('.featured-badge');
    const label = row.querySelector('.featured-label');
    
    if (isFeatured) {
        if (!badge && label) {
            const badgeElement = document.createElement('span');
            badgeElement.className = 'featured-badge';
            badgeElement.textContent = 'PRINCIPAL';
            label.parentNode.insertBefore(badgeElement, label.nextSibling);
        }
    } else {
        if (badge) {
            badge.remove();
        }
    }
}

// Nueva función para agregar fila de imagen - CORREGIDA PARA MÓVILES
function addNewImageRow() {
    const container = document.getElementById('image-inputs-container');
    if (!container) return;
    
    const rows = container.querySelectorAll('.image-input-row');
    
    if (rows.length >= 5) {
        showNotification("Máximo 5 imágenes por producto", "error");
        return;
    }
    
    const newIndex = rows.length;
    const newRow = createImageInputRow(null, newIndex, false);
    container.appendChild(newRow);
    
    // Forzar reflow para asegurar que los eventos se adjunten correctamente
    void container.offsetWidth;
    
    updateImageRows();
}

// Abrir visor de imágenes
function openImageViewer(images, startIndex = 0) {
    if (!images || images.length === 0) return;
    
    appState.viewerImages = images;
    appState.viewerIndex = startIndex;
    
    elements.viewerMainImage.src = images[startIndex];
    elements.currentImageIndex.textContent = startIndex + 1;
    elements.totalImages.textContent = images.length;
    
    openModal(elements.imageViewerModal);
}

// Navegar entre imágenes en el visor
function showPreviousImage() {
    if (appState.viewerImages.length <= 1) return;
    
    appState.viewerIndex = (appState.viewerIndex - 1 + appState.viewerImages.length) % appState.viewerImages.length;
    elements.viewerMainImage.src = appState.viewerImages[appState.viewerIndex];
    elements.currentImageIndex.textContent = appState.viewerIndex + 1;
}

function showNextImage() {
    if (appState.viewerImages.length <= 1) return;
    
    appState.viewerIndex = (appState.viewerIndex + 1) % appState.viewerImages.length;
    elements.viewerMainImage.src = appState.viewerImages[appState.viewerIndex];
    elements.currentImageIndex.textContent = appState.viewerIndex + 1;
}

// Previsualizar logo de marca
function previewBrandLogo() {
    const file = elements.brandLogoUpload.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        showNotification("El logo es demasiado grande (máximo 2MB)", "error");
        elements.brandLogoUpload.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        elements.logoPreviewImage.src = e.target.result;
        elements.logoPreviewImage.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        showAuthError("Por favor completa todos los campos");
        return;
    }
    
    try {
        const { auth, signInWithEmailAndPassword } = window.firebaseServices;
        await signInWithEmailAndPassword(auth, email, password);
        
        closeAllModals();
        showNotification("Sesión iniciada correctamente", "success");
    } catch (error) {
        console.error("Error de login:", error);
        
        let errorMessage = "Error al iniciar sesión";
        if (error.code === 'auth/invalid-credential') {
            errorMessage = "Correo o contraseña incorrectos";
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = "Usuario no encontrado";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Contraseña incorrecta";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
        }
        
        showAuthError(errorMessage);
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const storeName = elements.registerStoreName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    const whatsapp = elements.registerWhatsapp.value.trim();
    
    if (!storeName || !email || !password || !whatsapp) {
        showAuthError("Por favor completa todos los campos");
        return;
    }
    
    if (password.length < 6) {
        showAuthError("La contraseña debe tener al menos 6 caracteres");
        return;
    }
    
    if (!whatsapp.match(/^\d{10,15}$/)) {
        showAuthError("Ingresa un número de WhatsApp válido (10-15 dígitos)");
        return;
    }
    
    try {
        const { 
            auth, 
            createUserWithEmailAndPassword, 
            db, 
            doc, 
            setDoc, 
            serverTimestamp 
        } = window.firebaseServices;
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userData = {
            email: email,
            storeId: user.uid,
            storeName: storeName,
            enabled: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        
        const storeData = {
            storeName: storeName,
            ownerId: user.uid,
            ownerEmail: email,
            whatsappNumber: whatsapp,
            logoUrl: "",
            colorScheme: "whatsapp",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "stores", user.uid), storeData);
        
        closeAllModals();
        showNotification("¡Cuenta creada exitosamente! Pendiente de activación por el administrador.", "warning");
        
        setTimeout(() => {
            window.location.href = `/?store=${user.uid}`;
        }, 2000);
        
    } catch (error) {
        console.error("Error de registro:", error);
        
        let errorMessage = "Error al crear la cuenta";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo ya está registrado";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Correo electrónico inválido";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña es demasiado débil";
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = "Operación no permitida";
        }
        
        showAuthError(errorMessage);
    }
}

// Manejar submit del formulario - SOLUCIONADO: solo 1 imagen requerida
async function handleProductSubmit(e) {
    e.preventDefault();
    e.stopPropagation(); // Importante para móviles
    
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    // Deshabilitar el botón de submit para evitar envíos múltiples
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const productId = elements.productId.value;
        const name = elements.productName.value.trim();
        const price = parseFloat(elements.productPrice.value);
        const description = elements.productDescription.value.trim();
        const categoryId = elements.productCategory.value || null;
        
        if (!name || !price || price <= 0 || isNaN(price)) {
            showNotification("Completa nombre y precio válido", "error");
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            return;
        }
        
        // Obtener imágenes del formulario
        const imageRows = document.querySelectorAll('.image-input-row');
        const imageFiles = [];
        const existingImages = [];
        
        // Recopilar imágenes existentes y archivos nuevos
        imageRows.forEach(row => {
            const existingImageInput = row.querySelector('.existing-image-input');
            const fileInput = row.querySelector('.image-file');
            
            if (existingImageInput && existingImageInput.value) {
                existingImages.push(existingImageInput.value);
            } else if (fileInput && fileInput.files[0]) {
                imageFiles.push(fileInput.files[0]);
            }
        });
        
        // SOLUCIÓN: Solo se requiere al menos 1 imagen, no 2
        const totalImages = existingImages.length + imageFiles.length;
        if (totalImages === 0) {
            showNotification("Debes agregar al menos una imagen", "error");
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            return;
        }
        
        if (totalImages > 5) {
            showNotification("Máximo 5 imágenes por producto", "error");
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            return;
        }
        
        try {
            let imageUrls = [...existingImages]; // Mantener imágenes existentes
            
            // Subir nuevas imágenes
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    if (file.size > 2 * 1024 * 1024) {
                        showNotification(`La imagen ${file.name} es demasiado grande (máximo 2MB)`, "error");
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalText;
                        return;
                    }
                    
                    const imageUrl = await window.uploadImage(file, appState.storeId);
                    imageUrls.push(imageUrl);
                }
            }
            
            // Determinar la imagen de portada
            const featuredRadio = document.querySelector('input[name="featured-image"]:checked');
            let featuredIndex = featuredRadio ? parseInt(featuredRadio.value) : 0;
            
            // Reordenar array si es necesario (la primera debe ser la portada)
            if (featuredIndex > 0 && imageUrls[featuredIndex]) {
                const featuredImage = imageUrls[featuredIndex];
                imageUrls.splice(featuredIndex, 1);
                imageUrls.unshift(featuredImage);
            }
            
            const productData = {
                name,
                price,
                description,
                images: imageUrls,
                categoryId: categoryId,
                updatedAt: window.firebaseServices.serverTimestamp()
            };
            
            if (productId) {
                await window.firebaseServices.updateDoc(
                    window.firebaseServices.doc(
                        window.firebaseServices.db, 
                        "stores", 
                        appState.storeId, 
                        "products", 
                        productId
                    ),
                    productData
                );
                showNotification("Producto actualizado", "success");
            } else {
                productData.createdAt = window.firebaseServices.serverTimestamp();
                
                const docRef = await window.firebaseServices.addDoc(
                    window.firebaseServices.collection(
                        window.firebaseServices.db,
                        "stores",
                        appState.storeId,
                        "products"
                    ),
                    productData
                );
                
                const newProductId = docRef.id;
                console.log("Nuevo producto creado con ID:", newProductId);
                
                showNotification("Producto agregado", "success");
            }
            
            await loadStoreProducts(appState.storeId);
            closeAllModals();
            
            // Limpiar imágenes en edición
            appState.editingProductImages = [];
            
        } catch (error) {
            console.error("Error guardando producto:", error);
            showNotification("Error guardando producto", "error");
        }
        
        // Rehabilitar botón después de guardar
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        
    } catch (error) {
        console.error("Error en handleProductSubmit:", error);
        showNotification("Error guardando producto", "error");
        
        // Rehabilitar botón en caso de error
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Función para eliminar producto
async function deleteProduct(productId) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    
    try {
        await window.firebaseServices.deleteDoc(
            window.firebaseServices.doc(
                window.firebaseServices.db,
                "stores",
                appState.storeId,
                "products",
                productId
            )
        );
        
        appState.cart = appState.cart.filter(item => item.productId !== productId);
        saveCartToLocalStorage();
        
        showNotification("Producto eliminado", "success");
        await loadStoreProducts(appState.storeId);
    } catch (error) {
        console.error("Error eliminando producto:", error);
        showNotification("Error eliminando producto", "error");
    }
}

// Guardar configuración de tienda
async function saveStoreConfig() {
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    const whatsapp = elements.whatsappNumber.value.trim();
    const storeName = elements.storeDisplayName.value.trim();
    const colorScheme = elements.selectedColorScheme.value;
    
    if (!whatsapp || !storeName) {
        showNotification("Completa todos los campos obligatorios", "error");
        return;
    }
    
    if (!whatsapp.match(/^\d{10,15}$/)) {
        showNotification("Número de WhatsApp inválido", "error");
        return;
    }
    
    try {
        let logoUrl = appState.currentStore.logoUrl;
        
        if (elements.brandLogoUpload.files[0]) {
            const logoFile = elements.brandLogoUpload.files[0];
            
            if (logoFile.size > 2 * 1024 * 1024) {
                showNotification("El logo es demasiado grande (máximo 2MB)", "error");
                return;
            }
            
            logoUrl = await window.uploadLogo(logoFile, appState.storeId);
        }
        
        const storeData = {
            whatsappNumber: whatsapp,
            storeName: storeName,
            logoUrl: logoUrl,
            colorScheme: colorScheme,
            updatedAt: window.firebaseServices.serverTimestamp()
        };
        
        await window.firebaseServices.updateDoc(
            window.firebaseServices.doc(
                window.firebaseServices.db,
                "stores",
                appState.storeId
            ),
            storeData
        );
        
        appState.currentStore.whatsappNumber = whatsapp;
        appState.currentStore.storeName = storeName;
        appState.currentStore.logoUrl = logoUrl;
        appState.currentStore.colorScheme = colorScheme;
        
        await updateStoreBranding(appState.currentStore);
        
        closeAllModals();
        showNotification("Configuración guardada", "success");
    } catch (error) {
        console.error("Error guardando configuración:", error);
        showNotification("Error guardando configuración", "error");
    }
}

// Copiar enlace de tienda
function copyStoreLink() {
    const storeLink = `${window.location.origin}/?store=${appState.storeId}`;
    navigator.clipboard.writeText(storeLink)
        .then(() => {
            showNotification("Enlace copiado al portapapeles", "success");
        })
        .catch(() => {
            elements.storeLinkInput.select();
            document.execCommand('copy');
            showNotification("Enlace copiado", "success");
        });
}

// Cargar configuración en modal
function loadStoreConfig() {
    if (appState.currentStore) {
        elements.whatsappNumber.value = appState.currentStore.whatsappNumber || "";
        elements.storeDisplayName.value = appState.currentStore.storeName || "";
        elements.storeLinkInput.value = `${window.location.origin}/?store=${appState.storeId}`;
        
        if (appState.currentStore.logoUrl) {
            elements.logoPreviewImage.src = appState.currentStore.logoUrl;
            elements.logoPreviewImage.classList.remove('hidden');
        } else {
            elements.logoPreviewImage.classList.add('hidden');
        }
        
        elements.brandLogoUpload.value = '';
        
        const colorScheme = appState.currentStore.colorScheme || 'whatsapp';
        elements.selectedColorScheme.value = colorScheme;
        applyColorScheme(colorScheme);
    }
}

// Actualizar UI de autenticación
function updateAuthUI() {
    if (appState.currentUser) {
        elements.authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
        elements.authBtn.onclick = handleLogout;
        elements.myStoreBtn.classList.remove('hidden');
        
        if (appState.userEnabled) {
            elements.financeButtonContainer.classList.remove('hidden');
        } else {
            elements.financeButtonContainer.classList.add('hidden');
        }
    } else {
        elements.authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        elements.authBtn.onclick = openAuthModal;
        elements.myStoreBtn.classList.add('hidden');
        elements.financeButtonContainer.classList.add('hidden');
    }
}

// Manejar logout
async function handleLogout() {
    try {
        await window.firebaseServices.signOut(window.firebaseServices.auth);
        
        appState.currentUser = null;
        appState.currentStore = null;
        appState.products = [];
        appState.categories = [];
        appState.userEnabled = false;
        appState.currentPage = 1;
        
        elements.adminPanel.classList.add('hidden');
        elements.catalogPanel.classList.remove('hidden');
        elements.configBtn.classList.add('hidden');
        elements.myStoreBtn.classList.add('hidden');
        elements.addProduct.classList.add('hidden');
        elements.manageCategoriesBtn.classList.add('hidden');
        elements.financeButtonContainer.classList.add('hidden');
        elements.storeName.textContent = "Cargando tienda...";
        elements.storeTagline.textContent = "Catálogo Digital";
        elements.catalogDescription.textContent = "Inicia sesión para administrar tu tienda";
        
        elements.brandLogo.classList.add('hidden');
        elements.defaultLogo.classList.remove('hidden');
        
        applyColorScheme('whatsapp');
        
        appState.cart = [];
        saveCartToLocalStorage();
        updateCartCount();
        updateFloatingCart();
        
        window.location.href = '/';
        
        showNotification("Sesión cerrada", "success");
    } catch (error) {
        console.error("Error cerrando sesión:", error);
        showNotification("Error cerrando sesión", "error");
    }
}

// Mostrar error de autenticación
function showAuthError(message) {
    elements.authError.textContent = message;
    elements.authError.classList.remove('hidden');
    setTimeout(() => {
        elements.authError.classList.add('hidden');
    }, 5000);
}

// Cambiar tab de autenticación
function switchAuthTab(tab) {
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (tab === 'login') {
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
        elements.authModalTitle.textContent = "Iniciar Sesión";
    } else {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
        elements.authModalTitle.textContent = "Crear Cuenta";
    }
}

// Abrir modal de autenticación
function openAuthModal() {
    elements.loginEmail.value = "";
    elements.loginPassword.value = "";
    elements.registerStoreName.value = "";
    elements.registerEmail.value = "";
    elements.registerPassword.value = "";
    elements.registerWhatsapp.value = "";
    elements.authError.classList.add('hidden');
    switchAuthTab('login');
    openModal(elements.authModal);
}

// Abrir modal de configuración
function openConfigModal() {
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    loadStoreConfig();
    openModal(elements.configModal);
}

// Abrir modal de categorías
function openCategoryModal() {
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    renderCategoriesList();
    openModal(elements.categoryModal);
}

// Renderizar lista de categorías
function renderCategoriesList() {
    if (!elements.categoriesList) return;
    
    if (appState.categories.length === 0) {
        elements.categoriesList.innerHTML = `
            <div class="empty-categories">
                <i class="fas fa-tags"></i>
                <h3>No hay categorías</h3>
                <p>Agrega tu primera categoría</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    const categoryCounts = {};
    appState.products.forEach(product => {
        if (product.categoryId) {
            categoryCounts[product.categoryId] = (categoryCounts[product.categoryId] || 0) + 1;
        }
    });
    
    appState.categories.forEach(category => {
        const productCount = categoryCounts[category.id] || 0;
        
        html += `
            <div class="category-item" data-id="${category.id}">
                <div class="category-name">
                    ${category.name}
                    ${productCount > 0 ? `<span class="category-count">${productCount}</span>` : ''}
                </div>
                <div class="category-actions">
                    <button class="btn btn-secondary btn-small edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small delete-category" data-id="${category.id}" 
                            ${productCount > 0 ? 'disabled title="No se puede eliminar porque tiene productos"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.categoriesList.innerHTML = html;
}

// Agregar categoría
async function addCategory() {
    const name = elements.newCategoryName.value.trim();
    
    if (!name) {
        showNotification("Ingresa un nombre para la categoría", "error");
        return;
    }
    
    try {
        const { db, collection, addDoc, serverTimestamp } = window.firebaseServices;
        
        const categoryData = {
            name: name,
            storeId: appState.storeId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, "stores", appState.storeId, "categories"), categoryData);
        
        elements.newCategoryName.value = '';
        await loadCategories();
        
        showNotification("Categoría agregada", "success");
    } catch (error) {
        console.error("Error agregando categoría:", error);
        showNotification("Error agregando categoría", "error");
    }
}

// Editar categoría
async function editCategory(categoryId) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const newName = prompt("Nuevo nombre para la categoría:", category.name);
    
    if (newName && newName.trim() !== category.name) {
        try {
            const { db, doc, updateDoc, serverTimestamp } = window.firebaseServices;
            
            await updateDoc(doc(db, "stores", appState.storeId, "categories", categoryId), {
                name: newName.trim(),
                updatedAt: serverTimestamp()
            });
            
            await loadCategories();
            showNotification("Categoría actualizada", "success");
        } catch (error) {
            console.error("Error actualizando categoría:", error);
            showNotification("Error actualizando categoría", "error");
        }
    }
}

// Eliminar categoría
async function deleteCategory(categoryId) {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    
    try {
        const { db, doc, deleteDoc } = window.firebaseServices;
        
        await deleteDoc(doc(db, "stores", appState.storeId, "categories", categoryId));
        
        await loadCategories();
        showNotification("Categoría eliminada", "success");
    } catch (error) {
        console.error("Error eliminando categoría:", error);
        showNotification("Error eliminando categoría", "error");
    }
}

// Abrir modal para agregar producto
function openAddProductModal() {
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    elements.productForm.reset();
    elements.productId.value = "";
    elements.productCategory.value = "";
    document.getElementById('modal-title').textContent = "Agregar Producto";
    
    // Limpiar imágenes en edición
    appState.editingProductImages = [];
    
    // Renderizar inputs de imágenes vacíos
    renderImageInputs([], true);
    
    openModal(elements.productModal);
}

// Abrir modal para editar producto
function openEditProductModal(productId) {
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    elements.productForm.reset();
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productPrice.value = product.price;
    elements.productDescription.value = product.description || "";
    elements.productCategory.value = product.categoryId || "";
    document.getElementById('modal-title').textContent = "Editar Producto";
    
    // Guardar imágenes existentes para edición
    appState.editingProductImages = product.images || [];
    
    // Renderizar inputs con imágenes existentes
    renderImageInputs(appState.editingProductImages, false);
    
    openModal(elements.productModal);
}

// Función para abrir modal
function openModal(modal) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Agregar estado al historial
    const modalId = modal.id;
    history.pushState({ modal: modalId, page: appState.currentPage }, '', window.location.href);
}

// Función para cerrar modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    
    // Agregar estado al historial sin modal
    history.pushState({ modal: null, page: appState.currentPage }, '', window.location.href);
}

// Actualizar UI
function updateUI() {
    updateCartCount();
    updateFloatingCart();
    
    if (appState.currentUser && appState.userEnabled && appState.storeId === appState.currentUser.uid) {
        renderAdminProducts();
    } else {
        renderCatalogProducts();
    }
}

// Función para actualizar el carrito flotante
function updateFloatingCart() {
    const totalItems = appState.cart.reduce((total, item) => total + item.quantity, 0);
    
    if (elements.floatingCartCount) {
        elements.floatingCartCount.textContent = totalItems;
    }
    
    // Mostrar/ocultar el carrito flotante basado en el scroll
    if (elements.floatingCart) {
        if (totalItems > 0) {
            elements.floatingCart.classList.add('visible');
        } else {
            elements.floatingCart.classList.remove('visible');
        }
    }
}

// Renderizar productos en modo admin
function renderAdminProducts() {
    const container = elements.productsList;
    
    if (appState.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No hay productos aún</h3>
                <p>Agrega tu primer producto para comenzar</p>
            </div>
        `;
        // Ocultar paginación si no hay productos
        if (elements.paginationContainer) {
            elements.paginationContainer.classList.add('hidden');
        }
        return;
    }
    
    // Calcular paginación
    const pagination = calculatePagination(appState.products);
    const productsToShow = appState.products.slice(pagination.startIndex, pagination.endIndex);
    
    container.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product, true);
        container.appendChild(productCard);
    });
    
    // Mostrar paginación si hay más de 10 productos
    if (elements.paginationContainer) {
        if (appState.totalPages > 1) {
            elements.paginationContainer.classList.remove('hidden');
            updatePaginationUI();
        } else {
            elements.paginationContainer.classList.add('hidden');
        }
    }
}

// Renderizar productos en catálogo
function renderCatalogProducts() {
    const container = elements.catalogProducts;
    
    let filteredProducts = appState.products;
    if (appState.currentCategoryFilter) {
        filteredProducts = appState.products.filter(
            product => product.categoryId === appState.currentCategoryFilter
        );
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>${appState.currentCategoryFilter ? 'No hay productos en esta categoría' : 'Catálogo vacío'}</h3>
                <p>${appState.currentCategoryFilter ? 'Prueba con otra categoría' : 'No hay productos disponibles en este momento'}</p>
            </div>
        `;
        // Ocultar paginación si no hay productos
        if (elements.paginationContainer) {
            elements.paginationContainer.classList.add('hidden');
        }
        return;
    }
    
    // Calcular paginación
    const pagination = calculatePagination(filteredProducts);
    const productsToShow = filteredProducts.slice(pagination.startIndex, pagination.endIndex);
    
    container.innerHTML = '';
    
    if (appState.categories.length > 0) {
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'category-filters';
        
        const allBtn = document.createElement('button');
        allBtn.className = `category-filter ${!appState.currentCategoryFilter ? 'active' : ''}`;
        allBtn.textContent = 'Todos';
        allBtn.addEventListener('click', () => {
            appState.currentCategoryFilter = null;
            appState.currentPage = 1;
            renderCatalogProducts();
        });
        filtersContainer.appendChild(allBtn);
        
        appState.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `category-filter ${appState.currentCategoryFilter === category.id ? 'active' : ''}`;
            btn.dataset.category = category.id;
            btn.textContent = category.name;
            filtersContainer.appendChild(btn);
        });
        
        container.appendChild(filtersContainer);
    }
    
    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product, false);
        productsGrid.appendChild(productCard);
    });
    
    container.appendChild(productsGrid);
    
    // Mostrar paginación si hay más de 10 productos
    if (elements.paginationContainer) {
        if (pagination.totalPages > 1) {
            elements.paginationContainer.classList.remove('hidden');
            updatePaginationUI();
        } else {
            elements.paginationContainer.classList.add('hidden');
        }
    }
}

// Crear tarjeta de producto - MODIFICADO: Sin carrusel en miniaturas, solo portada
function createProductCard(product, isAdmin) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    
    const cartItem = appState.cart.find(item => item.productId === product.id);
    const inCart = cartItem ? true : false;
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    
    const category = product.categoryId ? 
        appState.categories.find(c => c.id === product.categoryId) : null;
    
    // IMAGEN: SOLO LA PORTADA (primera imagen) - SIN CARRUSEL EN MINIATURA
    let imageHTML = '';
    if (product.images && product.images.length > 0) {
        // Solo mostrar la primera imagen (portada) en miniatura
        imageHTML = `
            <div class="product-image-container">
                <img src="${product.images[0]}" alt="${product.name}" 
                     class="product-image-single" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'">
            </div>
        `;
    } else {
        imageHTML = `
            <div class="product-image-container">
                <div class="no-image-placeholder">
                    <i class="fas fa-image"></i>
                    <span>Sin imagen</span>
                </div>
            </div>
        `;
    }
    
    let actionsHTML = '';
    
    if (isAdmin && appState.userEnabled) {
        actionsHTML = `
            <div class="product-actions">
                <button class="btn btn-secondary edit-product" data-id="${product.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
    } else if (isAdmin && !appState.userEnabled) {
        actionsHTML = `
            <div class="product-actions">
                <p style="color: #dc3545; font-size: 0.9rem; margin: 10px 0;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Tu cuenta no está activada. No puedes editar productos.
                </p>
            </div>
        `;
    } else {
        actionsHTML = `
            <div class="product-actions">
                ${inCart ? `
                    <button class="btn btn-secondary remove-from-cart" data-id="${product.id}">
                        <i class="fas fa-minus"></i> Quitar
                    </button>
                    <span class="cart-quantity">${cartQuantity} en carrito</span>
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                ` : `
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> Agregar al carrito
                    </button>
                `}
            </div>
        `;
    }
    
    const categoryBadge = category ? 
        `<span class="product-category-badge">${category.name}</span>` : '';
    
    card.innerHTML = `
        ${imageHTML}
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            ${categoryBadge}
            <p class="product-description">${product.description || 'Sin descripción'}</p>
            ${actionsHTML}
        </div>
    `;
    
    return card;
}

// Funciones del carrito
function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = appState.cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : '',
            quantity: 1
        });
    }
    
    saveCartToLocalStorage();
    updateUI();
    updateFloatingCart();
    showNotification(`${product.name} agregado al carrito`, "success");
}

function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.productId !== productId);
    saveCartToLocalStorage();
    updateUI();
    updateFloatingCart();
    showNotification("Producto removido del carrito", "success");
}

function updateCartQuantity(productId, change) {
    const item = appState.cart.find(item => item.productId === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        saveCartToLocalStorage();
        updateCartUI();
        updateCartCount();
        updateFloatingCart();
    }
}

function clearCart() {
    if (appState.cart.length === 0) return;
    
    if (confirm("¿Vaciar todo el carrito?")) {
        appState.cart = [];
        saveCartToLocalStorage();
        updateUI();
        updateFloatingCart();
        showNotification("Carrito vaciado", "success");
    }
}

function calculateCartTotal() {
    return appState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const totalItems = appState.cart.reduce((total, item) => total + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
}

function updateCartUI() {
    const container = elements.cartItemsContainer;
    const emptyState = document.getElementById('cart-empty');
    const summary = document.getElementById('cart-summary');
    
    if (appState.cart.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (container) container.innerHTML = '';
        if (summary) summary.classList.add('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    if (summary) summary.classList.remove('hidden');
    
    if (container) {
        container.innerHTML = '';
        
        appState.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.id = item.productId;
            
            cartItem.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/100x100?text=Imagen'}" 
                     alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-quantity" data-id="${item.productId}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase-quantity" data-id="${item.productId}">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="cart-item-remove" data-id="${item.productId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(cartItem);
        });
    }
    
    if (elements.cartTotal) {
        elements.cartTotal.textContent = `$${calculateCartTotal().toFixed(2)}`;
    }
}

function saveCartToLocalStorage() {
    if (appState.storeId) {
        localStorage.setItem(`cart_${appState.storeId}`, JSON.stringify(appState.cart));
    }
}

function loadCartFromLocalStorage() {
    if (appState.storeId) {
        const savedCart = localStorage.getItem(`cart_${appState.storeId}`);
        if (savedCart) {
            try {
                appState.cart = JSON.parse(savedCart);
                updateCartCount();
                updateCartUI();
                updateFloatingCart();
            } catch (error) {
                console.error("Error cargando carrito:", error);
                appState.cart = [];
            }
        }
    }
}

// Checkout por WhatsApp
function checkoutViaWhatsApp() {
    if (appState.cart.length === 0) {
        showNotification("El carrito está vacío", "error");
        return;
    }
    
    if (!appState.currentStore || !appState.currentStore.whatsappNumber) {
        showNotification("La tienda no tiene WhatsApp configurado", "error");
        if (appState.currentUser && appState.userEnabled && appState.storeId === appState.currentUser.uid) {
            openConfigModal();
        }
        return;
    }
    
    let message = `Hola, quiero hacer un pedido de ${appState.currentStore.storeName}:\n\n`;
    
    appState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.name} (x${item.quantity}): $${item.price.toFixed(2)} c/u = $${itemTotal.toFixed(2)}\n`;
    });
    
    const total = calculateCartTotal();
    message += `\n*Total: $${total.toFixed(2)}*`;
    message += `\n\nPedido generado desde Catálogo Digital`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${appState.currentStore.whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
        if (confirm("¿Deseas vaciar el carrito después de enviar el pedido?")) {
            clearCart();
        }
    }, 500);
}

// Mostrar notificación
function showNotification(message, type = "success") {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);