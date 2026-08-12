import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseSDK';
import { User, RolePermissionMatrix } from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../permissions';

/**
 * Core Authentication Service for the POS and Management System
 */
export const AuthService = {
  /**
   * Signs in a user using the Google Auth Popup.
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google login error in AuthService:", error);
      throw error;
    }
  },

  /**
   * Logs out the current user from Firebase session.
   */
  async logoutFirebase() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error in AuthService:", error);
      throw error;
    }
  },

  /**
   * Helper to verify if a user has permission to view/modify a specific action/module.
   */
  hasPermission(
    user: User | null,
    module: keyof RolePermissionMatrix,
    action: 'view' | 'add' | 'edit' | 'delete' | 'refund',
    matrix: RolePermissionMatrix = DEFAULT_ROLE_PERMISSIONS
  ): boolean {
    if (!user) return false;
    
    // Admin has superuser status
    if (user.role === 'admin') return true;
    
    const roleConfig = matrix[user.role];
    if (!roleConfig) return false;
    
    return !!roleConfig[module]?.[action];
  }
};
