// ========== FUNCIÓN SETUPFIREBASEAUTH CORREGIDA ==========
function setupFirebaseAuth() {
    const { auth, onAuthStateChanged } = window.firebaseServices;
    
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(auth, async (user) => {
        console.log("🔥 Firebase Auth State Changed:", user ? `Usuario: ${user.uid}` : "No autenticado");
        
        if (user) {
            // Usuario autenticado
            appState.currentUser = user;
            console.log("✅ Usuario autenticado:", user.email, "UID:", user.uid);
            
            // Después de autenticar, verificar parámetros de URL
            await checkURLParams();
            
            updateAuthUI();
        } else {
            // Usuario no autenticado
            console.log("❌ Usuario no autenticado");
            appState.currentUser = null;
            appState.currentStore = null;
            appState.isAdmin = false;
            
            checkURLParams();
            updateAuthUI();
        }
    });
}

// ========== FUNCIÓN CHECKURLPARAMS CORREGIDA ==========
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    
    console.log("🔗 URL Params - storeId:", storeId, "Current User UID:", appState.currentUser?.uid);
    
    if (storeId && appState.currentUser && storeId === appState.currentUser.uid) {
        // 📌 ESCENARIO 1: Usuario viendo SU PROPIA tienda → MODO ADMIN
        console.log("🎯 MODO ADMIN - El dueño está viendo su propia tienda");
        appState.isAdmin = true;
        appState.storeId = storeId;
        loadUserStore(storeId);
    } else if (storeId) {
        // 📌 ESCENARIO 2: Cliente viendo tienda de otro → MODO CLIENTE
        console.log("👤 MODO CLIENTE - Visitante viendo tienda ajena");
        appState.isAdmin = false;
        appState.storeId = storeId;
        loadStoreForCustomer(storeId);
    } else if (appState.currentUser) {
        // 📌 ESCENARIO 3: Usuario logueado pero sin parámetro store → REDIRIGIR a su tienda
        console.log("🔄 Redirigiendo usuario a su tienda");
        window.location.href = `/?store=${appState.currentUser.uid}`;
        return;
    } else {
        // 📌 ESCENARIO 4: Visitante sin autenticar y sin store → MOSTRAR LANDING
        console.log("🚶 Visitante sin autenticar");
        elements.catalogDescription.textContent = "Inicia sesión para administrar tu tienda o visita un catálogo";
        showVisitorLanding();
    }
}

// ========== NUEVA FUNCIÓN: MOSTRAR LANDING PARA VISITANTES ==========
function showVisitorLanding() {
    // Ocultar catálogo vacío y mostrar mensaje de bienvenida
    elements.catalogProducts.innerHTML = `
        <div class="landing-container">
            <div class="landing-content">
                <h2><i class="fas fa-store"></i> Catálogo Digital</h2>
                <p class="landing-subtitle">Crea tu tienda online gratuita en minutos</p>
                
                <div class="landing-features">
                    <div class="feature">
                        <i class="fas fa-mobile-alt"></i>
                        <h3>Vende por WhatsApp</h3>
                        <p>Recibe pedidos directamente en tu WhatsApp</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-images"></i>
                        <h3>Sube tus productos</h3>
                        <p>Agrega fotos, precios y descripciones</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-share-alt"></i>
                        <h3>Comparte tu enlace</h3>
                        <p>Un enlace único para tu catálogo</p>
                    </div>
                </div>
                
                <div class="landing-actions">
                    <button id="landing-login" class="btn btn-primary btn-large">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <p class="landing-note">¿No tienes cuenta? Se registra automáticamente al iniciar sesión</p>
                </div>
            </div>
        </div>
    `;
    
    // Agregar event listener al botón de login
    document.getElementById('landing-login')?.addEventListener('click', openAuthModal);
}

// ========== FUNCIÓN LOADUSERSTORE CORREGIDA ==========
async function loadUserStore(storeId) {
    console.log("📦 Cargando tienda del usuario, storeId:", storeId);
    
    try {
        const { db, doc, getDoc } = window.firebaseServices;
        
        const storeRef = doc(db, "stores", storeId);
        const storeSnap = await getDoc(storeRef);
        
        if (storeSnap.exists()) {
            appState.currentStore = storeSnap.data();
            console.log("✅ Tienda cargada:", appState.currentStore);
            
            // Actualizar UI
            elements.storeName.textContent = appState.currentStore.storeName || "Mi Tienda";
            elements.storeIdDisplay.textContent = storeId;
            
            // ✅ MOSTRAR PANEL DE ADMINISTRACIÓN (IMPORTANTE)
            elements.adminPanel.classList.remove('hidden');
            elements.catalogPanel.classList.add('hidden');
            elements.configBtn.classList.remove('hidden');
            elements.myStoreBtn.classList.remove('hidden');
            elements.authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
            elements.authBtn.onclick = handleLogout;
            
            // Cargar productos
            await loadStoreProducts(storeId);
            
        } else {
            console.log("⚠️ Tienda no existe, creando...");
            // Crear tienda si no existe
            await createStoreForUser(storeId);
        }
    } catch (error) {
        console.error("❌ Error cargando tienda:", error);
        showNotification("Error cargando tienda", "error");
    }
}

// ========== FUNCIÓN HANDLEREGISTER CORREGIDA ==========
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
        const { auth, createUserWithEmailAndPassword, db, doc, setDoc, serverTimestamp } = window.firebaseServices;
        
        console.log("📝 Registrando usuario...");
        
        // 1. Crear usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Usuario creado:", user.uid);
        
        // 2. Crear tienda
        const storeData = {
            storeName: storeName,
            ownerId: user.uid,
            ownerEmail: email,
            whatsappNumber: whatsapp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        console.log("📦 Creando tienda...");
        await setDoc(doc(db, "stores", user.uid), storeData);
        console.log("✅ Tienda creada para usuario:", user.uid);
        
        // 3. Cerrar modal y redirigir
        closeAllModals();
        showNotification("¡Cuenta creada exitosamente!", "success");
        
        // 4. ✅ REDIRIGIR A SU TIENDA EN MODO ADMIN
        console.log("🔄 Redirigiendo a: /?store=" + user.uid);
        window.location.href = `/?store=${user.uid}`;
        
    } catch (error) {
        console.error("❌ Error de registro:", error);
        
        let errorMessage = "Error al crear la cuenta";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo ya está registrado";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Correo electrónico inválido";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña es demasiado débil";
        }
        
        showAuthError(errorMessage);
    }
}

// ========== AGREGAR CSS PARA EL LANDING ==========
function addLandingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .landing-container {
            text-align: center;
            padding: 40px 20px;
            grid-column: 1 / -1;
        }
        
        .landing-content {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .landing-content h2 {
            color: var(--secondary-color);
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .landing-subtitle {
            font-size: 1.2rem;
            color: var(--gray-color);
            margin-bottom: 40px;
        }
        
        .landing-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .feature {
            background: white;
            padding: 30px;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            transition: var(--transition);
        }
        
        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .feature i {
            font-size: 2.5rem;
            color: var(--primary-color);
            margin-bottom: 15px;
        }
        
        .feature h3 {
            color: var(--secondary-color);
            margin-bottom: 10px;
        }
        
        .feature p {
            color: var(--gray-color);
        }
        
        .landing-actions {
            margin-top: 40px;
        }
        
        .btn-large {
            padding: 15px 30px;
            font-size: 1.1rem;
        }
        
        .landing-note {
            margin-top: 15px;
            color: var(--gray-color);
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .landing-content h2 {
                font-size: 2rem;
            }
            
            .landing-features {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========== MODIFICAR INICIALIZACIÓN ==========
async function initApp() {
    console.log("🚀 Iniciando aplicación...");
    
    // Agregar estilos para landing
    addLandingStyles();
    
    // Establecer año actual
    elements.currentYear.textContent = new Date().getFullYear();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar carrito desde localStorage
    loadCartFromLocalStorage();
    
    // Configurar autenticación de Firebase
    setupFirebaseAuth();
    
    console.log("✅ Aplicación inicializada");
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);