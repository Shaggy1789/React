import { useState, useEffect } from 'react';
import { createProduct } from '../api/productsService';

export default function AddProductModal({ isOpen, onClose, onCreateProduct }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('computo');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreate = async e => {
    e.preventDefault();
    if (!name.trim() || price === '') {
      setError('Nombre y precio son obligatorios');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const product = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category || 'general',
        image: image.trim() || undefined,
      };
      const result = await createProduct(product);
      setLoading(false);
      onCreateProduct(result);
      setTimeout(() => onClose(), 300);
    } catch (err) {
      setError(err.message || 'Error al crear el producto');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Añadir Nuevo Producto</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="error-banner">
              <span>⚠</span> {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="product-form">
            <div className="form-group">
              <label>Nombre del producto</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Laptop Gamer Nitro 5"
                required
                aria-label="Nombre del producto"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Breve descripción del producto"
                rows={2}
                aria-label="Descripción del producto"
              />
            </div>

            <div className="form-group">
              <label>Precio</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0"
                required
                aria-label="Precio"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="computo">Computo</option>
                <option value="accesorios">Accesorios</option>
                <option value="audio">Audio</option>
                <option value="muebles">Muebles</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="form-group">
              <label>Imagen (URL o emoji)</label>
              <input
                type="text"
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="ej: 💻 o https://ejemplo.com/imagen.jpg"
                aria-label="Imagen"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}