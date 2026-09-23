// Single source of truth for Firebase init.
// Values come from client/.env.local (VITE_* prefix → import.meta.env).
//
// Auth ONLY. Firestore used to be initialised and exported here, and nothing
// ever read it — every piece of data in this app comes from the Express API.
// It was still costing ~326 kB in the entry bundle (firestore 132 kB, its
// re2js dependency 144 kB, webchannel-wrapper 50 kB) on the first paint of
// the landing page. If you ever do need Firestore, import it lazily inside
// the feature that uses it rather than at module scope here.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
};

// Avoid double-init during Vite HMR.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
