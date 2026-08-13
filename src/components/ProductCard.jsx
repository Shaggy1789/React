export default function ProductCard({ product, onAdd, isAdding }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  return (
    <div className={`product-card ${isAdding ? 'adding' : ''}`}>
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <div className="product-image" style={{ background: product.color + '15' }}>
        {String(product.image || '').startsWith('http') ? (
          <img className="product-img" src={product.image} alt={product.name} />
        ) : (
          <span className="product-emoji">{product.image || '📦'}</span>
        )}
      </div>
      <h3>{product.name}</h3>
      <div className="product-rating">
        {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
        <span className="rating-count">({product.reviews})</span>
      </div>
      <div className="product-pricing">
        {product.originalPrice && (
          <span className="product-original-price">${product.originalPrice.toLocaleString()}</span>
        )}
        <span className="product-price">${product.price.toLocaleString()}</span>
        {discount && <span className="product-discount">-{discount}%</span>}
      </div>
      <button className="btn-add" onClick={() => onAdd(product)} disabled={isAdding}>
        {isAdding ? (
          <span className="btn-add-content">
            <span className="btn-spinner" />
            Agregando...
          </span>
        ) : (
          'Agregar al carrito'
        )}
      </button>
    </div>
  );
}