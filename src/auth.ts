import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user ?? null;
  } catch (error) {
    console.error('Google sign-in failed', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed', error);
    throw error;
  }
}

export type AuthUser = User | null;
