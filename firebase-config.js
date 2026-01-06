// firebase-config.js
// Configuración de Firebase (Modular v10)

// Importar funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Tu configuración de Firebase (usa tus datos reales)
const firebaseConfig = {
    apiKey: "AIzaSyAeH1V2rJvmZ65oMr4PCdK3Uc4__PwgUdc",
    authDomain: "catalogo-digital-backend.firebaseapp.com",
    projectId: "catalogo-digital-backend",
    storageBucket: "catalogo-digital-backend.firebasestorage.app",
    messagingSenderId: "463389938850",
    appId: "1:463389938850:web:9f8ebaca6c10729f44f3fb"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configurar persistencia local
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistencia de autenticación configurada");
    })
    .catch((error) => {
        console.error("Error configurando persistencia:", error);
    });

// Exportar servicios y funciones para uso global
window.firebaseServices = {
    // Servicios
    auth,
    db,
    storage,
    
    // Funciones de Auth
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    
    // Funciones de Firestore
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    
    // Funciones de Storage
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};

console.log("Firebase configurado correctamente");

// Función para subir imagen (productos, logos, etc.)
window.uploadImage = async (file, storeId, type = 'product', productId = null) => {
    try {
        // Validar tamaño (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error("La imagen es demasiado grande. Tamaño máximo: 2MB");
        }
        
        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            throw new Error("Formato de imagen no válido. Use JPG, PNG o WebP");
        }
        
        // Crear referencia única basada en el tipo
        const fileExt = file.name.split('.').pop().toLowerCase();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        
        let fileName;
        let storagePath;
        
        if (type === 'logo') {
            // Para logos
            fileName = `logo_${timestamp}_${randomString}.${fileExt}`;
            storagePath = `stores/${storeId}/logos/${fileName}`;
        } else if (type === 'product' && productId) {
            // Para productos con ID específico
            fileName = `product_${productId}_${timestamp}_${randomString}.${fileExt}`;
            storagePath = `stores/${storeId}/products/${productId}/${fileName}`;
        } else {
            // Para productos temporales o sin ID
            fileName = `product_temp_${timestamp}_${randomString}.${fileExt}`;
            storagePath = `stores/${storeId}/products/temp/${fileName}`;
        }
        
        const storageRef = ref(storage, storagePath);
        
        // Configurar metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadDate: new Date().toISOString(),
                uploadType: type,
                storeId: storeId
            }
        };
        
        // Subir archivo con metadata
        const snapshot = await uploadBytes(storageRef, file, metadata);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`Imagen subida correctamente (tipo: ${type}):`, {
            path: storagePath,
            url: downloadURL,
            size: file.size,
            type: file.type
        });
        
        return downloadURL;
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        throw error;
    }
};

// Función específica para subir logo
window.uploadLogo = async (file, storeId) => {
    return await window.uploadImage(file, storeId, 'logo');
};

// Función específica para subir imágenes de producto
window.uploadProductImage = async (file, storeId, productId = null) => {
    return await window.uploadImage(file, storeId, 'product', productId);
};

// Función para subir múltiples imágenes
window.uploadMultipleImages = async (files, storeId, productId = null) => {
    try {
        const uploadPromises = Array.from(files).map(file => 
            window.uploadProductImage(file, storeId, productId)
        );
        
        const imageUrls = await Promise.all(uploadPromises);
        return imageUrls;
    } catch (error) {
        console.error("Error subiendo múltiples imágenes:", error);
        throw error;
    }
};

// Función para eliminar imagen
window.deleteImage = async (imageUrl) => {
    try {
        // Extraer la ruta de la URL
        let storagePath;
        
        if (imageUrl.includes('firebasestorage.googleapis.com')) {
            // Si es una URL completa de Firebase Storage
            const urlParts = imageUrl.split('/');
            const oIndex = urlParts.indexOf('o');
            if (oIndex !== -1) {
                storagePath = decodeURIComponent(urlParts[oIndex + 1].split('?')[0]);
            }
        } else {
            // Si ya es una ruta
            storagePath = imageUrl;
        }
        
        if (!storagePath) {
            throw new Error("No se pudo extraer la ruta de almacenamiento de la URL");
        }
        
        const imageRef = ref(storage, storagePath);
        await deleteObject(imageRef);
        
        console.log("Imagen eliminada correctamente:", storagePath);
        return true;
    } catch (error) {
        // Si el archivo no existe, no es un error crítico
        if (error.code === 'storage/object-not-found') {
            console.warn("La imagen ya no existe en Storage:", imageUrl);
            return true;
        }
        
        console.error("Error eliminando imagen:", error);
        throw error;
    }
};

// Función para eliminar múltiples imágenes
window.deleteMultipleImages = async (imageUrls) => {
    try {
        const deletePromises = imageUrls.map(url => window.deleteImage(url));
        const results = await Promise.allSettled(deletePromises);
        
        // Verificar resultados
        const failedDeletes = results
            .filter(result => result.status === 'rejected')
            .map(result => result.reason);
        
        if (failedDeletes.length > 0) {
            console.warn("Algunas imágenes no se pudieron eliminar:", failedDeletes);
        }
        
        return {
            success: failedDeletes.length === 0,
            failed: failedDeletes
        };
    } catch (error) {
        console.error("Error eliminando múltiples imágenes:", error);
        throw error;
    }
};

// Función para mover imagen de temporal a la carpeta del producto
window.moveProductImage = async (tempImageUrl, storeId, productId) => {
    try {
        // 1. Descargar la imagen temporal
        console.log("Descargando imagen temporal:", tempImageUrl);
        const response = await fetch(tempImageUrl);
        if (!response.ok) {
            throw new Error(`Error descargando imagen: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // 2. Crear nuevo nombre de archivo
        const fileExt = blob.type.split('/')[1] || 'jpg';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const newFileName = `product_${timestamp}_${randomString}.${fileExt}`;
        const newStoragePath = `stores/${storeId}/products/${productId}/${newFileName}`;
        
        // 3. Subir a la nueva ubicación
        console.log("Subiendo a nueva ubicación:", newStoragePath);
        const newStorageRef = ref(storage, newStoragePath);
        
        const metadata = {
            contentType: blob.type,
            customMetadata: {
                movedFrom: tempImageUrl,
                moveDate: new Date().toISOString(),
                productId: productId,
                storeId: storeId
            }
        };
        
        const snapshot = await uploadBytes(newStorageRef, blob, metadata);
        const newDownloadURL = await getDownloadURL(snapshot.ref);
        
        // 4. Intentar eliminar la imagen temporal
        try {
            await window.deleteImage(tempImageUrl);
            console.log("Imagen temporal eliminada:", tempImageUrl);
        } catch (deleteError) {
            console.warn("No se pudo eliminar la imagen temporal:", deleteError.message);
            // No lanzamos error porque ya tenemos la nueva imagen
        }
        
        console.log("Imagen movida exitosamente:", newDownloadURL);
        return newDownloadURL;
    } catch (error) {
        console.error("Error moviendo imagen de producto:", error);
        throw error;
    }
};

// Función para mover múltiples imágenes
window.moveMultipleProductImages = async (tempImageUrls, storeId, productId) => {
    try {
        const movePromises = tempImageUrls.map(url => 
            window.moveProductImage(url, storeId, productId)
        );
        
        const newImageUrls = await Promise.all(movePromises);
        return newImageUrls;
    } catch (error) {
        console.error("Error moviendo múltiples imágenes:", error);
        throw error;
    }
};

// Función para limpiar imágenes temporales (cron job opcional)
window.cleanupTempImages = async (storeId, olderThanHours = 24) => {
    try {
        console.log(`Limpiando imágenes temporales de tienda ${storeId} mayores a ${olderThanHours} horas`);
        
        // En una implementación real, necesitarías listar los archivos en la carpeta temp
        // y verificar su fecha de creación. Esto requiere una Cloud Function.
        
        // Por ahora, esta función es un placeholder
        console.log("Funcionalidad de limpieza temporal: implementación pendiente");
        
        return {
            success: true,
            message: "La limpieza de imágenes temporales requiere una Cloud Function"
        };
    } catch (error) {
        console.error("Error limpiando imágenes temporales:", error);
        throw error;
    }
};

// Funciones para manejo de categorías
window.categoriesService = {
    // Obtener todas las categorías de una tienda
    getCategories: async (storeId) => {
        try {
            const categoriesRef = collection(db, "stores", storeId, "categories");
            const querySnapshot = await getDocs(categoriesRef);
            
            const categories = [];
            querySnapshot.forEach((doc) => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return categories;
        } catch (error) {
            console.error("Error obteniendo categorías:", error);
            throw error;
        }
    },
    
    // Crear una nueva categoría
    createCategory: async (storeId, categoryData) => {
        try {
            const categoryWithMetadata = {
                ...categoryData,
                storeId: storeId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const categoriesRef = collection(db, "stores", storeId, "categories");
            const docRef = await addDoc(categoriesRef, categoryWithMetadata);
            
            return {
                id: docRef.id,
                ...categoryWithMetadata
            };
        } catch (error) {
            console.error("Error creando categoría:", error);
            throw error;
        }
    },
    
    // Actualizar una categoría existente
    updateCategory: async (storeId, categoryId, updateData) => {
        try {
            const categoryRef = doc(db, "stores", storeId, "categories", categoryId);
            
            const updateWithTimestamp = {
                ...updateData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(categoryRef, updateWithTimestamp);
            
            return {
                id: categoryId,
                ...updateWithTimestamp
            };
        } catch (error) {
            console.error("Error actualizando categoría:", error);
            throw error;
        }
    },
    
    // Eliminar una categoría
    deleteCategory: async (storeId, categoryId) => {
        try {
            // Primero, verificar si hay productos en esta categoría
            const productsRef = collection(db, "stores", storeId, "products");
            const productsQuery = query(productsRef, where("categoryId", "==", categoryId));
            const productsSnapshot = await getDocs(productsQuery);
            
            if (!productsSnapshot.empty) {
                throw new Error("No se puede eliminar la categoría porque tiene productos asignados");
            }
            
            // Si no hay productos, eliminar la categoría
            const categoryRef = doc(db, "stores", storeId, "categories", categoryId);
            await deleteDoc(categoryRef);
            
            return {
                success: true,
                message: "Categoría eliminada correctamente"
            };
        } catch (error) {
            console.error("Error eliminando categoría:", error);
            throw error;
        }
    },
    
    // Contar productos por categoría
    countProductsByCategory: async (storeId, categoryId) => {
        try {
            const productsRef = collection(db, "stores", storeId, "products");
            const productsQuery = query(productsRef, where("categoryId", "==", categoryId));
            const productsSnapshot = await getDocs(productsQuery);
            
            return productsSnapshot.size;
        } catch (error) {
            console.error("Error contando productos por categoría:", error);
            throw error;
        }
    }
};

// Funciones para manejo de productos
window.productsService = {
    // Obtener todos los productos de una tienda
    getProducts: async (storeId, categoryId = null) => {
        try {
            const productsRef = collection(db, "stores", storeId, "products");
            let productsQuery;
            
            if (categoryId) {
                productsQuery = query(productsRef, 
                    where("categoryId", "==", categoryId),
                    orderBy("createdAt", "desc")
                );
            } else {
                productsQuery = query(productsRef, orderBy("createdAt", "desc"));
            }
            
            const querySnapshot = await getDocs(productsQuery);
            
            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return products;
        } catch (error) {
            console.error("Error obteniendo productos:", error);
            throw error;
        }
    },
    
    // Crear un nuevo producto
    createProduct: async (storeId, productData) => {
        try {
            const productWithMetadata = {
                ...productData,
                storeId: storeId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const productsRef = collection(db, "stores", storeId, "products");
            const docRef = await addDoc(productsRef, productWithMetadata);
            
            return {
                id: docRef.id,
                ...productWithMetadata
            };
        } catch (error) {
            console.error("Error creando producto:", error);
            throw error;
        }
    },
    
    // Actualizar un producto existente
    updateProduct: async (storeId, productId, updateData) => {
        try {
            const productRef = doc(db, "stores", storeId, "products", productId);
            
            const updateWithTimestamp = {
                ...updateData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(productRef, updateWithTimestamp);
            
            return {
                id: productId,
                ...updateWithTimestamp
            };
        } catch (error) {
            console.error("Error actualizando producto:", error);
            throw error;
        }
    },
    
    // Eliminar un producto
    deleteProduct: async (storeId, productId) => {
        try {
            // Primero, obtener el producto para eliminar sus imágenes
            const productRef = doc(db, "stores", storeId, "products", productId);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
                const productData = productSnap.data();
                
                // Eliminar imágenes del producto si existen
                if (productData.images && productData.images.length > 0) {
                    try {
                        await window.deleteMultipleImages(productData.images);
                    } catch (imageError) {
                        console.warn("No se pudieron eliminar algunas imágenes:", imageError);
                    }
                }
            }
            
            // Luego, eliminar el documento del producto
            await deleteDoc(productRef);
            
            return {
                success: true,
                message: "Producto eliminado correctamente"
            };
        } catch (error) {
            console.error("Error eliminando producto:", error);
            throw error;
        }
    },
    
    // Buscar productos por nombre
    searchProducts: async (storeId, searchTerm) => {
        try {
            // Nota: Firestore no tiene búsqueda de texto completo nativa
            // Esta es una implementación básica que busca por coincidencia de inicio
            const productsRef = collection(db, "stores", storeId, "products");
            const productsQuery = query(productsRef, orderBy("name"));
            
            const querySnapshot = await getDocs(productsQuery);
            
            const searchResults = [];
            const lowerSearchTerm = searchTerm.toLowerCase();
            
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                if (product.name.toLowerCase().includes(lowerSearchTerm) ||
                    (product.description && product.description.toLowerCase().includes(lowerSearchTerm))) {
                    searchResults.push({
                        id: doc.id,
                        ...product
                    });
                }
            });
            
            return searchResults;
        } catch (error) {
            console.error("Error buscando productos:", error);
            throw error;
        }
    }
};

// Funciones para manejo de usuarios y tiendas
window.storeService = {
    // Obtener información de la tienda
    getStore: async (storeId) => {
        try {
            const storeRef = doc(db, "stores", storeId);
            const storeSnap = await getDoc(storeRef);
            
            if (storeSnap.exists()) {
                return {
                    id: storeSnap.id,
                    ...storeSnap.data()
                };
            } else {
                throw new Error("Tienda no encontrada");
            }
        } catch (error) {
            console.error("Error obteniendo tienda:", error);
            throw error;
        }
    },
    
    // Actualizar configuración de la tienda
    updateStore: async (storeId, updateData) => {
        try {
            const storeRef = doc(db, "stores", storeId);
            
            const updateWithTimestamp = {
                ...updateData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(storeRef, updateWithTimestamp);
            
            return {
                id: storeId,
                ...updateWithTimestamp
            };
        } catch (error) {
            console.error("Error actualizando tienda:", error);
            throw error;
        }
    },
    
    // Obtener estadísticas de la tienda
    getStoreStats: async (storeId) => {
        try {
            // Obtener conteo de productos
            const productsRef = collection(db, "stores", storeId, "products");
            const productsSnapshot = await getDocs(productsRef);
            
            // Obtener conteo de categorías
            const categoriesRef = collection(db, "stores", storeId, "categories");
            const categoriesSnapshot = await getDocs(categoriesRef);
            
            // Calcular valor total del inventario
            let totalInventoryValue = 0;
            productsSnapshot.forEach((doc) => {
                const product = doc.data();
                totalInventoryValue += product.price || 0;
            });
            
            return {
                productCount: productsSnapshot.size,
                categoryCount: categoriesSnapshot.size,
                totalInventoryValue: totalInventoryValue
            };
        } catch (error) {
            console.error("Error obteniendo estadísticas de tienda:", error);
            throw error;
        }
    }
};

// Función para inicializar la base de datos para una nueva tienda
window.initializeStoreDatabase = async (storeId, storeData) => {
    try {
        // Crear documento de la tienda
        const storeRef = doc(db, "stores", storeId);
        await setDoc(storeRef, {
            ...storeData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // Crear colecciones iniciales
        console.log(`Base de datos inicializada para tienda: ${storeId}`);
        
        return {
            success: true,
            storeId: storeId,
            message: "Tienda inicializada correctamente"
        };
    } catch (error) {
        console.error("Error inicializando base de datos de tienda:", error);
        throw error;
    }
};

// Función para obtener estadísticas generales del sistema (solo admin)
window.getSystemStats = async () => {
    try {
        // En una implementación real, esto requeriría permisos de administrador
        // y podría usar Cloud Functions para obtener datos agregados
        
        return {
            totalStores: "N/A (requiere Cloud Function)",
            totalProducts: "N/A (requiere Cloud Function)",
            activeUsers: "N/A (requiere Cloud Function)",
            serverTime: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error obteniendo estadísticas del sistema:", error);
        throw error;
    }
};

// Verificar conexión a Firebase
window.checkFirebaseConnection = async () => {
    try {
        // Intentar obtener un documento de prueba
        const testRef = doc(db, "_test", "connection");
        
        // Intentar escribir un documento temporal
        await setDoc(testRef, {
            test: true,
            timestamp: serverTimestamp()
        }, { merge: true });
        
        // Intentar leerlo
        const testSnap = await getDoc(testRef);
        
        // Limpiar el documento de prueba
        await deleteDoc(testRef);
        
        return {
            connected: true,
            services: {
                auth: auth ? "OK" : "Error",
                firestore: db ? "OK" : "Error",
                storage: storage ? "OK" : "Error"
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error verificando conexión a Firebase:", error);
        return {
            connected: false,
            error: error.message,
            services: {
                auth: auth ? "OK" : "Error",
                firestore: db ? "OK" : "Error",
                storage: storage ? "OK" : "Error"
            },
            timestamp: new Date().toISOString()
        };
    }
};

// Inicializar verificación de conexión al cargar
window.addEventListener('load', async () => {
    try {
        const connectionStatus = await window.checkFirebaseConnection();
        console.log("Estado de conexión Firebase:", connectionStatus);
        
        if (!connectionStatus.connected) {
            console.warn("Posibles problemas de conexión con Firebase");
        }
    } catch (error) {
        console.error("Error en verificación de conexión:", error);
    }
});

// Exportar funciones útiles adicionales
window.firebaseUtils = {
    // Formatear timestamp de Firestore
    formatFirestoreTimestamp: (timestamp) => {
        if (!timestamp) return null;
        
        try {
            // Convertir timestamp de Firestore a Date
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            
            // Formatear fecha
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Error formateando timestamp:", error);
            return "Fecha desconocida";
        }
    },
    
    // Validar URL de Firebase Storage
    isValidFirebaseStorageUrl: (url) => {
        return url && (
            url.includes('firebasestorage.googleapis.com') ||
            url.startsWith('https://firebasestorage.googleapis.com/')
        );
    },
    
    // Generar ID único
    generateUniqueId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Validar número de WhatsApp
    validateWhatsAppNumber: (number) => {
        const whatsappRegex = /^(\+?\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
        return whatsappRegex.test(number);
    }
};

console.log("Firebase configurado completamente con todas las funciones");