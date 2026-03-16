'use client';

import * as React from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, type Database } from 'firebase/database';
// import { getAuth, type Auth } from 'firebase/auth'; // Uncomment if auth is needed later

// --- IMPORTANT: Ensure these environment variables are set in your deployment environment (e.g., Vercel) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// Function to validate the Firebase config
const validateFirebaseConfig = (config: typeof firebaseConfig): string[] => {
  const missingKeys: string[] = [];
  // Add required keys here. Project ID and Database URL are often crucial.
  const requiredKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'databaseURL', // Crucial for Realtime Database
    'projectId',   // Crucial for Database URL determination if databaseURL is missing/invalid format
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  for (const key of requiredKeys) {
    if (!config[key]) {
      missingKeys.push(`NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  }
  // Check if databaseURL is a valid URL if provided
  if (config.databaseURL) {
      try {
          new URL(config.databaseURL);
      } catch (_) {
          missingKeys.push('NEXT_PUBLIC_FIREBASE_DATABASE_URL (must be a valid URL)');
      }
  }

  return missingKeys;
};


interface FirebaseContextProps {
  app: FirebaseApp | null;
  db: Database | null;
  isConnected: boolean;
  error: string | null;
}

const FirebaseContext = React.createContext<FirebaseContextProps>({
  app: null,
  db: null,
  isConnected: false,
  error: null,
});

export const useFirebase = () => React.useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [app, setApp] = React.useState<FirebaseApp | null>(null);
  const [db, setDb] = React.useState<Database | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const missingConfigKeys = validateFirebaseConfig(firebaseConfig);
    if (missingConfigKeys.length > 0) {
      setError(`Missing ${missingConfigKeys.join(', ')}`);
      return;
    }

    try {
      const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const database = getDatabase(firebaseApp);

      setApp(firebaseApp);
      setDb(database);
      setError(null);

      // --- Monitor Connection ---
      const connectedRef = ref(database, ".info/connected");
      const unsubscribe = onValue(connectedRef, (snap) => {
        setIsConnected(snap.val() === true);
        if (snap.val() === true) {
          console.log("🔥 Firebase connected");
        } else {
          console.warn("❄️ Firebase disconnected");
        }
      });

      return () => unsubscribe();
    } catch (initError: any) {
      console.error("Firebase init error:", initError);
      setError(initError.message);
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ app, db, isConnected, error }}>
      {children}
    </FirebaseContext.Provider>
  );
};
