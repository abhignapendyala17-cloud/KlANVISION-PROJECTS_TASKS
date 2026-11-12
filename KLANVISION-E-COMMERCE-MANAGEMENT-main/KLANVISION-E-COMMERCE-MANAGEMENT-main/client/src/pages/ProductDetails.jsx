import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { useApp } from '../context/AppContext';
import { cartApi, productsApi } from '../services/api';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, customerId, refreshCart, notify } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    productsApi.get(id).then(({ data }) => setProduct(data))
      .catch((error) => notify(error.message, 'error')).finally(() => setLoading(false));
  }, [id, notify]);
  async function add() {
    if (!user) return navigate(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
    if (!customerId) return notify('Select a customer before shopping.', 'error');
    try {
      await cartApi.add({ customerId, productId: product._id, quantity: 1 });
      await refreshCart();
      notify('Added to your bag');
    } catch (error) { notify(error.message, 'error'); }
  }
  if (loading) return <div className="page-shell"><Loading /></div>;
  if (!product) return <div className="page-shell"><div className="empty-state"><h2>Product not found</h2><Link to="/">Back to collection</Link></div></div>;
  return (
    <div className="page-shell detail-page">
      <Link to="/" className="back-link">← Back to collection</Link>
      <div className="detail-layout">
        <div className="detail-visual"><span className="visual-index">{product.productId}</span><ProductImage className="detail-image" src={product.imageUrl} alt={product.name} /><span className="detail-edition">SHOPEASE · PRODUCT {product.productId}</span></div>
        <div className="detail-copy"><span className="eyebrow">{product.category} / SHOPEASE EDIT</span><h1>{product.name}</h1><div className="detail-price">{formatPrice(product.price)}</div><p>{product.description || 'A quality everyday essential, selected for usefulness and lasting appeal.'}</p><div className="detail-stock"><span className={`stock-dot ${product.quantity ? 'available' : ''}`} />{product.quantity === 0 ? 'Out of stock' : product.quantity < 5 ? `Only ${product.quantity} left in stock` : `${product.quantity} in stock`}</div><button className="button button-dark button-wide" disabled={!product.quantity} onClick={add}>Add to cart <span>↗</span></button><div className="detail-foot"><span>01 / THOUGHTFULLY PICKED</span><span>02 / READY TO SHIP</span></div></div>
      </div>
    </div>
  );
}
