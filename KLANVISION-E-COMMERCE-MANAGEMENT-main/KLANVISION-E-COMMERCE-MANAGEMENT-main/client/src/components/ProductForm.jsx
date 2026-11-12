import { useState } from 'react';

const categories = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Beauty', 'Groceries', 'Toys'];
const blank = { productId: '', name: '', category: '', price: '', quantity: '0', imageUrl: '', description: '' };
export default function ProductForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, imageUrl: initial.imageUrl || '', price: String(initial.price), quantity: String(initial.quantity) } : blank);
  const [error, setError] = useState('');
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.productId.trim() || !form.category.trim()) return setError('ID, name, and category are required.');
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return setError('Enter a price greater than zero.');
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) return setError('Stock must be a non-negative whole number.');
    try { await onSubmit({ ...form, price: Number(form.price), quantity: Number(form.quantity) }); }
    catch (requestError) { setError(requestError.message); }
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-heading"><div><span className="eyebrow">CATALOG ENTRY</span><h2>{initial ? 'Edit product' : 'New product'}</h2></div><button type="button" className="icon-button" onClick={onClose}>×</button></div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-grid">
        <label>Product ID<input name="productId" value={form.productId} onChange={change} required /></label>
        <label>Product name<input name="name" value={form.name} onChange={change} required /></label>
        <label>Category<select name="category" value={form.category} onChange={change} required><option value="">Choose category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Price (₹)<input type="number" name="price" min="0.01" step="0.01" value={form.price} onChange={change} required /></label>
        <label>Quantity<input type="number" name="quantity" min="0" step="1" value={form.quantity} onChange={change} required /></label>
        <label className="wide-field">Image URL<input type="url" name="imageUrl" value={form.imageUrl || ''} onChange={change} placeholder="https://…" /></label>
        <label className="wide-field">Description<textarea name="description" rows="3" value={form.description || ''} onChange={change} /></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark">{initial ? 'Save changes' : 'Create product'}</button></div>
    </form>
  );
}
