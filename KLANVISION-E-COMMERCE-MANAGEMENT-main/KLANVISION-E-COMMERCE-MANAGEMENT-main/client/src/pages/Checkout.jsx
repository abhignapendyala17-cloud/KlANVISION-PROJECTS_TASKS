import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { customersApi, ordersApi } from '../services/api';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

const emptyCustomer = { name: '', email: '', phone: '', address: '' };
export default function Checkout() {
  const { user, cart, customerId, setCustomerId, customers, refreshCustomers, refreshCart, notify } = useApp();
  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState(emptyCustomer);
  const [checkoutCustomerId, setCheckoutCustomerId] = useState(customerId);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  useEffect(() => { setCheckoutCustomerId(customerId); }, [customerId]);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!items.length) return setError('Your cart is empty.');
    if (items.some((item) => !item.product || item.product.quantity < item.quantity)) return setError('One or more items no longer have enough stock. Update your cart before placing the order.');
    if (mode === 'existing' && !checkoutCustomerId) return setError('Select a customer or create a new account.');
    if (mode === 'new' && user.role !== 'admin') return setError('Customer accounts can only place orders using their own saved profile.');
    if (mode === 'new' && (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !/^\d{10}$/.test(form.phone) || !form.address.trim())) {
      return setError('Enter a name, valid email, 10-digit phone, and delivery address.');
    }
    setSubmitting(true);
    try {
      let id = customerId;
      if (mode === 'new') {
        const response = await customersApi.create(form);
        id = response.data._id;
        await refreshCustomers();
      } else {
        id = checkoutCustomerId;
      }
      const { data } = await ordersApi.create(id, customerId);
      if (id === customerId) await refreshCart();
      else setCustomerId(id);
      notify('Order placed — thank you!');
      navigate(`/orders/${data._id}`);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }
  if (!items.length) return <div className="page-shell standard-page"><div className="empty-state"><h2>Your bag is empty</h2><Link to="/" className="button button-dark">Back to the collection</Link></div></div>;
  return (
    <div className="page-shell standard-page">
      <div className="page-title-row"><div><span className="eyebrow">ONE LAST THING</span><h1>Checkout</h1></div><Link to="/cart" className="text-link">← Edit bag</Link></div>
      <form onSubmit={submit} className="checkout-layout">
        <div className="checkout-form">
          <section className="checkout-section"><span className="section-number">01</span><div><span className="eyebrow">DELIVERY DETAILS</span><h2>Who’s receiving this?</h2></div>
            {user.role === 'admin' && <div className="checkout-mode"><button type="button" className={mode === 'existing' ? 'selected' : ''} onClick={() => setMode('existing')}>Existing customer</button><button type="button" className={mode === 'new' ? 'selected' : ''} onClick={() => setMode('new')}>New customer</button></div>}
            {mode === 'existing' ? <label className="full-label">Select customer<select value={checkoutCustomerId} onChange={(event) => setCheckoutCustomerId(event.target.value)} required><option value="">Choose a customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} · {customer.email}</option>)}</select></label> : <div className="form-grid checkout-fields">{[['name','Full name','text'],['email','Email address','email'],['phone','10-digit phone','tel'],['address','Delivery address','text']].map(([name, label, type]) => <label key={name}>{label}<input name={name} type={type} value={form[name]} onChange={change} required /></label>)}</div>}
            {mode === 'existing' && checkoutCustomerId && <p className="selected-customer">{customers.find((customer) => customer._id === checkoutCustomerId)?.address}</p>}
          </section>
          <section className="checkout-section"><span className="section-number">02</span><div><span className="eyebrow">PAYMENT</span><h2>Payment on delivery</h2><p className="muted-copy">This demo records your order without collecting payment details.</p></div></section>
          {error && <p className="form-error">{error}</p>}
          <button disabled={submitting} className="button button-dark button-wide">{submitting ? 'Placing order…' : 'Place order'} <span>↗</span></button>
        </div>
        <aside className="summary-card"><span className="eyebrow">YOUR ORDER</span>{items.map((item) => item.product && <div className="checkout-line" key={item.product._id}><span className="checkout-item"><ProductImage src={item.product.imageUrl} alt={item.product.name} /><span>{item.product.name} <small>× {item.quantity}</small></span></span><strong>{formatPrice(item.product.price * item.quantity)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div><p className="summary-note">By placing your order, you confirm your delivery details are correct.</p></aside>
      </form>
    </div>
  );
}
