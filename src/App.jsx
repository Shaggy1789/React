/* App.jsx — Componente principal. Estado global, busqueda, categorias, carrito y pedidos */
import { useState, useEffect } from 'react';
import { addToBasket, getBasket, saveBasket, CURRENT_USER } from './api/cartService';
import { createOrder } from './api/ordersService';
import { getUsers } from './api/userService';
import ProductList from './components/ProductList';
import CartModal from './components/CartModal';
import OrdersModal from './components/OrdersModal';
import OrderDetail from './components/OrderDetail';
import AddProductModal from './components/AddProductModal';
import { Search, ShoppingCart, Package } from 'lucide-react';
import './App.css';

function App() {
  const [cartKey, setCartKey] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('todas');
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);

  useEffect(() => {
    getUsers().then((list) => {
      setUsers(list);
      if (list.length > 0) {
        setCurrentUser(list[0].name);
      }
    });
  }, []);

  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const items = await getBasket(currentUser);
        const count = items && items.length > 0 
          ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
          : 0;
        setCartCount(count);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCartCount(0);
      }
    };
    loadCartCount();
  }, [cartKey, currentUser]);

  const handleAddToCart = async (product) => {
    try {
      setError(null);
      setAdding(product.id);
      await addToBasket(product, currentUser);
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
            <button className="orders-trigger" onClick={() => setOrdersOpen(true)}>
              <Package size={20} />
              <span className="orders-label">Pedidos</span>
            </button>
            <button className="add-product-trigger" onClick={() => setShowAddProduct(true)}>
              <Search size={20} /> Quiero añadir un producto
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
          refreshKey={productRefreshKey}
/>
        {selectedOrder && (
          <OrderDetail
            orderId={selectedOrder.id}
            currentUser={currentUser}
            onBack={() => {
              setSelectedOrder(null);
              setOrdersOpen(true);
              setOrdersRefreshKey(k => k + 1);
            }}
          />
        )}
        <AddProductModal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onCreateProduct={result => {
            setToast('Producto creado #' + result.id);
            setProductRefreshKey(k => k + 1);
            setTimeout(() => setToast(null), 2500);
          }}
        />
      </main>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        refreshKey={cartKey}
        currentUser={currentUser}
        onUpdate={() => setCartKey(k => k + 1)}
        onCreateOrder={async () => {
          try {
            setError(null);
            setAdding(null);
            const items = await getBasket(currentUser);
            await saveBasket(currentUser, items);
            const result = await createOrder(currentUser);
            await saveBasket(currentUser, []);
            setCartCount(0);
            setSelectedOrder({ id: result.id });
            setCartOpen(false);
            setToast(`Pedido creado #${result.id} - ${result.statusName || result.status}`);
            setCartKey(k => k + 1);
            setOrdersRefreshKey(k => k + 1);
            setTimeout(() => setToast(null), 2500);
          } catch (err) {
            setError(err.message);
            setAdding(null);
          }
        }}
      />

      <OrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        users={users}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          setCartKey(k => k + 1);
        }}
        refreshKey={ordersRefreshKey}
        onSelect={(order) => {
          setSelectedOrder(order);
          setOrdersOpen(false);
        }}
      />

      <footer className="app-footer">
        <p>&copy; 2026 TechStore &mdash; Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default App;