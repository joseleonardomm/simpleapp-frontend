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

// Función para subir imagen (productos o logos)
window.uploadImage = async (file, storeId, type = 'product') => {
    try {
        // Validar tamaño (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error("La imagen es demasiado grande. Tamaño máximo: 2MB");
        }
        
        // Crear referencia única basada en el tipo
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        
        let fileName;
        let storagePath;
        
        if (type === 'logo') {
            // Para logos
            fileName = `logo_${timestamp}_${randomString}.${fileExt}`;
            storagePath = `stores/${storeId}/logos/${fileName}`;
        } else {
            // Para productos
            fileName = `product_${timestamp}_${randomString}.${fileExt}`;
            // Usamos una carpeta temporal para productos que aún no tienen ID
            storagePath = `stores/${storeId}/products/temp/${fileName}`;
        }
        
        const storageRef = ref(storage, storagePath);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`Imagen subida correctamente (tipo: ${type}):`, downloadURL);
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

// Función para eliminar imagen
window.deleteImage = async (imageUrl) => {
    try {
        // Crear referencia desde la URL
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        console.log("Imagen eliminada correctamente:", imageUrl);
        return true;
    } catch (error) {
        console.error("Error eliminando imagen:", error);
        return false;
    }
};

// Función para mover imagen de temporal a la carpeta del producto
window.moveProductImage = async (tempImageUrl, storeId, productId) => {
    try {
        // 1. Descargar la imagen temporal
        const response = await fetch(tempImageUrl);
        const blob = await response.blob();
        
        // 2. Crear nuevo nombre de archivo
        const fileExt = tempImageUrl.split('.').pop().split('?')[0];
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const newFileName = `product_${timestamp}_${randomString}.${fileExt}`;
        const newStoragePath = `stores/${storeId}/products/${productId}/${newFileName}`;
        
        // 3. Subir a la nueva ubicación
        const newStorageRef = ref(storage, newStoragePath);
        const snapshot = await uploadBytes(newStorageRef, blob);
        const newDownloadURL = await getDownloadURL(snapshot.ref);
        
        // 4. Intentar eliminar la imagen temporal (opcional)
        try {
            const tempRef = ref(storage, tempImageUrl);
            await deleteObject(tempRef);
        } catch (deleteError) {
            console.warn("No se pudo eliminar la imagen temporal:", deleteError);
        }
        
        return newDownloadURL;
    } catch (error) {
        console.error("Error moviendo imagen de producto:", error);
        throw error;
    }
};