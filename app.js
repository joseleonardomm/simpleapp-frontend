// app.js - Lógica principal de la aplicación

// Estado de la aplicación
let appState = {
    currentUser: null,
    currentStore: null,
    products: [],
    cart: [],
    storeId: null,
    isAdmin: false,
    userEnabled: false  // Nuevo campo para verificar si el usuario está habilitado
};

// Referencias a elementos DOM
const elements = {
    // Botones principales
    authBtn: document.getElementById('auth-btn'),
    myStoreBtn: document.getElementById('my-store-btn'),
    viewCart: document.getElementById('view-cart'),
    configBtn: document.getElementById('config-btn'),
    addProduct: document.getElementById('add-product'),
    clearCart: document.getElementById('clear-cart'),
    checkoutWhatsapp: document.getElementById('checkout-whatsapp'),
    saveConfig: document.getElementById('save-config'),
    copyLink: document.getElementById('copy-link'),
    
    // Modales
    authModal: document.getElementById('auth-modal'),
    configModal: document.getElementById('config-modal'),
    productModal: document.getElementById('product-modal'),
    cartModal: document.getElementById('cart-modal'),
    
    // Paneles
    adminPanel: document.getElementById('admin-panel'),
    catalogPanel: document.getElementById('catalog-panel'),
    productsList: document.getElementById('products-list'),
    catalogProducts: document.getElementById('catalog-products'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    
    // Elementos de información
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    storeName: document.getElementById('store-name'),
    storeIdDisplay: document.getElementById('store-id-display'),
    catalogDescription: document.getElementById('catalog-description'),
    currentYear: document.getElementById('current-year'),
    
    // Formularios
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    productForm: document.getElementById('product-form'),
    
    // Campos de formularios
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
    
    // Tabs y otros
    tabBtns: document.querySelectorAll('.tab-btn'),
    authModalTitle: document.getElementById('auth-modal-title'),
    authError: document.getElementById('auth-error')
};

// Inicializar la aplicación
async function initApp() {
    console.log("Iniciando aplicación...");
    
    try {
        // Establecer año actual
        elements.currentYear.textContent = new Date().getFullYear();
        
        // Configurar event listeners básicos primero
        setupEventListeners();
        
        // Verificar parámetros de URL
        checkURLParams();
        
        // Configurar autenticación de Firebase
        await setupFirebaseAuth();
        
        console.log("Aplicación inicializada correctamente");
    } catch (error) {
        console.error("Error inicializando aplicación:", error);
        showNotification("Error al iniciar la aplicación", "error");
    }
}

// Configurar parámetros de URL
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    
    console.log("Parámetros de URL:", { storeId, fullUrl: window.location.href });
    
    if (storeId) {
        // Vista de cliente - cargar tienda específica
        appState.storeId = storeId;
        console.log("Modo CLIENTE - storeId:", storeId);
        loadStoreForCustomer(storeId);
    } else {
        // Vista de propietario (requiere autenticación)
        console.log("Modo ADMIN - esperando autenticación");
        elements.catalogDescription.textContent = "Inicia sesión para administrar tu tienda";
    }
}

// Configurar autenticación de Firebase
async function setupFirebaseAuth() {
    try {
        const { auth, onAuthStateChanged } = window.firebaseServices;
        
        // Escuchar cambios en el estado de autenticación
        onAuthStateChanged(auth, async (user) => {
            console.log("Estado de autenticación cambiado:", user ? "Usuario autenticado" : "Usuario no autenticado");
            
            if (user) {
                // Usuario autenticado
                appState.currentUser = user;
                console.log("Usuario autenticado:", { uid: user.uid, email: user.email });
                
                // Verificar si es el administrador
                if (user.email === "jmcristiano7.18@gmail.com") {
                    appState.isAdmin = true;
                    console.log("Usuario es el administrador principal");
                }
                
                // Si no hay storeId en URL, usar el ID del usuario
                if (!appState.storeId) {
                    appState.storeId = user.uid;
                    console.log("Modo ADMIN activado para usuario:", user.uid);
                    await loadUserStore(user.uid);
                } else {
                    // Si hay storeId en URL, verificar si es el propietario
                    if (appState.storeId === user.uid) {
                        await loadUserStore(user.uid);
                    }
                }
                
                updateAuthUI();
            } else {
                // Usuario no autenticado
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
    console.log("Usuario actual:", appState.currentUser?.uid);
    
    try {
        const { db, doc, getDoc, setDoc, serverTimestamp } = window.firebaseServices;
        
        // 1. Verificar si el usuario está habilitado
        console.log("Verificando estado de usuario...");
        const userDocRef = doc(db, "users", storeId);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            // Crear documento de usuario si no existe
            console.log("Usuario no existe en Firestore, creando...");
            await setDoc(userDocRef, {
                email: appState.currentUser.email,
                storeId: storeId,
                enabled: false, // Por defecto desactivado
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            appState.userEnabled = false;
            showAccountDisabledMessage();
            
        } else {
            // Verificar estado de habilitación
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
        
        // 2. Cargar tienda (solo si el usuario está habilitado)
        console.log("Buscando tienda en Firestore...");
        const storeRef = doc(db, "stores", storeId);
        const storeSnap = await getDoc(storeRef);
        
        if (storeSnap.exists()) {
            console.log("Tienda encontrada:", storeSnap.data());
            appState.currentStore = storeSnap.data();
            elements.storeName.textContent = appState.currentStore.storeName;
            elements.storeIdDisplay.textContent = storeId;
            await loadStoreProducts(storeId);
            
            // Mostrar panel de administración solo si el usuario está habilitado
            if (appState.userEnabled) {
                console.log("Mostrando panel de administración...");
                elements.adminPanel.classList.remove('hidden');
                elements.catalogPanel.classList.add('hidden');
                elements.configBtn.classList.remove('hidden');
                elements.myStoreBtn.classList.remove('hidden');
                elements.addProduct.classList.remove('hidden');
            }
            
            // Cargar carrito
            loadCartFromLocalStorage();
        } else {
            console.log("Tienda NO existe, creando...");
            // Crear tienda si no existe
            await createStoreForUser(storeId);
        }
        
    } catch (error) {
        console.error("Error cargando tienda:", error);
        showNotification("Error cargando tienda", "error");
    }
}

// Mostrar mensaje de cuenta deshabilitada
function showAccountDisabledMessage() {
    console.log("Mostrando mensaje de cuenta deshabilitada");
    
    // Ocultar panel de administración
    elements.adminPanel.classList.add('hidden');
    elements.catalogPanel.classList.remove('hidden');
    elements.configBtn.classList.add('hidden');
    elements.addProduct.classList.add('hidden');
    
    // Mostrar mensaje al usuario
    elements.catalogDescription.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <h3><i class="fas fa-hourglass-half"></i> Cuenta Pendiente de Activación</h3>
            <p>Tu cuenta está pendiente de activación por el administrador.</p>
            <p>Una vez activada, podrás acceder a todas las funciones de tu tienda.</p>
            <p>Para más información, contacta al administrador.</p>
        </div>
    `;
    
    // Mostrar notificación
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
            elements.storeName.textContent = appState.currentStore.storeName;
            elements.catalogDescription.textContent = `Explora los productos de ${appState.currentStore.storeName}`;
            
            // Ocultar botones de administración (modo cliente)
            elements.authBtn.classList.add('hidden');
            elements.configBtn.classList.add('hidden');
            elements.myStoreBtn.classList.add('hidden');
            
            await loadStoreProducts(storeId);
            
            // Cargar carrito
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "stores", storeId), storeData);
        appState.currentStore = storeData;
        elements.storeName.textContent = "Mi Tienda";
        elements.storeIdDisplay.textContent = storeId;
        
        // Solo mostrar panel de administración si el usuario está habilitado
        if (appState.userEnabled) {
            elements.adminPanel.classList.remove('hidden');
            elements.catalogPanel.classList.add('hidden');
            elements.configBtn.classList.remove('hidden');
            elements.myStoreBtn.classList.remove('hidden');
            elements.addProduct.classList.remove('hidden');
        }
        
        // Cargar carrito
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
        updateUI();
    } catch (error) {
        console.error("Error cargando productos:", error);
        showNotification("Error cargando productos", "error");
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log("Configurando event listeners...");
    
    // Botones principales
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
    
    // Formularios
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegister);
    if (elements.productForm) elements.productForm.addEventListener('submit', handleProductSubmit);
    
    // Tabs de autenticación
    if (elements.tabBtns) {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchAuthTab(tab);
            });
        });
    }
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Gestión de imágenes en formulario de producto
    const addImageBtn = document.getElementById('add-image');
    if (addImageBtn) addImageBtn.addEventListener('click', addImageInput);
    
    // Event delegation para botones dinámicos
    document.addEventListener('click', function(e) {
        // Editar producto
        if (e.target.closest('.edit-product')) {
            const productId = e.target.closest('.edit-product').dataset.id;
            openEditProductModal(productId);
        }
        
        // Eliminar producto
        if (e.target.closest('.delete-product')) {
            const productId = e.target.closest('.delete-product').dataset.id;
            deleteProduct(productId);
        }
        
        // Agregar al carrito
        if (e.target.closest('.add-to-cart')) {
            const productId = e.target.closest('.add-to-cart').dataset.id;
            addToCart(productId);
        }
        
        // Quitar del carrito
        if (e.target.closest('.remove-from-cart')) {
            const productId = e.target.closest('.remove-from-cart').dataset.id;
            removeFromCart(productId);
        }
        
        // Cantidad en carrito
        if (e.target.closest('.decrease-quantity')) {
            const productId = e.target.closest('.decrease-quantity').dataset.id;
            updateCartQuantity(productId, -1);
        }
        
        if (e.target.closest('.increase-quantity')) {
            const productId = e.target.closest('.increase-quantity').dataset.id;
            updateCartQuantity(productId, 1);
        }
        
        // Eliminar del carrito
        if (e.target.closest('.cart-item-remove')) {
            const productId = e.target.closest('.cart-item-remove').dataset.id;
            removeFromCart(productId);
        }
        
        // Remover imagen en formulario de producto
        if (e.target.closest('.btn-remove-image')) {
            const imageInput = e.target.closest('.image-input');
            if (imageInput) {
                imageInput.remove();
            }
        }
    });
    
    // Previsualización de imágenes en formulario de producto
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('image-file')) {
            previewImage(e.target);
        }
    });
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
    
    // Validaciones
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
        
        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Crear documento de usuario en Firestore (deshabilitado por defecto)
        const userData = {
            email: email,
            storeId: user.uid,
            storeName: storeName,
            enabled: false, // Deshabilitado hasta que el admin lo active
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        
        // Crear tienda
        const storeData = {
            storeName: storeName,
            ownerId: user.uid,
            ownerEmail: email,
            whatsappNumber: whatsapp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "stores", user.uid), storeData);
        
        closeAllModals();
        
        // Mostrar mensaje especial para registro
        showNotification("¡Cuenta creada exitosamente! Pendiente de activación por el administrador.", "warning");
        
        // Redirigir a su tienda (pero estará deshabilitada hasta que la actives)
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

// Manejar producto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    // Verificar que el usuario esté habilitado
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    const productId = elements.productId.value;
    const name = elements.productName.value.trim();
    const price = parseFloat(elements.productPrice.value);
    const description = elements.productDescription.value.trim();
    
    // Validaciones
    if (!name || !price || price <= 0 || isNaN(price)) {
        showNotification("Completa nombre y precio válido", "error");
        return;
    }
    
    // Obtener archivos de imágenes
    const imageInputs = document.querySelectorAll('.image-file');
    const files = Array.from(imageInputs)
        .map(input => input.files[0])
        .filter(file => file);
    
    if (files.length === 0) {
        // Si estamos editando y no hay archivos nuevos, mantener las existentes
        const existingImages = document.querySelectorAll('.existing-image');
        if (existingImages.length === 0) {
            showNotification("Debes agregar al menos una imagen", "error");
            return;
        }
    }
    
    try {
        let imageUrls = [];
        
        // Si hay archivos nuevos, subirlos
        if (files.length > 0) {
            for (const file of files) {
                if (file.size > 2 * 1024 * 1024) { // 2MB
                    showNotification(`La imagen ${file.name} es demasiado grande (máximo 2MB)`, "error");
                    return;
                }
                
                const imageUrl = await window.uploadImage(file, appState.storeId);
                imageUrls.push(imageUrl);
            }
        } else if (productId) {
            // Si estamos editando y no hay archivos nuevos, usar las imágenes existentes
            const existingImages = document.querySelectorAll('.existing-image');
            existingImages.forEach(input => {
                if (input.value) imageUrls.push(input.value);
            });
        }
        
        if (imageUrls.length === 0) {
            showNotification("Debes agregar al menos una imagen", "error");
            return;
        }
        
        const productData = {
            name,
            price,
            description,
            images: imageUrls,
            updatedAt: window.firebaseServices.serverTimestamp()
        };
        
        if (productId) {
            // Actualizar producto existente
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
            // Crear nuevo producto
            productData.createdAt = window.firebaseServices.serverTimestamp();
            
            await window.firebaseServices.addDoc(
                window.firebaseServices.collection(
                    window.firebaseServices.db,
                    "stores",
                    appState.storeId,
                    "products"
                ),
                productData
            );
            showNotification("Producto agregado", "success");
        }
        
        // Recargar productos y cerrar modal
        await loadStoreProducts(appState.storeId);
        closeAllModals();
    } catch (error) {
        console.error("Error guardando producto:", error);
        showNotification("Error guardando producto", "error");
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
        
        // Eliminar del carrito si está
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
    // Verificar que el usuario esté habilitado
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    const whatsapp = elements.whatsappNumber.value.trim();
    const storeName = elements.storeDisplayName.value.trim();
    
    if (!whatsapp || !storeName) {
        showNotification("Completa todos los campos", "error");
        return;
    }
    
    if (!whatsapp.match(/^\d{10,15}$/)) {
        showNotification("Número de WhatsApp inválido", "error");
        return;
    }
    
    try {
        await window.firebaseServices.updateDoc(
            window.firebaseServices.doc(
                window.firebaseServices.db,
                "stores",
                appState.storeId
            ),
            {
                whatsappNumber: whatsapp,
                storeName: storeName,
                updatedAt: window.firebaseServices.serverTimestamp()
            }
        );
        
        appState.currentStore.whatsappNumber = whatsapp;
        appState.currentStore.storeName = storeName;
        elements.storeName.textContent = storeName;
        
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
            // Fallback para navegadores antiguos
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
    }
}

// Actualizar UI de autenticación
function updateAuthUI() {
    if (appState.currentUser) {
        elements.authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
        elements.authBtn.onclick = handleLogout;
        elements.myStoreBtn.classList.remove('hidden');
    } else {
        elements.authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        elements.authBtn.onclick = openAuthModal;
        elements.myStoreBtn.classList.add('hidden');
    }
}

// Manejar logout
async function handleLogout() {
    try {
        await window.firebaseServices.signOut(window.firebaseServices.auth);
        
        // Limpiar estado
        appState.currentUser = null;
        appState.currentStore = null;
        appState.products = [];
        appState.userEnabled = false;
        
        // Restablecer UI
        elements.adminPanel.classList.add('hidden');
        elements.catalogPanel.classList.remove('hidden');
        elements.configBtn.classList.add('hidden');
        elements.myStoreBtn.classList.add('hidden');
        elements.addProduct.classList.add('hidden');
        elements.storeName.textContent = "Cargando tienda...";
        elements.catalogDescription.textContent = "Inicia sesión para administrar tu tienda";
        
        // Limpiar carrito
        appState.cart = [];
        saveCartToLocalStorage();
        updateCartCount();
        
        // Redirigir a la página principal
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
    // Verificar que el usuario esté habilitado
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    loadStoreConfig();
    openModal(elements.configModal);
}

// Abrir modal para agregar producto
function openAddProductModal() {
    // Verificar que el usuario esté habilitado
    if (!appState.userEnabled) {
        showNotification("Tu cuenta no está activada. Contacta al administrador.", "error");
        return;
    }
    
    elements.productForm.reset();
    elements.productId.value = "";
    document.getElementById('modal-title').textContent = "Agregar Producto";
    
    // Resetear inputs de imagen
    const imageContainer = document.querySelector('.image-inputs');
    imageContainer.innerHTML = `
        <div class="image-input">
            <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg" required>
            <button type="button" class="btn-remove-image"><i class="fas fa-times"></i></button>
        </div>
        <div class="image-input">
            <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg">
            <button type="button" class="btn-remove-image"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.querySelector('.preview-container').innerHTML = "";
    openModal(elements.productModal);
}

// Abrir modal para editar producto
function openEditProductModal(productId) {
    // Verificar que el usuario esté habilitado
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
    document.getElementById('modal-title').textContent = "Editar Producto";
    
    // Configurar inputs de imagen
    const imageContainer = document.querySelector('.image-inputs');
    imageContainer.innerHTML = "";
    
    if (product.images && product.images.length > 0) {
        product.images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'image-input';
            div.innerHTML = `
                <input type="text" class="existing-image" value="${img}" readonly>
                <span class="image-label">Imagen ${index + 1}</span>
                <button type="button" class="btn-remove-image"><i class="fas fa-times"></i></button>
            `;
            imageContainer.appendChild(div);
        });
    }
    
    // Agregar inputs para nuevas imágenes
    const newInputs = 2;
    for (let i = 0; i < newInputs; i++) {
        const div = document.createElement('div');
        div.className = 'image-input';
        div.innerHTML = `
            <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg">
            <button type="button" class="btn-remove-image"><i class="fas fa-times"></i></button>
        `;
        imageContainer.appendChild(div);
    }
    
    // Actualizar vista previa
    const previewContainer = document.querySelector('.preview-container');
    previewContainer.innerHTML = "";
    
    if (product.images) {
        product.images.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.className = 'preview-image';
            imgElement.src = img;
            previewContainer.appendChild(imgElement);
        });
    }
    
    openModal(elements.productModal);
}

// Agregar input de imagen
function addImageInput() {
    const imageContainer = document.querySelector('.image-inputs');
    const inputs = imageContainer.querySelectorAll('.image-input');
    
    if (inputs.length >= 5) {
        showNotification("Máximo 5 imágenes por producto", "error");
        return;
    }
    
    const div = document.createElement('div');
    div.className = 'image-input';
    div.innerHTML = `
        <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg">
        <button type="button" class="btn-remove-image"><i class="fas fa-times"></i></button>
    `;
    imageContainer.appendChild(div);
}

// Previsualizar imagen
function previewImage(input) {
    const previewContainer = document.querySelector('.preview-container');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.className = 'preview-image';
            imgElement.src = e.target.result;
            previewContainer.appendChild(imgElement);
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Función para abrir modal
function openModal(modal) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Actualizar UI
function updateUI() {
    // Actualizar contador del carrito
    updateCartCount();
    
    // Renderizar productos según el modo
    if (appState.currentUser && appState.userEnabled && appState.storeId === appState.currentUser.uid) {
        renderAdminProducts();
    } else {
        renderCatalogProducts();
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
        return;
    }
    
    container.innerHTML = '';
    
    appState.products.forEach(product => {
        const productCard = createProductCard(product, true);
        container.appendChild(productCard);
    });
}

// Renderizar productos en catálogo
function renderCatalogProducts() {
    const container = elements.catalogProducts;
    
    if (appState.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Catálogo vacío</h3>
                <p>No hay productos disponibles en este momento</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    appState.products.forEach(product => {
        const productCard = createProductCard(product, false);
        container.appendChild(productCard);
    });
}

// Crear tarjeta de producto
function createProductCard(product, isAdmin) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    
    // Verificar si está en el carrito
    const cartItem = appState.cart.find(item => item.productId === product.id);
    const inCart = cartItem ? true : false;
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    
    // Imagen principal
    const mainImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
    
    let actionsHTML = '';
    
    if (isAdmin && appState.userEnabled) {
        // Acciones para administrador (solo si está habilitado)
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
        // Mensaje para administrador no habilitado
        actionsHTML = `
            <div class="product-actions">
                <p style="color: #dc3545; font-size: 0.9rem; margin: 10px 0;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Tu cuenta no está activada. No puedes editar productos.
                </p>
            </div>
        `;
    } else {
        // Acciones para cliente
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
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${mainImage}" alt="${product.name}" class="product-image" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'">
        </div>
        
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price.toFixed(2)}</div>
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
    showNotification(`${product.name} agregado al carrito`, "success");
}

function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.productId !== productId);
    saveCartToLocalStorage();
    updateUI();
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
    }
}

function clearCart() {
    if (appState.cart.length === 0) return;
    
    if (confirm("¿Vaciar todo el carrito?")) {
        appState.cart = [];
        saveCartToLocalStorage();
        updateUI();
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
        // Si el usuario es el propietario y está habilitado, abrir configuración
        if (appState.currentUser && appState.userEnabled && appState.storeId === appState.currentUser.uid) {
            openConfigModal();
        }
        return;
    }
    
    // Generar mensaje
    let message = `Hola, quiero hacer un pedido de ${appState.currentStore.storeName}:\n\n`;
    
    appState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.name} (x${item.quantity}): $${item.price.toFixed(2)} c/u = $${itemTotal.toFixed(2)}\n`;
    });
    
    const total = calculateCartTotal();
    message += `\n*Total: $${total.toFixed(2)}*`;
    message += `\n\nPedido generado desde Catálogo Digital`;
    
    // Codificar para URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${appState.currentStore.whatsappNumber}?text=${encodedMessage}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    // Opcional: vaciar carrito después
    setTimeout(() => {
        if (confirm("¿Deseas vaciar el carrito después de enviar el pedido?")) {
            clearCart();
        }
    }, 500);
}

// Mostrar notificación
function showNotification(message, type = "success") {
    // Eliminar notificación anterior
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Eliminar después de 3 segundos
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