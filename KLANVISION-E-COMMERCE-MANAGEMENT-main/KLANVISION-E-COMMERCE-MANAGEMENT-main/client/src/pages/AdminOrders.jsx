import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { useApp } from '../context/AppContext';
import { ordersApi } from '../services/api';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

const nextStatus = { Placed: 'Processing', Processing: 'Shipped', Shipped: 'Delivered' };
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useApp();
  async function load() {
    try { const { data } = await ordersApi.list(); setOrders(data); }
    catch (error) { notify(error.message, 'error'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function advance(id, status) {
    try { const { message } = await ordersApi.updateStatus(id, status); notify(message); await load(); }
    catch (error) { notify(error.message, 'error'); }
  }
  async function cancel(id) {
    if (!window.confirm('Cancel this order and restore its inventory?')) return;
    try { const { message } = await ordersApi.cancel(id); notify(message); await load(); }
    catch (error) { notify(error.message, 'error'); }
  }
  return <div className="page-shell standard-page"><div className="page-title-row"><div><span className="eyebrow">BACK OFFICE / FULFILLMENT</span><h1>Manage orders</h1></div><Link to="/orders" className="text-link">Customer order book ↗</Link></div>
    <div className="admin-stats"><div><span>ALL ORDERS</span><strong>{orders.length.toString().padStart(2,'0')}</strong></div><div><span>IN PROGRESS</span><strong>{orders.filter((order) => ['Placed','Processing','Shipped'].includes(order.status)).length.toString().padStart(2,'0')}</strong></div><div><span>COMPLETED</span><strong>{orders.filter((order) => order.status === 'Delivered').length.toString().padStart(2,'0')}</strong></div></div>
    {loading ? <Loading /> : !orders.length ? <div className="empty-state"><h3>No orders to fulfill</h3><p>New customer orders will show up here.</p></div> : <div className="table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><Link className="mono row-link" to={`/orders/${order._id}`}>#{order._id.slice(-7).toUpperCase()}</Link></td><td>{order.customer?.name || 'Customer'}<small>{order.customer?.email}</small></td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td><div className="order-thumbs" aria-label={`${order.items.length} products`}>{order.items.slice(0, 4).map((item, index) => <ProductImage key={`${item.product}-${index}`} src={item.imageUrl} alt={item.name} />)}</div></td><td>{formatPrice(order.totalAmount)}</td><td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td><td className="table-actions">{nextStatus[order.status] && <button className="row-link" onClick={() => advance(order._id, nextStatus[order.status])}>Mark {nextStatus[order.status]}</button>}{['Placed','Processing','Shipped'].includes(order.status) && <button className="row-link danger-text" onClick={() => cancel(order._id)}>Cancel</button>}</td></tr>)}</tbody></table></div>}
  </div>;
}
