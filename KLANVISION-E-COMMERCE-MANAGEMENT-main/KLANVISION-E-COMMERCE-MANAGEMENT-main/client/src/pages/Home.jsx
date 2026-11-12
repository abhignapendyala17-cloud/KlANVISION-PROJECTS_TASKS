import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import { useApp } from '../context/AppContext';
import { cartApi, productsApi } from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, customerId, refreshCart, notify } = useApp();
  const navigate = useNavigate();

  useEffect(() => setSearch(params.get('search') || ''), [params]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productsApi.list({ search, category }).then(({ data }) => {
      if (!active) return;
      setProducts(data);
      setCategories([...new Set(data.map((product) => product.category))].sort());
      setError('');
    }).catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, category]);

  useEffect(() => {
    productsApi.list().then(({ data }) => {
      setCategories([...new Set(data.map((product) => product.category))].sort());
    }).catch((requestError) => setError(requestError.message));
  }, []);

  async function add(product) {
    if (!user) return navigate(`/login?next=${encodeURIComponent('/')}`);
    if (!customerId) return notify('Select a customer before shopping.', 'error');
    try {
      await cartApi.add({ customerId, productId: product._id, quantity: 1 });
      await refreshCart();
      notify(`${product.name} added to your bag`);
    } catch (requestError) { notify(requestError.message, 'error'); }
  }

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">THE EVERYDAY EDIT · FIND YOUR FAVOURITES</span><h1>Good things,<br /><em>better living.</em></h1><p>Thoughtful finds for your home, your routine, and everything in between.</p><a className="hero-link" href="#catalog">Explore ShopEase <span>↓</span></a></div>
        <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-object">S<span>.</span></div><span className="hero-caption">THE GOOD<br />EVERYDAY EDIT</span><span className="hero-number">№ 01—32</span></div>
        <div className="hero-vertical">EVERYDAY FINDS&nbsp; / &nbsp;MADE EASY</div>
      </section>
      <section id="catalog" className="catalog-section">
        <div className="section-head"><div><span className="eyebrow">GOOD FINDS, ALL IN ONE PLACE</span><h2>Shop the collection <span className="muted-count">({products.length.toString().padStart(2, '0')})</span></h2></div>{user?.role === 'admin' && <Link className="text-link" to="/admin/products">Manage inventory ↗</Link>}</div>
        <div className="category-chips" aria-label="Filter by category">
          {['All', ...categories].map((name) => {
            const value = name === 'All' ? '' : name;
            return <button type="button" className={`category-chip ${category === value ? 'active' : ''}`} key={name} onClick={() => setCategory(value)}>{name}</button>;
          })}
        </div>
        <div className="catalog-toolbar">
          <label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, ID…" aria-label="Search products" /><kbd>↵</kbd></label>
          <label className="filter-select"><span>FILTER</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {loading ? <Loading label="Finding the good stuff…" /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} onAdd={add} />)}</div> : <div className="empty-state"><span>⌕</span><h3>Nothing in this edit</h3><p>Try another search or filter.</p><button className="text-link" onClick={() => { setSearch(''); setCategory(''); }}>Clear filters ↗</button></div>}
      </section>
      <section className="note-band"><span>01 — SHOP THE EVERYDAY</span><p>Useful, joyful, and easy to love.<br />That’s the ShopEase way.</p><span>GOOD THINGS, MADE EASY ↗</span></section>
    </div>
  );
}
