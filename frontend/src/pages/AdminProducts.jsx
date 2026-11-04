import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../services/image";
import "./AdminProducts.css";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

function AdminProducts() {
  // ==============================
  // PRODUCTS
  // ==============================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ==============================
  // MODAL STATE
  // ==============================
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility
  const [editingProduct, setEditingProduct] = useState(null); // Null = Adding, Object = Editing
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    sale_price: "",
    stock: "",
    category_id: "",
    image: "",
  });

  // ==============================
  // FETCH DATA
  // ==============================
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/products/");
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("FETCH PRODUCTS ERROR:", err);
      setError(
        err.response?.data?.error ||
          "Unable to load products. Make sure Flask is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories/");
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("FETCH CATEGORIES ERROR:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // ==============================
  // STATISTICS
  // ==============================
  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.stock || 0) <= 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  ).length;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(product.category?.id) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // ==============================
  // OPEN ADD MODAL
  // ==============================
  const handleAdd = () => {
    setEditingProduct(null); // Null means we are ADDING
    setForm({
      name: "",
      description: "",
      price: "",
      sale_price: "",
      stock: "",
      category_id: "",
      image: "",
    });
    setIsModalOpen(true);
  };

  // ==============================
  // OPEN EDIT MODAL
  // ==============================
  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      sale_price: product.sale_price ?? "",
      stock: product.stock ?? "",
      category_id: product.category?.id ? String(product.category.id) : "",
      image: product.image ?? "",
    });
    setIsModalOpen(true);
  };

  // ==============================
  // CLOSE MODAL
  // ==============================
  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm({
      name: "",
      description: "",
      price: "",
      sale_price: "",
      stock: "",
      category_id: "",
      image: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  // ==============================
  // SAVE ADD/EDIT PRODUCT
  // ==============================
  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      alert("Please enter a valid price.");
      return;
    }
    if (form.stock === "" || Number(form.stock) < 0) {
      alert("Please enter a valid stock quantity.");
      return;
    }
    if (!form.category_id) {
      alert("Please select a category.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      sale_price: form.sale_price === "" ? null : Number(form.sale_price),
      stock: Number(form.stock),
      category_id: Number(form.category_id),
      image: form.image.trim() || null,
    };

    setSaving(true);

    try {
      if (editingProduct) {
        // We have an ID, so we UPDATE (PUT)
        await api.put("/products/" + editingProduct.id, productData);
        alert("Product updated successfully!");
      } else {
        // We don't have an ID, so we CREATE (POST)
        await api.post("/products/", productData);
        alert("Product added successfully!");
      }

      closeModal();
      await fetchProducts();

    } catch (err) {
      console.error("SAVE PRODUCT ERROR:", err);
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // DELETE PRODUCT
  // ==============================
  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"?`);
    if (!confirmed) return;
    try {
      await api.delete("/products/" + product.id);
      await fetchProducts();
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      alert(err.response?.data?.error || "Failed to delete product.");
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="brand-mark">H</span>
            <div>
              <strong>Hayati</strong>
              <span>ELIXIRS</span>
            </div>
          </div>
        </aside>
        <main className="admin-main">
          <div className="admin-loading">Loading products...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark">H</span>
          <div>
            <strong>Hayati</strong>
            <span>ELIXIRS</span>
          </div>
        </div>
        <div className="admin-section-label">MANAGEMENT</div>
        <nav className="admin-nav">
          <Link to="/admin/products" className="admin-nav-item active">
            <span>◈</span> Products
          </Link>
          <Link to="/admin/categories" className="admin-nav-item">
            <span>◇</span> Categories
          </Link>
          <Link to="/" className="admin-nav-item">
            <span>⌂</span> Store
          </Link>
          <Link to="/cart" className="admin-nav-item">
            <span>▢</span> Orders
          </Link>
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/" className="back-to-store">← Back to Store</Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">HAYATI ELIXIRS / ADMIN</p>
            <h1>Products</h1>
            <p className="admin-subtitle">Manage your fragrance collection and inventory.</p>
          </div>
          
          {/* THE NEW ADD BUTTON HOOKED UP HERE */}
          <button type="button" className="admin-add-button" onClick={handleAdd}>
            <span>+</span> Add Product
          </button>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">✦</div>
            <div><span>Total Products</span><strong>{products.length}</strong></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">◇</div>
            <div><span>Total Stock</span><strong>{totalStock}</strong></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">!</div>
            <div><span>Out of Stock</span><strong>{outOfStock}</strong></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">!</div>
            <div>
              <span>Low Stock (1–5)</span>
              <strong>{lowStock}</strong>
            </div>
          </div>
        </section>

        <section className="admin-products-section">
          <div className="products-section-header">
            <div>
              <h2>Product Collection</h2>
              <p>Your products are synced directly with MySQL.</p>
            </div>
            <div className="product-filters">
              <label className="admin-search-wrap">
                <span className="admin-search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search perfumes..."
                  aria-label="Search perfumes"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="admin-search-input"
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="admin-filter-select"
              >
                <option value="all">All Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="refresh-button" onClick={fetchProducts}>
              ↻ Refresh
            </button>
          </div>

          {error && (
            <div className="admin-error">
              <strong>Unable to load products</strong>
              <p>{error}</p>
              <button type="button" onClick={fetchProducts}>Try Again</button>
            </div>
          )}

          {!error && (
            <div className="admin-product-list">
              {filteredProducts.map((product) => (
                <article className="admin-product-card" key={product.id}>
                  <div className="admin-product-image-wrap">
                    {product.image ? (
                      <img src={getImageUrl(product.image)} alt={product.name} className="admin-product-image" />
                    ) : (
                      <div className="admin-no-image">NO IMAGE</div>
                    )}
                  </div>
                  <div className="admin-product-info">
                    <span className="admin-product-id">PRODUCT #{product.id}</span>
                    <h3>{product.name}</h3>
                    <p className="admin-category">{product.category?.name || "Uncategorized"}</p>
                  </div>
                  <div className="admin-product-price">
                    <span>PRICE</span>
                    <strong>{formatCurrency(product.price)}</strong>
                    {product.sale_price != null && (
                      <small>Sale {formatCurrency(product.sale_price)}</small>
                    )}
                  </div>
                  <div className="admin-product-stock">
                    <span>STOCK</span>
                    <strong
                      className={
                        Number(product.stock) <= 0
                          ? "stock-bad"
                          : Number(product.stock) <= 5
                          ? "stock-low"
                          : "stock-good"
                      }
                    >
                      {Number(product.stock) <= 0
                        ? "Out of stock"
                        : Number(product.stock) <= 5
                        ? `${product.stock} left`
                        : product.stock}
                    </strong>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" className="edit-button" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="delete-button" onClick={() => handleDelete(product)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {filteredProducts.length === 0 && (
                <div className="admin-empty">
                  <h3>
                    {products.length === 0
                      ? "No products found"
                      : "No matching perfumes"}
                  </h3>

                  <p>
                    {products.length === 0
                      ? "Your collection is empty. Add your first perfume."
                      : "Try another search term or category."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* =================================
          MODAL (NOW HANDLES BOTH ADD & EDIT)
      ================================= */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) closeModal();
        }}>
          <div className="admin-modal">
            
            <div className="admin-modal-header">
              <div>
                {/* DYNAMIC TITLE */}
                <p>{editingProduct ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
                <h2>{editingProduct ? editingProduct.name : "Add a New Product"}</h2>
              </div>
              <button type="button" className="modal-close" onClick={closeModal} disabled={saving}>×</button>
            </div>

            <form className="admin-product-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} disabled={saving} required />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} disabled={saving} rows="4" />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} disabled={saving} min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Sale Price</label>
                  <input type="number" name="sale_price" value={form.sale_price} onChange={handleChange} disabled={saving} min="0" step="0.01" placeholder="Optional" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} disabled={saving} min="0" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange} disabled={saving} required>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                {form.image && (
                  <div className="edit-image-preview">
                    <img src={getImageUrl(form.image)} alt="Preview" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert("Image must be smaller than 5 MB.");
                    event.target.value = "";
                    return;
                  }
                  const uploadData = new FormData();
                  uploadData.append("image", file);
                  try {
                    const response = await api.post("/uploads/product-image", uploadData);
                    setForm((previous) => ({ ...previous, image: response.data.image }));
                    alert("Image uploaded successfully!");
                  } catch (error) {
                    console.error("Image upload failed:", error);
                    alert(error.response?.data?.error || "Image upload failed.");
                  } finally {
                    event.target.value = "";
                  }
                }} />
                <small>JPG, PNG or WEBP. Maximum size: 5 MB.</small>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="modal-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="modal-save" disabled={saving}>
                  {saving ? "Saving..." : (editingProduct ? "Save Changes" : "Create Product")}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
