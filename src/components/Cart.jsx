import { useState, useEffect } from 'react';
import { getBasket, removeFromBasket } from '../api/cartService';
import CartItem from './CartItem';

export default function Cart({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = () => {
    setLoading(true);
    getBasket(currentUser)
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const handleRemove = async (id) => {
    try {
      await removeFromBasket(id, currentUser);
      fetchCart();
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <p className="status-msg">Cargando carrito...</p>;
  if (error) return <p className="status-msg error">Error: {error.message}</p>;
  if (items.length === 0) return <p className="status-msg">El carrito está vacío</p>;

  const total = items.reduce((sum, item) => sum + (item.price ?? item.precio ?? 0), 0);

  return (
    <section className="cart-section">
      <h2>Carrito ({items.length})</h2>
      <ul className="cart-list">
        {items.map((item, i) => (
          <CartItem key={item.id ?? i} item={item} onRemove={handleRemove} />
        ))}
      </ul>
      <div className="cart-total">
        <strong>Total: ${total.toFixed(2)}</strong>
      </div>
    </section>
  );
}
