import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Toast from './Toast';

export default function Layout() {
  const { user, logout, cart, customers, customerId, setCustomerId, toast } = useApp();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const navigate = useNavigate();
  const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  useEffect(() => setSearch(params.get('search') || ''), [params]);
  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/?search=${encodeURIComponent(query)}#catalog` : '/#catalog');
  }
  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand"><span className="brand-mark">S</span><span>ShopEase<span className="brand-dot">.</span><small>EVERYDAY FINDS, MADE EASY</small></span></NavLink>
        <nav className="main-nav">
          <NavLink to="/" end>Store</NavLink>
          {user?.role === 'admin' && <><NavLink to="/orders">Orders</NavLink><NavLink to="/admin/products">Manage</NavLink><NavLink to="/admin/orders">Fulfill</NavLink><NavLink to="/customers">Customers</NavLink></>}
          {user?.role === 'user' && <><NavLink to="/orders">My orders</NavLink><NavLink to="/account">My account</NavLink></>}
        </nav>
        <div className="header-actions">
          <form className="nav-search" role="search" onSubmit={submitSearch}>
            <button type="submit" aria-label="Search products">⌕</button>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products…" aria-label="Search products" />
          </form>
          {user?.role === 'admin' && <label className="customer-select"><span>SHOPPING AS</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option value={customer._id} key={customer._id}>{customer.name}</option>)}</select></label>}
          {user?.role === 'user' && <span className="signed-in-name">{user.name}</span>}
          {user ? <button className="header-auth-button" onClick={logout}>Sign out</button> : <NavLink to="/login" className="header-auth-button">Sign in</NavLink>}
          <NavLink to={user ? '/cart' : '/login'} className="cart-link" aria-label={`Cart, ${count} items`}>Cart <span>{count}</span></NavLink>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer"><span>ShopEase<span className="brand-dot">.</span></span><span>Everyday finds, made easy.</span><span>© {new Date().getFullYear()} SHOPEASE</span></footer>
      <Toast toast={toast} />
    </>
  );
}
