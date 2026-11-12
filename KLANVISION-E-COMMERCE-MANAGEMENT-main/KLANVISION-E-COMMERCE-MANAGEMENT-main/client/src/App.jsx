import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import Customers from './pages/Customers';
import AuthPage from './pages/AuthPage';
import RequireAuth from './components/RequireAuth';
import Account from './pages/Account';

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route path="/" element={<Home />} />
    <Route path="/products/:id" element={<ProductDetails />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
    <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
    <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
    <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
    <Route path="/orders/:id" element={<RequireAuth><OrderDetails /></RequireAuth>} />
    <Route path="/admin/products" element={<RequireAuth role="admin"><AdminProducts /></RequireAuth>} />
    <Route path="/admin/orders" element={<RequireAuth role="admin"><AdminOrders /></RequireAuth>} />
    <Route path="/customers" element={<RequireAuth role="admin"><Customers /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes>;
}
