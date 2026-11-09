
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useSmoothScroll } from "../components/SmoothScroll";
import "./AdminCategories.css";

export default function AdminCategories() {
  const lenisRef = useSmoothScroll();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      setError("");
      const response = await api.get("/categories/");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name,
        description: form.description.trim() || null,
      };

      if (editingId !== null) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post("/categories/", payload);
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not save the category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setError("");
    if (lenisRef?.current) {
      lenisRef.current.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"? Products may depend on this category.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/categories/${category.id}`);
      await fetchCategories();

      if (editingId === category.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not delete this category. Check whether products use it."
      );
    }
  };

  return (
    <div className="category-admin">
      <aside className="category-sidebar">
        <Link to="/admin/products" className="category-brand">
          <span className="category-brand-mark">H</span>
          <span>
            <strong>Hayati</strong>
            <small>ELIXIRS</small>
          </span>
        </Link>

        <p className="category-nav-label">MANAGEMENT</p>

        <Link to="/admin/products" className="category-nav-link">
          ◈ Products
        </Link>

        <Link
          to="/admin/categories"
          className="category-nav-link active"
        >
          ◇ Categories
        </Link>

        <Link to="/" className="category-nav-link">
          ⌂ Store
        </Link>
      </aside>

      <main className="category-main">
        <header className="category-header">
          <div>
            <p className="category-eyebrow">
              HAYATI ELIXIRS / ADMIN
            </p>
            <h1>Categories</h1>
            <p>Organize your fragrance collection.</p>
          </div>

          <Link to="/admin/products" className="category-back-link">
            View Products →
          </Link>
        </header>

        {error && (
          <div className="category-error" role="alert">
            {error}
          </div>
        )}

        <section className="category-summary">
          <span>Total Categories</span>
          <strong>{categories.length}</strong>
        </section>

        <section className="category-workspace">
          <form
            className="category-form"
            onSubmit={handleSubmit}
          >
            <p className="category-eyebrow">
              {editingId !== null ? "EDIT CATEGORY" : "NEW CATEGORY"}
            </p>

            <h2>
              {editingId !== null
                ? "Update Category"
                : "Create Category"}
            </h2>

            <label htmlFor="category-name">Category Name</label>
            <input
              id="category-name"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Oud Collection"
              maxLength={100}
              required
            />

            <label htmlFor="category-description">
              Description
            </label>
            <textarea
              id="category-description"
              name="description"
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              placeholder="Describe this fragrance collection..."
              rows={4}
            />

            <div className="category-form-actions">
              <button
                type="submit"
                disabled={saving}
                className="category-primary-button"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Save Changes"
                  : "Create Category"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="category-cancel-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="category-list-panel">
            <div className="category-list-heading">
              <div>
                <p className="category-eyebrow">YOUR COLLECTION</p>
                <h2>All Categories</h2>
              </div>

              <button
                type="button"
                className="category-refresh-button"
                onClick={fetchCategories}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p className="category-empty">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="category-empty">
                No categories yet. Create your first collection.
              </p>
            ) : (
              <div className="category-list">
                {categories.map((category) => (
                  <article
                    className="category-card"
                    key={category.id}
                  >
                    <div className="category-card-icon">◇</div>

                    <div className="category-card-info">
                      <h3>{category.name}</h3>
                      <p>
                        {category.description ||
                          "No description added yet."}
                      </p>
                      <small>CATEGORY #{category.id}</small>
                    </div>

                    <div className="category-card-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="category-delete-button"
                        onClick={() => handleDelete(category)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
