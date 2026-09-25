import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbSignOut,
  updateProfile,
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  testConnection
} from '../firebase/config';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'carinataskplus_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test Firestore connection on boot
    testConnection();

    // Check if guest user was stored
    const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (storedGuest) {
      try {
        const guestData = JSON.parse(storedGuest);
        setIsGuest(true);
        setUserProfile(guestData);
      } catch {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    let unsubProfile: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // Clean up any existing profile listener on auth state change
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to user profile document
        unsubProfile = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            } else {
              // Create default profile for new user
              const newProfile: UserProfile = {
                userId: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Productive Achiever',
                email: firebaseUser.email || '',
                role: 'Developer',
                bio: 'Focused on continuous growth, deep work, and building consistent daily streaks.',
                dailyFocusTargetMinutes: 100, // 4 pomodoros
                avatarUrl: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + firebaseUser.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(userDocRef, newProfile);
                setUserProfile(newProfile);
              } catch (err) {
                console.error("Failed to initialize user document:", err);
              }
            }
            setLoading(false);
          },
          (snapshotErr) => {
            // Guard: If auth state changed (user signed out or UID changed), ignore stale listener callbacks
            if (!auth.currentUser || auth.currentUser.uid !== firebaseUser.uid) {
              return;
            }
            handleFirestoreError(snapshotErr, OperationType.GET, `users/${firebaseUser.uid}`);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfile) {
        unsubProfile();
      }
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please verify your email and password.';
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role = 'Developer') => {
    setError(null);
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        // The onSnapshot in onAuthStateChanged will handle creating the user profile document
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed.';
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  const continueAsGuest = () => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestProfile: UserProfile = {
      userId: guestId,
      displayName: 'Guest Achiever',
      email: 'guest@carinataskplus.local',
      role: 'Student & Developer',
      bio: 'Exploring CarinaTaskPlus workspace in local guest mode.',
      dailyFocusTargetMinutes: 100,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setIsGuest(true);
    setUserProfile(guestProfile);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestProfile));
  };

  const signOut = async () => {
    try {
      if (isGuest) {
        setIsGuest(false);
        setUserProfile(null);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } else {
        await fbSignOut(auth);
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (isGuest && userProfile) {
      const updated = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
      setUserProfile(updated);
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
      return;
    }

    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOut,
        updateUserProfile,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
