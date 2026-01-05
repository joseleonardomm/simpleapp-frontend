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

// Función para subir imagen
window.uploadImage = async (file, storeId) => {
    try {
        // Validar tamaño (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error("La imagen es demasiado grande. Tamaño máximo: 2MB");
        }
        
        // Crear referencia única
        const fileExt = file.name.split('.').pop();
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `stores/${storeId}/${fileName}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        throw error;
    }
};

// Función para eliminar imagen
window.deleteImage = async (imageUrl) => {
    try {
        // Crear referencia desde la URL
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        return true;
    } catch (error) {
        console.error("Error eliminando imagen:", error);
        return false;
    }
};

// firebase-config.js - Agregar al final
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// ... después de inicializar Firebase ...

const functions = getFunctions(app);

// Exportar funciones
window.firebaseServices = {
    // ... tus exportaciones actuales ...
    
    // Functions
    functions,
    httpsCallable
};