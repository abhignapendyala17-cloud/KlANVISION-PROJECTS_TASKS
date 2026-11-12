import { Link } from 'react-router-dom';
import { cartApi } from '../services/api';
import { useApp } from '../context/AppContext';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const { cart, customerId, refreshCart, notify } = useApp();
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const hasUnavailableItems = items.some((item) => !item.product || item.product.quantity < item.quantity);
  async function update(productId, quantity) {
    try {
      if (quantity < 1) await cartApi.remove(productId, { customerId });
      else await cartApi.update(productId, { customerId, quantity });
      await refreshCart();
    } catch (error) { notify(error.message, 'error'); }
  }
  return (
    <div className="page-shell standard-page">
      <div className="page-title-row"><div><span className="eyebrow">YOUR SELECTION</span><h1>Your bag<span className="muted-count"> ({items.length})</span></h1></div><Link to="/" className="text-link">Continue shopping ↗</Link></div>
      {!customerId ? <div className="empty-state"><span>◌</span><h3>Choose who’s shopping</h3><p>Select a customer in the top bar before adding items.</p><Link to="/customers" className="button button-dark">Add a customer</Link></div> : !items.length ? <div className="empty-state"><span>◌</span><h3>Your bag is taking a breather</h3><p>Find something thoughtful for your everyday.</p><Link to="/" className="button button-dark">Explore the collection</Link></div> : (
        <div className="cart-layout"><div className="cart-list">
          {items.map((item) => item.product && <article className="cart-item" key={item.product._id}><Link to={`/products/${item.product._id}`} className="cart-thumb"><ProductImage src={item.product.imageUrl} alt={item.product.name} /></Link><div className="cart-item-info"><span className="eyebrow">{item.product.category} · {item.product.productId}</span><Link to={`/products/${item.product._id}`}>{item.product.name}</Link><span className="cart-unit">{formatPrice(item.product.price)} each</span>{item.product.quantity < item.quantity && <span className="cart-stock-warning">{item.product.quantity ? `Only ${item.product.quantity} available` : 'Out of stock'}</span>}</div><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => update(item.product._id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label="Increase quantity" disabled={item.quantity >= item.product.quantity} onClick={() => update(item.product._id, item.quantity + 1)}>+</button></div><strong className="cart-line-total">{formatPrice(item.product.price * item.quantity)}</strong><button className="icon-button remove-item" aria-label="Remove item" onClick={() => update(item.product._id, 0)}>×</button></article>)}
        </div><aside className="summary-card"><span className="eyebrow">ORDER SUMMARY</span><div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>{hasUnavailableItems && <p className="form-error">Update quantities to match available stock before checkout.</p>}<Link to="/checkout" aria-disabled={hasUnavailableItems} onClick={(event) => hasUnavailableItems && event.preventDefault()} className={`button button-dark button-wide ${hasUnavailableItems ? 'disabled-link' : ''}`}>Continue to checkout <span>↗</span></Link><p className="summary-note">Taxes and delivery are confirmed before placing your order.</p></aside></div>
      )}
    </div>
  );
}
