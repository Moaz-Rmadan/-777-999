import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyCGRSIVpdSm2DmURN3QcD24IakMhUoPHTU",
  authDomain: "alert-bedrock-707pf.firebaseapp.com",
  projectId: "alert-bedrock-707pf",
  storageBucket: "alert-bedrock-707pf.firebasestorage.app",
  messagingSenderId: "351519017763",
  appId: "1:351519017763:web:421e355630a3044577da96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence (persistent local cache for offline-first support)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, "ai-studio-dea18671-a3ef-4da0-b6bb-cc16f1aba787");

export const auth = getAuth(app);

// Safe App Check Initialization
if (typeof window !== 'undefined') {
  try {
    // Set debug token for seamless staging/local testing in sandbox preview
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Ldf_fUqAAAAANg60h-k69D4K6vT6vT-gN-562_z'),
      isTokenAutoRefreshEnabled: true
    });
    console.log("Firebase App Check initialized with App Check Debug Provider.");
  } catch (err) {
    console.warn("App Check not initialized or ReCaptcha token not available:", err);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
}

export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase logout error:", error);
    throw error;
  }
}

// Save helper for structured POS collections
export async function saveToFirebase(key: string, data: any) {
  try {
    const docRef = doc(db, 'system_data', key);
    // Sanitize data to remove any undefined values which Firestore rejects
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, { data: sanitizedData });
  } catch (error) {
    console.error(`Firebase write error for ${key}:`, error);
  }
}

// Load helper
export async function loadFromFirebase(key: string) {
  try {
    const docRef = doc(db, 'system_data', key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().data;
    }
  } catch (error) {
    console.error(`Firebase read error for ${key}:`, error);
  }
  return null;
}
