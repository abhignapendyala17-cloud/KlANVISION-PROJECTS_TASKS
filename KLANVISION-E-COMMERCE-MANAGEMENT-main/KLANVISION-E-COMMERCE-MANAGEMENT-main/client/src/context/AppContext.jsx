import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, cartApi, customersApi } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerIdState] = useState(localStorage.getItem('customerId') || '');
  const [cart, setCart] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      setAuthLoading(false);
      return;
    }
    authApi.me()
      .then(({ data }) => {
        setUser(data);
        if (data.role === 'user') {
          setCustomerIdState(data.customerId || '');
          if (data.customerId) localStorage.setItem('customerId', data.customerId);
          else localStorage.removeItem('customerId');
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('customerId');
        setCustomerIdState('');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const refreshCustomers = useCallback(async () => {
    if (!user) { setCustomers([]); return []; }
    const { data } = await customersApi.list();
    setCustomers(data);
    if (user.role === 'user') {
      const ownCustomer = data[0]?._id || '';
      setCustomerIdState(ownCustomer);
      if (ownCustomer) localStorage.setItem('customerId', ownCustomer);
      else localStorage.removeItem('customerId');
    } else if (customerId && !data.some((customer) => customer._id === customerId)) {
      setCustomerId('');
    }
    return data;
  }, [user, customerId]);

  const setCustomerId = useCallback((id) => {
    if (!user) return;
    if (user.role === 'user' && id !== user.customerId) return;
    setCustomerIdState(id);
    if (id) localStorage.setItem('customerId', id);
    else localStorage.removeItem('customerId');
    setCart(null);
  }, [user]);

  const refreshCart = useCallback(async () => {
    if (!user || !customerId) { setCart(null); return null; }
    const { data } = await cartApi.get(customerId);
    setCart(data);
    return data;
  }, [user, customerId]);

  const saveAuth = useCallback((authData) => {
    localStorage.setItem('authToken', authData.token);
    setUser(authData.user);
    const nextCustomerId = authData.user.role === 'user' ? authData.user.customerId || '' : '';
    setCustomerIdState(nextCustomerId);
    if (nextCustomerId) localStorage.setItem('customerId', nextCustomerId);
    else localStorage.removeItem('customerId');
    setCart(null);
    return authData.user;
  }, []);
  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    return saveAuth(data);
  }, [saveAuth]);
  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details);
    return saveAuth(data);
  }, [saveAuth]);
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('customerId');
    setUser(null);
    setCustomers([]);
    setCustomerIdState('');
    setCart(null);
  }, []);

  useEffect(() => {
    if (!user) { setCustomers([]); return; }
    refreshCustomers().catch((error) => notify(error.message, 'error'));
  }, [user, refreshCustomers, notify]);
  useEffect(() => {
    refreshCart().catch((error) => notify(error.message, 'error'));
  }, [refreshCart, notify]);

  const value = useMemo(() => ({
    user, authLoading, login, register, logout,
    customers, refreshCustomers, customerId, setCustomerId, cart, refreshCart, setCart, toast, notify
  }), [user, authLoading, login, register, logout, customers, refreshCustomers, customerId, setCustomerId, cart, refreshCart, toast, notify]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
