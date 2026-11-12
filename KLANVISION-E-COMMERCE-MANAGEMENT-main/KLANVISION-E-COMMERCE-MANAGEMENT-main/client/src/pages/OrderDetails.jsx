import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { ordersApi } from '../services/api';
import { useApp } from '../context/AppContext';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

const nextStatus = { Placed: 'Processing', Processing: 'Shipped', Shipped: 'Delivered' };
export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify, user } = useApp();
  async function load() {
    try { const { data } = await ordersApi.get(id); setOrder(data); }
    catch (error) { notify(error.message, 'error'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);
  async function update(action) {
    try {
      const response = action === 'cancel' ? await ordersApi.cancel(id) : await ordersApi.updateStatus(id, action);
      setOrder(response.data);
      notify(response.message);
    } catch (error) { notify(error.message, 'error'); }
  }
  if (loading) return <div className="page-shell"><Loading /></div>;
  if (!order) return <div className="page-shell"><div className="empty-state"><h2>Order not found</h2><Link to="/orders">Back to orders</Link></div></div>;
  return <div className="page-shell standard-page">
    <Link to="/orders" className="back-link">← Back to order book</Link>
    <div className="page-title-row order-title"><div><span className="eyebrow">ORDER PLACED {new Date(order.createdAt).toLocaleDateString()}</span><h1>Order <span className="mono">#{order._id.slice(-7).toUpperCase()}</span></h1></div><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></div>
    <div className="order-detail-layout"><section><div className="detail-card"><span className="eyebrow">FULFILLMENT</span><div className="timeline">{['Placed', 'Processing', 'Shipped', 'Delivered'].map((status, index) => { const stepIndex = ['Placed', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status); return <div className={`timeline-step ${order.status === 'Cancelled' ? '' : index <= stepIndex ? 'complete' : ''}`} key={status}><span>{index <= stepIndex && order.status !== 'Cancelled' ? '✓' : `0${index + 1}`}</span><div><strong>{status}</strong><small>{index === 0 ? new Date(order.createdAt).toLocaleString() : index === stepIndex ? 'Current status' : 'Upcoming'}</small></div></div>; })}</div>
      {order.status === 'Cancelled' && <p className="form-error">This order was cancelled. Inventory has been restored.</p>}
      <div className="order-actions">{user?.role === 'admin' && nextStatus[order.status] && <button className="button button-dark" onClick={() => update(nextStatus[order.status])}>Mark as {nextStatus[order.status]} ↗</button>}{(user?.role === 'admin' ? ['Placed', 'Processing', 'Shipped'].includes(order.status) : ['Placed', 'Processing'].includes(order.status)) && <button className="button button-quiet danger-text" onClick={() => { if (window.confirm('Cancel this order and return its items to inventory?')) update('cancel'); }}>Cancel order</button>}</div>
    </div><div className="detail-card"><span className="eyebrow">DELIVERY TO</span><h3>{order.customer?.name}</h3><p>{order.customer?.address}</p><p>{order.customer?.email} · {order.customer?.phone}</p></div></section>
    <aside className="summary-card"><span className="eyebrow">ITEMS IN THIS ORDER</span>{order.items.map((item, index) => <div className="checkout-line" key={`${item.product}-${index}`}><span className="checkout-item"><ProductImage src={item.imageUrl} alt={item.name} /><span>{item.name} <small>× {item.quantity}</small></span></span><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{formatPrice(order.totalAmount)}</strong></div></aside></div>
  </div>;
}
