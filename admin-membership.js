// admin-membership.js - Panel de administración de membresías

// Referencias a elementos DOM
const adminElements = {
    membershipModal: document.getElementById('membership-modal'),
    usersList: document.getElementById('users-list'),
    userSearch: document.getElementById('user-search'),
    userDetails: document.getElementById('user-details'),
    membershipPlans: document.getElementById('membership-plans'),
    updateMembershipBtn: document.getElementById('update-membership'),
    revokeAccessBtn: document.getElementById('revoke-access')
};

// Inicializar panel de membresías
function initMembershipAdmin() {
    console.log("Inicializando panel de membresías...");
    
    // Solo si el usuario es admin
    if (appState.currentUser && appState.isAdmin) {
        setupMembershipEventListeners();
        loadUsersList();
        loadMembershipPlans();
    }
}

// Cargar lista de usuarios
async function loadUsersList() {
    try {
        const { db, collection, getDocs } = window.firebaseServices;
        
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderUsersList(users);
    } catch (error) {
        console.error("Error cargando usuarios:", error);
        showNotification("Error cargando usuarios", "error");
    }
}

// Renderizar lista de usuarios
function renderUsersList(users) {
    const container = adminElements.usersList;
    
    if (users.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay usuarios registrados</div>';
        return;
    }
    
    container.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-info">
                <h4>${user.email || 'Sin email'}</h4>
                <div class="user-meta">
                    <span class="badge ${user.membership?.status || 'inactive'}">
                        ${user.membership?.status || 'inactive'}
                    </span>
                    <span>Plan: ${user.membership?.plan || 'free'}</span>
                </div>
            </div>
            <button class="btn btn-secondary btn-small view-user" data-id="${user.id}">
                <i class="fas fa-eye"></i> Ver
            </button>
        `;
        
        container.appendChild(userCard);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.view-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.closest('.view-user').dataset.id;
            loadUserDetails(userId);
        });
    });
}

// Cargar detalles de usuario
async function loadUserDetails(userId) {
    try {
        const { db, doc, getDoc } = window.firebaseServices;
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const user = userSnap.data();
            renderUserDetails(userId, user);
            adminElements.userDetails.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error cargando detalles de usuario:", error);
    }
}

// Renderizar detalles de usuario
function renderUserDetails(userId, user) {
    const container = adminElements.userDetails;
    
    const endDate = user.membership?.endDate 
        ? new Date(user.membership.endDate.seconds * 1000).toLocaleDateString()
        : 'No definida';
    
    container.innerHTML = `
        <div class="user-detail-header">
            <h3>${user.email}</h3>
            <button class="btn-close-details">&times;</button>
        </div>
        
        <div class="user-detail-body">
            <div class="detail-group">
                <label>ID de usuario:</label>
                <span>${userId}</span>
            </div>
            
            <div class="detail-group">
                <label>Estado de membresía:</label>
                <select id="membership-status" class="form-select">
                    <option value="active" ${user.membership?.status === 'active' ? 'selected' : ''}>Activa</option>
                    <option value="inactive" ${!user.membership?.status || user.membership?.status === 'inactive' ? 'selected' : ''}>Inactiva</option>
                    <option value="expired" ${user.membership?.status === 'expired' ? 'selected' : ''}>Expirada</option>
                    <option value="cancelled" ${user.membership?.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                </select>
            </div>
            
            <div class="detail-group">
                <label>Plan:</label>
                <select id="membership-plan" class="form-select">
                    <option value="free" ${user.membership?.plan === 'free' ? 'selected' : ''}>Gratuito</option>
                    <option value="basic" ${user.membership?.plan === 'basic' ? 'selected' : ''}>Básico ($9.99/mes)</option>
                    <option value="premium" ${user.membership?.plan === 'premium' ? 'selected' : ''}>Premium ($19.99/mes)</option>
                    <option value="enterprise" ${user.membership?.plan === 'enterprise' ? 'selected' : ''}>Empresarial ($49.99/mes)</option>
                </select>
            </div>
            
            <div class="detail-group">
                <label>Fecha de expiración:</label>
                <input type="date" id="membership-end-date" value="${endDate !== 'No definida' ? endDate.split('/').reverse().join('-') : ''}">
            </div>
            
            <div class="detail-group">
                <label>Productos máximos:</label>
                <input type="number" id="max-products" value="${user.membership?.maxProducts || 10}" min="1">
            </div>
            
            <div class="detail-group">
                <label>
                    <input type="checkbox" id="can-upload-images" ${user.membership?.canUploadImages ? 'checked' : ''}>
                    Puede subir imágenes
                </label>
            </div>
            
            <div class="user-actions">
                <button id="save-membership" class="btn btn-primary" data-userid="${userId}">
                    <i class="fas fa-save"></i> Guardar cambios
                </button>
                <button id="revoke-access" class="btn btn-danger" data-userid="${userId}">
                    <i class="fas fa-ban"></i> Revocar acceso
                </button>
            </div>
        </div>
    `;
    
    // Event listeners para detalles
    document.querySelector('.btn-close-details').addEventListener('click', () => {
        adminElements.userDetails.classList.add('hidden');
    });
    
    document.getElementById('save-membership').addEventListener('click', () => {
        updateUserMembership(userId);
    });
    
    document.getElementById('revoke-access').addEventListener('click', () => {
        revokeUserAccess(userId);
    });
}

// Actualizar membresía de usuario
async function updateUserMembership(userId) {
    try {
        const status = document.getElementById('membership-status').value;
        const plan = document.getElementById('membership-plan').value;
        const endDate = document.getElementById('membership-end-date').value;
        const maxProducts = parseInt(document.getElementById('max-products').value);
        const canUploadImages = document.getElementById('can-upload-images').checked;
        
        // Definir características según el plan
        const planFeatures = {
            free: {
                maxProducts: 5,
                canUploadImages: false,
                features: ['basic_store']
            },
            basic: {
                maxProducts: 50,
                canUploadImages: true,
                features: ['basic_store', 'image_upload', 'whatsapp_integration']
            },
            premium: {
                maxProducts: 200,
                canUploadImages: true,
                features: ['basic_store', 'image_upload', 'whatsapp_integration', 'analytics', 'custom_domain']
            },
            enterprise: {
                maxProducts: 1000,
                canUploadImages: true,
                features: ['basic_store', 'image_upload', 'whatsapp_integration', 'analytics', 'custom_domain', 'priority_support', 'api_access']
            }
        };
        
        const features = planFeatures[plan] || planFeatures.free;
        
        const membershipData = {
            membership: {
                status: status,
                plan: plan,
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
                maxProducts: maxProducts,
                canUploadImages: canUploadImages,
                features: features.features,
                updatedAt: window.firebaseServices.serverTimestamp()
            }
        };
        
        // Si es la primera vez, agregar fecha de inicio
        if (status === 'active') {
            membershipData.membership.startDate = window.firebaseServices.serverTimestamp();
        }
        
        const { db, doc, updateDoc } = window.firebaseServices;
        await updateDoc(doc(db, "users", userId), membershipData);
        
        showNotification("Membresía actualizada exitosamente", "success");
        
        // Recargar lista
        loadUsersList();
        adminElements.userDetails.classList.add('hidden');
        
    } catch (error) {
        console.error("Error actualizando membresía:", error);
        showNotification("Error actualizando membresía", "error");
    }
}

// Revocar acceso de usuario
async function revokeUserAccess(userId) {
    if (!confirm("¿Estás seguro de revocar el acceso de este usuario? Esto desactivará su tienda.")) {
        return;
    }
    
    try {
        const { db, doc, updateDoc } = window.firebaseServices;
        
        await updateDoc(doc(db, "users", userId), {
            membership: {
                status: "inactive",
                updatedAt: window.firebaseServices.serverTimestamp()
            }
        });
        
        showNotification("Acceso revocado exitosamente", "success");
        loadUsersList();
        adminElements.userDetails.classList.add('hidden');
        
    } catch (error) {
        console.error("Error revocando acceso:", error);
        showNotification("Error revocando acceso", "error");
    }
}

// Cargar planes de membresía
async function loadMembershipPlans() {
    try {
        const { db, doc, getDoc } = window.firebaseServices;
        
        const settingsRef = doc(db, "settings", "plans");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            const plans = settingsSnap.data();
            renderMembershipPlans(plans);
        } else {
            // Crear planes por defecto
            const defaultPlans = {
                free: {
                    name: "Gratuito",
                    price: 0,
                    features: ["Hasta 5 productos", "Sin imágenes", "Soporte básico"],
                    maxProducts: 5,
                    canUploadImages: false
                },
                basic: {
                    name: "Básico",
                    price: 9.99,
                    features: ["Hasta 50 productos", "Imágenes incluidas", "Integración WhatsApp", "Soporte por email"],
                    maxProducts: 50,
                    canUploadImages: true
                },
                premium: {
                    name: "Premium",
                    price: 19.99,
                    features: ["Hasta 200 productos", "Imágenes ilimitadas", "WhatsApp + Analytics", "Dominio personalizado", "Soporte prioritario"],
                    maxProducts: 200,
                    canUploadImages: true
                },
                enterprise: {
                    name: "Empresarial",
                    price: 49.99,
                    features: ["Productos ilimitados", "Todas las funciones", "API access", "Soporte 24/7", "Múltiples administradores"],
                    maxProducts: 1000,
                    canUploadImages: true
                }
            };
            
            // Guardar planes por defecto
            await setDoc(settingsRef, defaultPlans);
            renderMembershipPlans(defaultPlans);
        }
    } catch (error) {
        console.error("Error cargando planes:", error);
    }
}

// Configurar event listeners
function setupMembershipEventListeners() {
    // Botón para abrir panel de membresías
    const membershipAdminBtn = document.getElementById('membership-admin-btn');
    if (membershipAdminBtn) {
        membershipAdminBtn.addEventListener('click', () => {
            openModal(adminElements.membershipModal);
            loadUsersList();
        });
    }
    
    // Buscar usuarios
    if (adminElements.userSearch) {
        adminElements.userSearch.addEventListener('input', debounce(searchUsers, 300));
    }
}

// Buscar usuarios
async function searchUsers() {
    const searchTerm = adminElements.userSearch.value.toLowerCase();
    
    try {
        const { db, collection, getDocs } = window.firebaseServices;
        
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        const filteredUsers = [];
        querySnapshot.forEach((doc) => {
            const user = { id: doc.id, ...doc.data() };
            
            // Filtrar por email o ID
            if (user.email?.toLowerCase().includes(searchTerm) || 
                doc.id.toLowerCase().includes(searchTerm)) {
                filteredUsers.push(user);
            }
        });
        
        renderUsersList(filteredUsers);
    } catch (error) {
        console.error("Error buscando usuarios:", error);
    }
}

// Helper para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initMembershipAdmin);