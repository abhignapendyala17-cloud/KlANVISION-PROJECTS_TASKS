import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { ordersApi } from '../services/api';
import { useApp } from '../context/AppContext';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify, user } = useApp();
  useEffect(() => { ordersApi.list().then(({ data }) => setOrders(data)).catch((error) => notify(error.message, 'error')).finally(() => setLoading(false)); }, [notify]);
  return <div className="page-shell standard-page"><div className="page-title-row"><div><span className="eyebrow">{user?.role === 'admin' ? 'THE ORDER BOOK' : 'YOUR SHOPPING HISTORY'}</span><h1>{user?.role === 'admin' ? 'Orders' : 'My orders'} <span className="muted-count">({orders.length.toString().padStart(2, '0')})</span></h1></div>{user?.role === 'admin' && <Link to="/admin/products" className="text-link">Inventory ↗</Link>}</div>
    {loading ? <Loading label="Opening the order book…" /> : !orders.length ? <div className="empty-state"><h3>No orders yet</h3><p>Placed orders will appear here.</p><Link to="/" className="button button-dark">Shop the collection</Link></div> : <div className="table-wrap"><table><thead><tr><th>ORDER</th>{user?.role === 'admin' && <th>CUSTOMER</th>}<th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td className="mono">#{order._id.slice(-7).toUpperCase()}</td>{user?.role === 'admin' && <td>{order.customer?.name || 'Customer'}</td>}<td>{new Date(order.createdAt).toLocaleDateString()}</td><td><div className="order-thumbs" aria-label={`${order.items.length} products`}>{order.items.slice(0, 4).map((item, index) => <ProductImage key={`${item.product}-${index}`} src={item.imageUrl} alt={item.name} />)}<span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div></td><td>{formatPrice(order.totalAmount)}</td><td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td><td><Link to={`/orders/${order._id}`} className="row-link">View ↗</Link></td></tr>)}</tbody></table></div>}
  </div>;
}
