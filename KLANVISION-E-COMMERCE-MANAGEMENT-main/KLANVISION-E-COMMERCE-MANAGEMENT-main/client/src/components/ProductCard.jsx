import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, onAdd }) {
  const stock = product.quantity === 0 ? 'Out of stock' : product.quantity < 5 ? 'Low stock' : 'In stock';
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-visual">
        <ProductImage className="product-card-image" src={product.imageUrl} alt={product.name} />
        <span className="visual-index">{product.productId}</span>
        <span className={`stock-pill ${stock.toLowerCase().replaceAll(' ', '-')}`}><i />{stock}</span>
      </Link>
      <div className="product-info">
        <div><span className="eyebrow">{product.category}</span><Link className="product-name" to={`/products/${product._id}`}>{product.name}</Link></div>
        <strong>{formatPrice(product.price)}</strong>
      </div>
      <button className="add-button" disabled={!product.quantity} onClick={() => onAdd(product)}>{product.quantity ? 'Add to cart' : 'Out of stock'} <span>↗</span></button>
    </article>
  );
}
