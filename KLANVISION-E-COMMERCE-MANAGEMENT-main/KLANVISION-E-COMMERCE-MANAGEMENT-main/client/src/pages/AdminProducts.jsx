import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import ProductForm from '../components/ProductForm';
import { useApp } from '../context/AppContext';
import { productsApi } from '../services/api';
import { formatPrice } from '../utils/format';
import ProductImage from '../components/ProductImage';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { notify } = useApp();
  async function load() {
    try { const { data } = await productsApi.list({ search }); setProducts(data); }
    catch (error) { notify(error.message, 'error'); }
    finally { setLoading(false); }
  }
  useEffect(() => { setLoading(true); load(); }, [search]);
  async function save(values) {
    if (editing) await productsApi.update(editing._id, values);
    else await productsApi.create(values);
    notify(editing ? 'Product updated' : 'Product added to inventory');
    setEditing(null); setShowForm(false); await load();
  }
  async function remove(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try { await productsApi.remove(product._id); notify('Product deleted'); await load(); }
    catch (error) { notify(error.message, 'error'); }
  }
  return <div className="page-shell standard-page">
    <div className="page-title-row"><div><span className="eyebrow">BACK OFFICE / CATALOG</span><h1>Manage products</h1></div><button className="button button-dark" onClick={() => { setEditing(null); setShowForm(true); }}>+ Add product</button></div>
    <div className="admin-stats"><div><span>CATALOG ITEMS</span><strong>{products.length.toString().padStart(2, '0')}</strong></div><div><span>LOW STOCK</span><strong>{products.filter((item) => item.quantity > 0 && item.quantity < 5).length.toString().padStart(2, '0')}</strong></div><div><span>OUT OF STOCK</span><strong>{products.filter((item) => item.quantity === 0).length.toString().padStart(2, '0')}</strong></div></div>
    {showForm && <ProductForm initial={editing} onSubmit={save} onClose={() => { setEditing(null); setShowForm(false); }} />}
    <div className="admin-toolbar"><label className="search-field compact-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by name, ID, category…" /><kbd>⌕</kbd></label><span className="eyebrow">LIVE INVENTORY</span></div>
    {loading ? <Loading /> : <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>ID / CATEGORY</th><th>PRICE</th><th>ON HAND</th><th>STOCK STATUS</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="admin-product-cell"><ProductImage src={product.imageUrl} alt={product.name} /><span><strong>{product.name}</strong><small className="table-description">{product.description}</small></span></div></td><td><span className="mono">{product.productId}</span><small>{product.category}</small></td><td>{formatPrice(product.price)}</td><td>{product.quantity}</td><td><span className={`stock-pill ${product.quantity === 0 ? 'out-of-stock' : product.quantity < 5 ? 'low-stock' : 'in-stock'}`}><i />{product.quantity === 0 ? 'Out of stock' : product.quantity < 5 ? 'Low stock' : 'In stock'}</span></td><td className="table-actions"><button className="row-link" onClick={() => { setEditing(product); setShowForm(true); }}>Edit</button><button className="row-link danger-text" onClick={() => remove(product)}>Delete</button></td></tr>)}</tbody></table>{!products.length && <div className="empty-inline">No products match your search.</div>}</div>}
  </div>;
}
