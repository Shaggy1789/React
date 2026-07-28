/* App.jsx — Componente principal. Estado global, busqueda, categorias y carrito */
import { useState, useEffect } from 'react';
import { addToBasket, getBasket } from './api/cartService';
import ProductList from './components/ProductList';
import CartModal from './components/CartModal';
import { Search, ShoppingCart, Package } from 'lucide-react';
import './App.css';

function App() {
  const [cartKey, setCartKey] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('todas');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getBasket().then(items => {
      const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(count);
    }).catch(() => {});
  }, [cartKey]);

  const handleAddToCart = async (product) => {
    try {
      setError(null);
      setAdding(product.id);
      await addToBasket(product);
      setCartKey(k => k + 1);
      setToast(`${product.name} agregado al carrito`);
      setTimeout(() => setAdding(null), 600);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setError(err.message);
      setAdding(null);
    }
  };

  const categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'computo', label: 'Computo' },
    { id: 'accesorios', label: 'Accesorios' },
    { id: 'audio', label: 'Audio' },
    { id: 'muebles', label: 'Muebles' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="header-brand">
            <Package size={28} />
            <h1>TechStore</h1>
          </div>
          <div className="header-actions">
            <button className="cart-trigger" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              <span className="cart-label">Carrito</span>
            </button>
          </div>
        </div>
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`pill ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠</span> {error}
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>✓</span> {toast}
        </div>
      )}

      <main className="app-main">
        <ProductList
          onAddToCart={handleAddToCart}
          addingId={adding}
          searchTerm={searchTerm}
          category={category}
        />
      </main>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        refreshKey={cartKey}
        onUpdate={() => setCartKey(k => k + 1)}
      />

      <footer className="app-footer">
        <p>&copy; 2026 TechStore &mdash; Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default App;