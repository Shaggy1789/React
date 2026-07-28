export default function CartItem({ item, onRemove }) {
  return (
    <li className="cart-item">
      <span className="cart-item-name">{item.name || item.nombre || item.title}</span>
      <span className="cart-item-price">
        ${item.price ?? item.precio ?? 0}
      </span>
      <button className="btn-remove" onClick={() => onRemove(item.id)}>
        Eliminar
      </button>
    </li>
  );
}
