import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/useAuthStore';

export class AuthService {
  static isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static async loginWithEmail(email: string, password: string) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      useAuthStore.getState().setUser(data.user);
      useAuthStore.getState().setSession(data.session);
    }

    return data;
  }

  static async changePassword(newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  }

  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    useAuthStore.getState().reset();
  }
}
