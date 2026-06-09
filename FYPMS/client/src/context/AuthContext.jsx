import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // ============================================
  // INITIALIZE AUTH STATE FROM LOCALSTORAGE
  // ============================================
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ============================================
  // LOGIN FUNCTION
  // ============================================
  const login = useCallback(async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  }, []);

  // ============================================
  // LOGOUT FUNCTION
  // ============================================
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  // ============================================
  // UPDATE USER DATA
  // ============================================
  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const newUserData = { ...prevUser, ...updatedUserData };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUserData));
        return newUserData;
    });
  }, []);

  // ============================================
  // AUTH HELPERS
  // ============================================
  const isAuthenticated = useCallback(() => !!token && !!user, [token, user]);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    const now = new Date();
    const hasTemporaryAccess = 
      user.temporary_role && 
      user.temporary_role_expires_at && 
      new Date(user.temporary_role_expires_at) > now;

    return user.role === role || (hasTemporaryAccess && user.temporary_role === role);
  }, [user]);

  const isAdmin = useCallback(() => hasRole('Administrator'), [hasRole]);

  // ============================================
  // MEMOIZED CONTEXT VALUE
  // ============================================
  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
    isAdmin
  }), [user, token, loading, login, logout, updateUser, isAuthenticated, hasRole, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};