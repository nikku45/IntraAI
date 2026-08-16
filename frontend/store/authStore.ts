import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  company_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// 🧘 This is our "Store". It's like a small box of data that any page can reach into.
// We use 'persist' so that even if the user refreshes the page, they stay logged in!
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('intraai_token', token);
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('intraai_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'intraai-auth-storage', // Key for LocalStorage
    }
  )
);
