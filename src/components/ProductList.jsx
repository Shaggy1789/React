import { useState, useEffect } from 'react';
import { getProducts } from '../api/cartService';
import ProductCard from './ProductCard';

export default function ProductList({ onAddToCart, addingId, searchTerm, category, refreshKey }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'todas') params.set('category', category);
    if (searchTerm) params.set('search', searchTerm);
    getProducts(params.toString())
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [category, searchTerm, refreshKey]);

  if (loading) return (
    <div className="status-container">
      <div className="spinner-lg" />
      <p className="status-msg">Cargando productos...</p>
    </div>
  );
  if (error) return (
    <div className="status-container error">
      <span className="status-icon">⚠</span>
      <p className="status-msg error">Error: {error.message}</p>
    </div>
  );
  if (products.length === 0) return (
    <div className="status-container">
      <span className="status-icon">📦</span>
      <p className="status-msg">No hay productos disponibles</p>
    </div>
  );

  return (
    <section className="products-section">
      <div className="section-header">
        <h2>{category === 'todas' ? 'Todos los productos' : category}</h2>
        <span className="product-count">{products.length} artículo{products.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="products-grid">
        {products.map((p, i) => (
          <ProductCard key={p.id ?? i} product={p} onAdd={onAddToCart} isAdding={addingId === p.id} />
        ))}
      </div>
    </section>
  );
}