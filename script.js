// script.js CORREGIDO
// Aplicación web de inventario y catálogo con WhatsApp
// Autor: Desarrollador Frontend Senior
// Descripción: Aplicación web sin backend para gestión de inventario y catálogo con integración a WhatsApp

// ============================================
// VARIABLES GLOBALES Y CONFIGURACIÓN INICIAL
// ============================================

// Estado de la aplicación
let appState = {
    isAdminMode: false,
    currentStoreId: 'default',
    products: [],
    cart: [],
    config: {
        whatsappNumber: '51912345678',
        storeName: 'Mi Tienda Online',
        storeId: 'default'
    }
};

// Elementos DOM principales
const elements = {
    // Botones y controles
    modeToggle: document.getElementById('mode-toggle'),
    viewCart: document.getElementById('view-cart'),
    configBtn: document.getElementById('config-btn'),
    addProduct: document.getElementById('add-product'),
    clearAllProducts: document.getElementById('clear-all-products'),
    saveConfig: document.getElementById('save-config'),
    clearCart: document.getElementById('clear-cart'),
    checkoutWhatsapp: document.getElementById('checkout-whatsapp'),
    shareLink: document.getElementById('share-link'),
    
    // Modales
    configModal: document.getElementById('config-modal'),
    productModal: document.getElementById('product-modal'),
    cartModal: document.getElementById('cart-modal'),
    
    // Contenedores de contenido
    adminPanel: document.getElementById('admin-panel'),
    catalogPanel: document.getElementById('catalog-panel'),
    productsList: document.getElementById('products-list'),
    catalogProducts: document.getElementById('catalog-products'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    
    // Elementos de información
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    storeName: document.getElementById('store-name'),
    storeLink: document.getElementById('store-link'),
    
    // Formularios
    productForm: document.getElementById('product-form'),
    productId: document.getElementById('product-id'),
    productName: document.getElementById('product-name'),
    productPrice: document.getElementById('product-price'),
    productDescription: document.getElementById('product-description'),
    whatsappNumber: document.getElementById('whatsapp-number'),
    storeDisplayName: document.getElementById('store-display-name'),
    storeIdInput: document.getElementById('store-id'),
    
    // Año actual para el footer
    currentYear: document.getElementById('current-year')
};

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

/**
 * Inicializa la aplicación cargando datos y configurando eventos
 */
function initApp() {
    console.log('Iniciando aplicación...');
    
    // Establecer año actual en el footer
    elements.currentYear.textContent = new Date().getFullYear();
    
    // Cargar parámetros de la URL
    loadURLParams();
    
    // Cargar datos del localStorage
    loadFromLocalStorage();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar la interfaz
    updateUI();
    
    // Generar enlace único de la tienda
    updateStoreLink();
    
    console.log('Aplicación inicializada correctamente');
    console.log('Productos cargados:', appState.products.length);
    console.log('Carrito:', appState.cart.length, 'items');
}

/**
 * Carga los parámetros de la URL para identificar la tienda
 */
function loadURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    
    if (storeParam) {
        appState.currentStoreId = storeParam;
        console.log(`Tienda cargada desde URL: ${storeParam}`);
    }
    
    // Verificar si estamos en modo admin
    const modeParam = urlParams.get('mode');
    if (modeParam === 'admin') {
        appState.isAdminMode = true;
        console.log('Modo admin activado desde URL');
    }
}

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botones de cambio de modo
    elements.modeToggle.addEventListener('click', toggleAdminMode);
    elements.viewCart.addEventListener('click', () => {
        console.log('Abrir carrito');
        openModal(elements.cartModal);
        updateCartUI();
    });
    elements.configBtn.addEventListener('click', () => {
        console.log('Abrir configuración');
        openModal(elements.configModal);
    });
    
    // Botones de administración
    elements.addProduct.addEventListener('click', () => {
        console.log('Agregar producto');
        openAddProductModal();
    });
    elements.clearAllProducts.addEventListener('click', confirmClearAllProducts);
    elements.saveConfig.addEventListener('click', saveConfig);
    
    // Botones del carrito
    elements.clearCart.addEventListener('click', clearCart);
    elements.checkoutWhatsapp.addEventListener('click', checkoutViaWhatsApp);
    elements.shareLink.addEventListener('click', shareStoreLink);
    
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
    
    // Formulario de producto
    elements.productForm.addEventListener('submit', handleProductFormSubmit);
    
    // Gestión de imágenes en el formulario
    document.getElementById('add-image').addEventListener('click', addImageInput);
    
    // Actualizar vista previa cuando se selecciona un archivo
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('image-file')) {
            updateImagePreview();
        }
    });
    
    // Actualizar vista previa cuando se elimina una imagen
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-image')) {
            setTimeout(updateImagePreview, 10);
        }
    });
    
    // Actualizar datos cuando cambian los campos de configuración
    elements.storeIdInput.addEventListener('input', updateStoreLink);
    elements.whatsappNumber.addEventListener('input', validateWhatsAppNumber);
    elements.storeDisplayName.addEventListener('input', (e) => {
        elements.storeName.textContent = e.target.value || 'Nombre de la Tienda';
    });
    
    // Event delegation para botones dinámicos
    document.addEventListener('click', function(e) {
        // Botones de productos en modo admin
        if (e.target.closest('.edit-product')) {
            const productId = e.target.closest('.edit-product').dataset.id;
            console.log('Editar producto:', productId);
            openEditProductModal(productId);
        }
        
        if (e.target.closest('.delete-product')) {
            const productId = e.target.closest('.delete-product').dataset.id;
            console.log('Eliminar producto:', productId);
            deleteProduct(productId);
        }
        
        // Botones de productos en modo cliente
        if (e.target.closest('.add-to-cart')) {
            const productId = e.target.closest('.add-to-cart').dataset.id;
            console.log('Agregar al carrito:', productId);
            addToCart(productId);
        }
        
        if (e.target.closest('.remove-from-cart')) {
            const productId = e.target.closest('.remove-from-cart').dataset.id;
            console.log('Quitar del carrito:', productId);
            removeFromCart(productId);
        }
        
        // Botones de cantidad en el carrito
        if (e.target.closest('.decrease-quantity')) {
            const productId = e.target.closest('.decrease-quantity').dataset.id;
            console.log('Disminuir cantidad:', productId);
            updateCartQuantity(productId, -1);
        }
        
        if (e.target.closest('.increase-quantity')) {
            const productId = e.target.closest('.increase-quantity').dataset.id;
            console.log('Aumentar cantidad:', productId);
            updateCartQuantity(productId, 1);
        }
        
        if (e.target.closest('.cart-item-remove')) {
            const productId = e.target.closest('.cart-item-remove').dataset.id;
            console.log('Eliminar del carrito:', productId);
            removeFromCart(productId);
        }
    });
    
    // Prevenir envío de formulario con Enter en campos no deseados
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.type !== 'textarea' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });
    
    console.log('Event listeners configurados');
}

// ============================================
// GESTIÓN DE DATOS Y LOCALSTORAGE
// ============================================

/**
 * Carga todos los datos desde localStorage
 */
function loadFromLocalStorage() {
    console.log('Cargando desde localStorage...');
    
    // Cargar configuración
    const savedConfig = localStorage.getItem(`store_${appState.currentStoreId}_config`);
    if (savedConfig) {
        try {
            appState.config = JSON.parse(savedConfig);
            console.log('Configuración cargada desde localStorage:', appState.config);
        } catch (e) {
            console.error('Error parsing config:', e);
        }
    }
    
    // Cargar productos
    const savedProducts = localStorage.getItem(`store_${appState.currentStoreId}_products`);
    if (savedProducts) {
        try {
            appState.products = JSON.parse(savedProducts);
            console.log(`${appState.products.length} productos cargados desde localStorage`);
        } catch (e) {
            console.error('Error parsing products:', e);
        }
    }
    
    // Cargar carrito
    const savedCart = localStorage.getItem(`store_${appState.currentStoreId}_cart`);
    if (savedCart) {
        try {
            appState.cart = JSON.parse(savedCart);
            console.log(`Carrito con ${appState.cart.length} items cargado desde localStorage`);
        } catch (e) {
            console.error('Error parsing cart:', e);
        }
    }
    
    // Aplicar configuración a los campos del formulario
    if (elements.whatsappNumber) elements.whatsappNumber.value = appState.config.whatsappNumber;
    if (elements.storeDisplayName) elements.storeDisplayName.value = appState.config.storeName;
    if (elements.storeIdInput) elements.storeIdInput.value = appState.config.storeId;
    if (elements.storeName) elements.storeName.textContent = appState.config.storeName;
}

/**
 * Guarda todos los datos en localStorage
 */
function saveToLocalStorage() {
    console.log('Guardando en localStorage...');
    
    // Guardar configuración
    localStorage.setItem(`store_${appState.currentStoreId}_config`, JSON.stringify(appState.config));
    
    // Guardar productos
    localStorage.setItem(`store_${appState.currentStoreId}_products`, JSON.stringify(appState.products));
    
    // Guardar carrito
    localStorage.setItem(`store_${appState.currentStoreId}_cart`, JSON.stringify(appState.cart));
    
    console.log('Datos guardados en localStorage');
}

/**
 * Guarda la configuración de la aplicación
 */
function saveConfig() {
    console.log('Guardando configuración...');
    
    // Validar número de WhatsApp
    if (!validateWhatsAppNumber()) {
        alert('Por favor ingresa un número de WhatsApp válido (con código de país, sin +)');
        elements.whatsappNumber.focus();
        return;
    }
    
    // Actualizar configuración
    appState.config.whatsappNumber = elements.whatsappNumber.value.trim();
    appState.config.storeName = elements.storeDisplayName.value.trim() || 'Mi Tienda Online';
    appState.config.storeId = elements.storeIdInput.value.trim() || 'default';
    
    // Si cambió el ID de la tienda, necesitamos migrar los datos
    if (appState.config.storeId !== appState.currentStoreId) {
        if (confirm('¿Cambiar el ID de la tienda? Esto creará una nueva tienda sin productos.')) {
            // Actualizar el ID actual
            appState.currentStoreId = appState.config.storeId;
            
            // Cargar datos de la nueva tienda (si existen)
            loadFromLocalStorage();
        } else {
            // Revertir el cambio en el input
            elements.storeIdInput.value = appState.currentStoreId;
            return;
        }
    }
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Actualizar UI
    elements.storeName.textContent = appState.config.storeName;
    updateStoreLink();
    
    // Cerrar modal
    closeAllModals();
    
    // Mostrar confirmación
    showNotification('Configuración guardada correctamente', 'success');
}

/**
 * Valida el número de WhatsApp
 * @returns {boolean} True si el número es válido
 */
function validateWhatsAppNumber() {
    const number = elements.whatsappNumber.value.trim();
    const regex = /^\d{10,15}$/; // Entre 10 y 15 dígitos
    
    if (!regex.test(number)) {
        elements.whatsappNumber.style.borderColor = 'var(--danger-color)';
        return false;
    }
    
    elements.whatsappNumber.style.borderColor = '';
    return true;
}

// ============================================
// GESTIÓN DE PRODUCTOS (CRUD)
// ============================================

/**
 * Abre el modal para agregar un nuevo producto
 */
function openAddProductModal() {
    console.log('Abriendo modal para agregar producto');
    
    // Restablecer formulario
    elements.productForm.reset();
    elements.productId.value = '';
    document.getElementById('modal-title').textContent = 'Agregar Producto';
    
    // Restablecer campos de imágenes (dejar solo 2)
    const imageInputs = document.querySelectorAll('.image-input');
    imageInputs.forEach((input, index) => {
        if (index > 1) {
            input.remove();
        }
    });
    
    // Asegurar que haya exactamente 2 campos iniciales
    const imageContainer = document.querySelector('.image-inputs');
    imageContainer.innerHTML = '';
    
    const input1 = createImageInput(0);
    const input2 = createImageInput(1);
    imageContainer.appendChild(input1);
    imageContainer.appendChild(input2);
    
    // Limpiar vista previa
    document.querySelector('.preview-container').innerHTML = '';
    
    // Abrir modal
    openModal(elements.productModal);
    
    // Enfocar primer campo
    setTimeout(() => {
        elements.productName.focus();
    }, 100);
}

/**
 * Abre el modal para editar un producto existente
 * @param {string} productId - ID del producto a editar
 */
function openEditProductModal(productId) {
    console.log('Abriendo modal para editar producto:', productId);
    
    const product = appState.products.find(p => p.id === productId);
    if (!product) {
        console.error('Producto no encontrado:', productId);
        return;
    }
    
    // Restablecer formulario
    elements.productForm.reset();
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productPrice.value = product.price;
    elements.productDescription.value = product.description || '';
    document.getElementById('modal-title').textContent = 'Editar Producto';
    
    // Restablecer campos de imágenes
    const imageContainer = document.querySelector('.image-inputs');
    imageContainer.innerHTML = '';
    
    if (product.images && product.images.length > 0) {
        product.images.forEach((img, index) => {
            const imageInput = createImageInput(index, img);
            imageContainer.appendChild(imageInput);
        });
    } else {
        // Si no hay imágenes, agregar un campo vacío
        const emptyInput = createImageInput(0);
        imageContainer.appendChild(emptyInput);
    }
    
    // Agregar un campo vacío adicional si hay menos de 5 imágenes
    if (!product.images || product.images.length < 5) {
        const emptyInput = createImageInput(product.images ? product.images.length : 1);
        imageContainer.appendChild(emptyInput);
    }
    
    // Actualizar vista previa
    updateImagePreview();
    
    // Abrir modal
    openModal(elements.productModal);
    
    // Enfocar primer campo
    setTimeout(() => {
        elements.productName.focus();
    }, 100);
}

/**
 * Crea un campo de entrada para archivo de imagen
 * @param {number} index - Índice de la imagen
 * @param {string} existingImage - Imagen existente en Base64 (para edición)
 * @returns {HTMLElement} Elemento del campo de imagen
 */
function createImageInput(index, existingImage = null) {
    const div = document.createElement('div');
    div.className = 'image-input';
    
    const isRequired = index === 0;
    const placeholder = isRequired ? 'Seleccionar imagen 1 *' : `Seleccionar imagen ${index + 1}`;
    
    div.innerHTML = `
        <input type="file" class="image-file" accept="image/jpeg, image/png, image/jpg" 
               ${isRequired ? 'required' : ''}>
        <button type="button" class="btn-remove-image" ${isRequired ? 'disabled' : ''}>
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Si hay una imagen existente (para edición), almacenarla en dataset
    if (existingImage) {
        div.dataset.existingImage = existingImage;
    }
    
    // Configurar evento para eliminar imagen
    const removeBtn = div.querySelector('.btn-remove-image');
    if (!isRequired) {
        removeBtn.addEventListener('click', () => {
            div.remove();
            updateImagePreview();
        });
    }
    
    // Configurar evento para actualizar vista previa
    const fileInput = div.querySelector('.image-file');
    fileInput.addEventListener('change', updateImagePreview);
    
    return div;
}

/**
 * Maneja el envío del formulario de producto
 * @param {Event} e - Evento de envío del formulario
 */
async function handleProductFormSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de producto');
    
    // Obtener datos del formulario
    const productId = elements.productId.value;
    const name = elements.productName.value.trim();
    const price = parseFloat(elements.productPrice.value);
    const description = elements.productDescription.value.trim();
    
    // Validar campos requeridos
    if (!name || !price || price <= 0 || isNaN(price)) {
        alert('Por favor completa los campos obligatorios (nombre y precio válido)');
        return;
    }
    
    // Obtener imágenes (archivos o imágenes existentes)
    const imageInputs = document.querySelectorAll('.image-input');
    const images = [];
    
    for (const inputDiv of imageInputs) {
        const fileInput = inputDiv.querySelector('.image-file');
        const existingImage = inputDiv.dataset.existingImage;
        
        if (existingImage) {
            // Usar imagen existente (para edición)
            images.push(existingImage);
        } else if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validar tipo de archivo
            if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                alert(`La imagen "${file.name}" no es un JPG o PNG válido`);
                return;
            }
            
            // Validar tamaño (2MB máximo)
            if (file.size > 2 * 1024 * 1024) {
                alert(`La imagen "${file.name}" es demasiado grande. Tamaño máximo: 2MB.`);
                return;
            }
            
            // Convertir a Base64
            try {
                const base64Image = await fileToBase64(file);
                images.push(base64Image);
            } catch (error) {
                console.error('Error al convertir imagen:', error);
                alert('Error al procesar la imagen. Intenta con otra.');
                return;
            }
        }
    }
    
    // Validar que haya al menos una imagen
    if (images.length === 0) {
        alert('Debes agregar al menos una imagen para el producto');
        return;
    }
    
    // Validar que no haya más de 5 imágenes
    if (images.length > 5) {
        alert('Máximo 5 imágenes por producto');
        return;
    }
    
    // Crear objeto de producto
    const product = {
        id: productId || Date.now().toString(),
        name,
        price,
        description,
        images
    };
    
    console.log('Producto a guardar:', product);
    
    // Actualizar o agregar producto
    if (productId) {
        // Editar producto existente
        const index = appState.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            appState.products[index] = product;
            console.log('Producto actualizado:', productId);
            showNotification('Producto actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo producto
        appState.products.push(product);
        console.log('Producto agregado:', product.id);
        showNotification('Producto agregado correctamente', 'success');
    }
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Actualizar UI
    updateUI();
    
    // Cerrar modal
    closeAllModals();
}

/**
 * Elimina un producto
 * @param {string} productId - ID del producto a eliminar
 */
function deleteProduct(productId) {
    console.log('Eliminando producto:', productId);
    
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }
    
    // Eliminar producto de la lista
    appState.products = appState.products.filter(p => p.id !== productId);
    
    // Eliminar producto del carrito si está allí
    appState.cart = appState.cart.filter(item => item.productId !== productId);
    
    // Guardar cambios
    saveToLocalStorage();
    
    // Actualizar UI
    updateUI();
    
    showNotification('Producto eliminado correctamente', 'success');
}

/**
 * Confirma la eliminación de todos los productos
 */
function confirmClearAllProducts() {
    console.log('Confirmando eliminación de todos los productos');
    
    if (appState.products.length === 0) {
        alert('No hay productos para eliminar');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los productos? Esta acción no se puede deshacer.')) {
        clearAllProducts();
    }
}

/**
 * Elimina todos los productos
 */
function clearAllProducts() {
    console.log('Eliminando todos los productos');
    
    appState.products = [];
    appState.cart = []; // También vaciar el carrito
    
    // Guardar cambios
    saveToLocalStorage();
    
    // Actualizar UI
    updateUI();
    
    showNotification('Todos los productos han sido eliminados', 'warning');
}

// ============================================
// GESTIÓN DEL CARRITO
// ============================================

/**
 * Agrega un producto al carrito
 * @param {string} productId - ID del producto a agregar
 */
function addToCart(productId) {
    console.log('Agregando al carrito:', productId);
    
    const product = appState.products.find(p => p.id === productId);
    if (!product) {
        console.error('Producto no encontrado:', productId);
        return;
    }
    
    // Verificar si el producto ya está en el carrito
    const existingItem = appState.cart.find(item => item.productId === productId);
    
    if (existingItem) {
        // Incrementar cantidad
        existingItem.quantity += 1;
    } else {
        // Agregar nuevo item al carrito
        appState.cart.push({
            productId,
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/100x100?text=Imagen',
            quantity: 1
        });
    }
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Actualizar UI
    updateUI();
    
    // Mostrar confirmación
    showNotification(`${product.name} agregado al carrito`, 'success');
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * @param {string} productId - ID del producto
 * @param {number} change - Cambio en la cantidad (+1 o -1)
 */
function updateCartQuantity(productId, change) {
    console.log('Actualizando cantidad:', productId, change);
    
    const item = appState.cart.find(item => item.productId === productId);
    if (!item) return;
    
    // Calcular nueva cantidad
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        // Eliminar producto si la cantidad es 0
        removeFromCart(productId);
    } else {
        // Actualizar cantidad
        item.quantity = newQuantity;
        
        // Guardar en localStorage
        saveToLocalStorage();
        
        // Actualizar UI del carrito
        updateCartUI();
        updateCartCount();
    }
}

/**
 * Elimina un producto del carrito
 * @param {string} productId - ID del producto a eliminar
 */
function removeFromCart(productId) {
    console.log('Eliminando del carrito:', productId);
    
    appState.cart = appState.cart.filter(item => item.productId !== productId);
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Actualizar UI
    updateUI();
    
    showNotification('Producto eliminado del carrito', 'info');
}

/**
 * Vacía todo el carrito
 */
function clearCart() {
    console.log('Vaciando carrito');
    
    if (appState.cart.length === 0) {
        alert('El carrito ya está vacío');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        appState.cart = [];
        
        // Guardar en localStorage
        saveToLocalStorage();
        
        // Actualizar UI
        updateUI();
        
        showNotification('Carrito vaciado correctamente', 'info');
    }
}

/**
 * Calcula el total del carrito
 * @returns {number} Total del carrito
 */
function calculateCartTotal() {
    return appState.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// ============================================
// INTEGRACIÓN CON WHATSAPP
// ============================================

/**
 * Realiza el checkout enviando el pedido por WhatsApp
 */
function checkoutViaWhatsApp() {
    console.log('Checkout por WhatsApp');
    
    if (appState.cart.length === 0) {
        alert('El carrito está vacío. Agrega productos antes de comprar.');
        return;
    }
    
    // Validar que haya un número de WhatsApp configurado
    if (!appState.config.whatsappNumber || appState.config.whatsappNumber.length < 10) {
        alert('Por favor configura un número de WhatsApp válido en la sección de configuración');
        openModal(elements.configModal);
        return;
    }
    
    // Generar mensaje de pedido
    const message = generateOrderMessage();
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${appState.config.whatsappNumber}?text=${encodedMessage}`;
    
    // Abrir en una nueva ventana
    window.open(whatsappUrl, '_blank');
    
    // Cerrar modal del carrito
    closeAllModals();
    
    // Opcional: vaciar carrito después del envío
    if (confirm('¿Deseas vaciar el carrito después de enviar el pedido?')) {
        clearCart();
    }
}

/**
 * Genera el mensaje del pedido para WhatsApp
 * @returns {string} Mensaje formateado
 */
function generateOrderMessage() {
    let message = `Hola, quiero hacer un pedido:\n\n`;
    
    // Agregar productos
    appState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.name} (x${item.quantity}): $${item.price.toFixed(2)} c/u -> $${itemTotal.toFixed(2)}\n`;
    });
    
    // Agregar total
    const total = calculateCartTotal();
    message += `\n*Total: $${total.toFixed(2)}*`;
    
    // Agregar información de la tienda
    message += `\n\nPedido de: ${appState.config.storeName}`;
    
    return message;
}

// ============================================
// INTERFAZ DE USUARIO Y VISTAS
// ============================================

/**
 * Actualiza toda la interfaz de usuario
 */
function updateUI() {
    console.log('Actualizando UI...');
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Actualizar vista según el modo
    if (appState.isAdminMode) {
        showAdminPanel();
        renderProductsList();
    } else {
        showCatalogPanel();
        renderCatalog();
    }
    
    console.log('UI actualizada');
}

/**
 * Cambia entre modo admin y modo cliente
 */
function toggleAdminMode() {
    console.log('Cambiando modo admin:', !appState.isAdminMode);
    
    appState.isAdminMode = !appState.isAdminMode;
    
    // Actualizar texto del botón
    elements.modeToggle.innerHTML = appState.isAdminMode 
        ? '<i class="fas fa-store"></i> Ver Catálogo' 
        : '<i class="fas fa-user-shield"></i> Modo Admin';
    
    // Actualizar UI
    updateUI();
}

/**
 * Muestra el panel de administración
 */
function showAdminPanel() {
    console.log('Mostrando panel admin');
    elements.adminPanel.classList.remove('hidden');
    elements.catalogPanel.classList.add('hidden');
}

/**
 * Muestra el catálogo para clientes
 */
function showCatalogPanel() {
    console.log('Mostrando catálogo');
    elements.adminPanel.classList.add('hidden');
    elements.catalogPanel.classList.remove('hidden');
}

/**
 * Actualiza el contador del carrito
 */
function updateCartCount() {
    const totalItems = appState.cart.reduce((total, item) => total + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    console.log('Contador carrito actualizado:', totalItems);
}

/**
 * Renderiza la lista de productos en el panel de administración
 */
function renderProductsList() {
    console.log('Renderizando lista de productos admin');
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

/**
 * Renderiza el catálogo para clientes
 */
function renderCatalog() {
    console.log('Renderizando catálogo cliente');
    const container = elements.catalogProducts;
    
    if (appState.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Catálogo vacío</h3>
                <p>El administrador aún no ha agregado productos</p>
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

/**
 * Crea una tarjeta de producto
 * @param {Object} product - Objeto del producto
 * @param {boolean} isAdmin - Si es para vista de administración
 * @returns {HTMLElement} Elemento de tarjeta de producto
 */
function createProductCard(product, isAdmin) {
    console.log('Creando tarjeta para producto:', product.id, 'admin:', isAdmin);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    
    // Verificar si el producto está en el carrito
    const cartItem = appState.cart.find(item => item.productId === product.id);
    const inCart = cartItem ? true : false;
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    
    // Crear contenido de la tarjeta
    let actionsHTML = '';
    
    if (isAdmin) {
        // Acciones para administrador
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
    
    const firstImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${firstImage}" alt="${product.name}" class="product-image" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'">
            
            ${product.images && product.images.length > 1 ? `
                <button class="image-nav prev" data-id="${product.id}"><i class="fas fa-chevron-left"></i></button>
                <button class="image-nav next" data-id="${product.id}"><i class="fas fa-chevron-right"></i></button>
                <div class="image-counter">1 / ${product.images.length}</div>
            ` : ''}
        </div>
        
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
            <p class="product-description">${product.description || 'Sin descripción'}</p>
            ${actionsHTML}
        </div>
    `;
    
    // Configurar eventos para la galería de imágenes (si hay más de una)
    if (product.images && product.images.length > 1) {
        setupImageGallery(card, product);
    }
    
    return card;
}

/**
 * Configura la galería de imágenes para un producto
 * @param {HTMLElement} card - Elemento de la tarjeta del producto
 * @param {Object} product - Objeto del producto
 */
function setupImageGallery(card, product) {
    const imageElement = card.querySelector('.product-image');
    const prevBtn = card.querySelector('.image-nav.prev');
    const nextBtn = card.querySelector('.image-nav.next');
    const counter = card.querySelector('.image-counter');
    
    let currentImageIndex = 0;
    
    function updateImage() {
        if (product.images && product.images[currentImageIndex]) {
            imageElement.src = product.images[currentImageIndex];
            counter.textContent = `${currentImageIndex + 1} / ${product.images.length}`;
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
            updateImage();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % product.images.length;
            updateImage();
        });
    }
}

/**
 * Actualiza la interfaz del carrito
 */
function updateCartUI() {
    console.log('Actualizando UI del carrito');
    const container = elements.cartItemsContainer;
    const emptyState = document.getElementById('cart-empty');
    const summary = document.getElementById('cart-summary');
    
    if (appState.cart.length === 0) {
        emptyState.classList.remove('hidden');
        container.innerHTML = '';
        summary.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    summary.classList.remove('hidden');
    
    container.innerHTML = '';
    
    appState.cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.dataset.id = item.productId;
        
        cartItem.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/100x100?text=Imagen'}" 
                 alt="${item.name}" class="cart-item-image" 
                 onerror="this.src='https://via.placeholder.com/100x100?text=Imagen'}">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price ? item.price.toFixed(2) : '0.00'} c/u</div>
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
    
    // Actualizar total
    const total = calculateCartTotal();
    elements.cartTotal.textContent = `$${total.toFixed(2)}`;
}

// ============================================
// GESTIÓN DE MODALES
// ============================================

/**
 * Abre un modal
 * @param {HTMLElement} modal - Elemento del modal a abrir
 */
function openModal(modal) {
    console.log('Abriendo modal');
    
    // Cerrar cualquier modal abierto
    closeAllModals();
    
    // Abrir el modal solicitado
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra todos los modales
 */
function closeAllModals() {
    console.log('Cerrando todos los modales');
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    document.body.style.overflow = '';
}

// ============================================
// FUNCIONALIDADES ADICIONALES
// ============================================

/**
 * Agrega un campo de entrada para imagen adicional
 */
function addImageInput() {
    console.log('Agregando campo de imagen');
    
    const imageContainer = document.querySelector('.image-inputs');
    const imageInputs = imageContainer.querySelectorAll('.image-input');
    
    // Verificar que no haya más de 5 imágenes
    if (imageInputs.length >= 5) {
        alert('Máximo 5 imágenes por producto');
        return;
    }
    
    // Crear nuevo campo
    const newIndex = imageInputs.length;
    const newInput = createImageInput(newIndex);
    imageContainer.appendChild(newInput);
}

/**
 * Actualiza la vista previa de imágenes
 */
async function updateImagePreview() {
    console.log('Actualizando vista previa de imágenes');
    
    const previewContainer = document.querySelector('.preview-container');
    previewContainer.innerHTML = '';
    
    // Obtener todas las entradas de imagen
    const imageInputs = document.querySelectorAll('.image-input');
    
    for (const inputDiv of imageInputs) {
        const fileInput = inputDiv.querySelector('.image-file');
        const existingImage = inputDiv.dataset.existingImage;
        
        if (existingImage) {
            // Mostrar imagen existente (para edición)
            const img = document.createElement('img');
            img.className = 'preview-image';
            img.src = existingImage;
            img.alt = 'Imagen existente';
            previewContainer.appendChild(img);
        } else if (fileInput.files.length > 0) {
            // Mostrar vista previa de nuevo archivo
            const file = fileInput.files[0];
            
            // Validar tamaño (2MB máximo)
            if (file.size > 2 * 1024 * 1024) {
                alert(`La imagen "${file.name}" es demasiado grande. Tamaño máximo: 2MB.`);
                fileInput.value = '';
                continue;
            }
            
            // Crear elemento de vista previa
            const img = document.createElement('img');
            img.className = 'preview-image loading';
            img.alt = 'Vista previa';
            previewContainer.appendChild(img);
            
            // Leer archivo como Data URL (Base64)
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                img.classList.remove('loading');
            };
            reader.readAsDataURL(file);
        }
    }
}

/**
 * Actualiza el enlace único de la tienda
 */
function updateStoreLink() {
    const storeId = elements.storeIdInput.value.trim() || 'default';
    const currentUrl = window.location.origin + window.location.pathname;
    const storeUrl = `${currentUrl}?store=${storeId}`;
    
    elements.storeLink.textContent = storeUrl;
}

/**
 * Comparte el enlace único de la tienda
 */
function shareStoreLink(e) {
    e.preventDefault();
    
    const storeId = appState.config.storeId || 'default';
    const currentUrl = window.location.origin + window.location.pathname;
    const storeUrl = `${currentUrl}?store=${storeId}`;
    
    // Usar la Web Share API si está disponible
    if (navigator.share) {
        navigator.share({
            title: 'Mi Catálogo Digital',
            text: 'Visita mi catálogo digital en línea',
            url: storeUrl
        });
    } else {
        // Copiar al portapapeles como fallback
        navigator.clipboard.writeText(storeUrl).then(() => {
            showNotification('Enlace copiado al portapapeles', 'success');
        });
    }
}

/**
 * Convierte un archivo a Base64
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} Promesa con la imagen en Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    console.log('Mostrando notificación:', message, type);
    
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Icono según tipo
    let icon = 'info-circle';
    let color = 'var(--accent-color)';
    
    switch(type) {
        case 'success':
            icon = 'check-circle';
            color = 'var(--success-color)';
            break;
        case 'error':
            icon = 'exclamation-circle';
            color = 'var(--danger-color)';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            color = 'var(--warning-color)';
            break;
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    
    // Agregar al documento
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

// ============================================
// INICIALIZACIÓN Y ESTILOS DINÁMICOS
// ============================================

// Agregar estilos para animaciones de notificación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', initApp);

// Cargar productos de ejemplo si no hay ninguno
setTimeout(() => {
    if (appState.products.length === 0 && appState.currentStoreId === 'default') {
        console.log('Cargando productos de ejemplo...');
        
        // Usar imágenes de ejemplo de placeholder (puedes reemplazar con tus propias imágenes en Base64)
        // O usar URLs de ejemplo que siempre funcionan
        const exampleProducts = [
            {
                id: '1',
                name: 'Camiseta Premium',
                price: 25.99,
                description: 'Camiseta de algodón 100% de alta calidad',
                images: [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=300&fit=crop'
                ]
            },
            {
                id: '2',
                name: 'Zapatos Deportivos',
                price: 59.99,
                description: 'Zapatos cómodos para running y ejercicio',
                images: [
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'
                ]
            },
            {
                id: '3',
                name: 'Audífonos Inalámbricos',
                price: 89.99,
                description: 'Audífonos con cancelación de ruido y 20h de batería',
                images: [
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop'
                ]
            }
        ];
        
        appState.products = exampleProducts;
        saveToLocalStorage();
        updateUI();
        
        console.log('Productos de ejemplo cargados para demostración');
    }
}, 1000);