import React, { useEffect, useState } from "react";
import "./Home.css";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../services/image";
import Hero from "../components/Hero";

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileGridMode, setMobileGridMode] = useState("grid"); // "grid" (2 cols) or "single" (1 col)
  const [instantBuyingId, setInstantBuyingId] = useState(null);
  const [addingCartId, setAddingCartId] = useState(null);

  // Sort & Filter state
  const [sortBy, setSortBy] = useState("newest"); // "newest" (top of grid), "low-stock", "price-asc", "price-desc", "discount", "name-asc", "oldest"
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "scarcity", "sale"

  // Pinned to top IDs (persists in localStorage)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("pinnedPerfumes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api
      .get("/products/?sort=newest")
      .then((response) => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load products");
        setLoading(false);
      });
  }, []);

  const handleAddToCart = async (product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      alert(`Sorry, ${product.name} is currently out of stock.`);
      return;
    }

    try {
      setAddingCartId(product.id);
      await api.post("/cart/", {
        product_id: product.id,
        quantity: 1,
      });

      window.dispatchEvent(new Event("cartUpdated"));
      alert(`${product.name} added to cart!`);
    } catch (error) {
      alert(
        error.response?.data?.error || "Failed to add product to cart"
      );
    } finally {
      setAddingCartId(null);
    }
  };

  const handleInstantBuy = async (product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      alert(`Sorry, ${product.name} is currently out of stock.`);
      return;
    }

    try {
      setInstantBuyingId(product.id);
      try {
        await api.post("/cart/", {
          product_id: product.id,
          quantity: 1,
        });
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        // If already in cart at max stock, allow proceeding to checkout directly
        const errMsg = err.response?.data?.error || "";
        if (!errMsg.includes("Not enough stock")) {
          throw err;
        }
      }
      navigate("/checkout");
    } catch (error) {
      alert(
        error.response?.data?.error || "Failed to proceed to instant checkout"
      );
    } finally {
      setInstantBuyingId(null);
    }
  };

  const togglePinProduct = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds((prev) => {
      const isAlreadyPinned = prev.includes(productId);
      const next = isAlreadyPinned
        ? prev.filter((id) => id !== productId)
        : [productId, ...prev]; // Push to front
      try {
        localStorage.setItem("pinnedPerfumes", JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save pinned perfumes to localStorage", err);
      }
      return next;
    });
  };

  // Stock scarcity calculations
  const lowStockProducts = products.filter(
    (p) => p.stock !== undefined && p.stock > 0 && p.stock <= 3
  );
  const lowStockCount = lowStockProducts.length;

  // Sale items count
  const saleCount = products.filter(
    (p) => p.sale_price && p.sale_price < p.price
  ).length;

  // Filter products by category/scarcity
  const filteredProducts = products.filter((product) => {
    if (activeFilter === "scarcity") {
      return product.stock !== undefined && product.stock > 0 && product.stock <= 3;
    }
    if (activeFilter === "sale") {
      return Boolean(product.sale_price && product.sale_price < product.price);
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // 1. Pinned perfumes always sit at the very top of the grid
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // 2. Main sort option
    switch (sortBy) {
      case "newest":
        // Newest Added to the Top of the Grid
        return (b.id || 0) - (a.id || 0);

      case "oldest":
        return (a.id || 0) - (b.id || 0);

      case "low-stock":
        // Vault scarcity first: lowest stock > 0 first, then out of stock
        return (a.stock || 0) - (b.stock || 0);

      case "price-asc": {
        const priceA = a.sale_price || a.price;
        const priceB = b.sale_price || b.price;
        return priceA - priceB;
      }

      case "price-desc": {
        const priceA = a.sale_price || a.price;
        const priceB = b.sale_price || b.price;
        return priceB - priceA;
      }

      case "discount": {
        const discountA = a.sale_price ? a.price - a.sale_price : 0;
        const discountB = b.sale_price ? b.price - b.sale_price : 0;
        return discountB - discountA;
      }

      case "name-asc":
        return a.name.localeCompare(b.name);

      default:
        return (b.id || 0) - (a.id || 0);
    }
  });

  if (loading) {
    return (
      <div className="status">
        <h2>Loading products...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status error">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <main className="home">
      {/* ARABIC LUXURY HERO SECTION */}
      <Hero lowStockProducts={lowStockProducts} />

      {/* PRODUCTS SECTION */}
      <section className="products-section" id="collection">
        {/* VAULT SCARCITY STOCK ALERT BANNER */}
        {lowStockCount > 0 && (
          <aside className="vault-stock-alert-banner" role="alert" aria-label="Stock scarcity alert">
            <div className="alert-pulse-badge">
              <span className="pulse-dot" />
              <span>VAULT RESERVE ALERT</span>
            </div>

            <p className="alert-message">
              Small batch artisanal distillation. <strong>{lowStockCount} rare fragrance{lowStockCount > 1 ? "s" : ""}</strong> have 3 or fewer flacons remaining in vault.
            </p>

            <div className="alert-chips">
              {lowStockProducts.map((item) => (
                <span key={item.id} className="alert-chip">
                  ⚡ {item.name}: <strong>{item.stock} left</strong>
                </span>
              ))}
            </div>
          </aside>
        )}

        <div className="section-heading">
          <div>
            <span>OUR COLLECTION</span>
            <h2>Featured Fragrances</h2>
          </div>

          <div className="section-heading-meta">
            <p className="fragrance-count">
              {sortedProducts.length} fragrances available
              {pinnedIds.length > 0 && (
                <span className="pinned-count-tag">
                  ✦ {pinnedIds.length} pinned to top
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ====================================================================
            COLLECTION TOOLBAR: FILTER CHIPS, SORT SELECTOR & GRID VIEW
            ==================================================================== */}
        <div className="collection-toolbar">
          {/* FILTER CHIPS */}
          <div className="filter-chips-group" role="tablist" aria-label="Filter Fragrances">
            <button
              type="button"
              className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Elixirs ({products.length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === "scarcity" ? "active" : ""}`}
              onClick={() => setActiveFilter("scarcity")}
            >
              <span className="chip-fire-icon">⚡</span>
              <span>Vault Scarcity ({lowStockCount})</span>
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === "sale" ? "active" : ""}`}
              onClick={() => setActiveFilter("sale")}
            >
              <span className="chip-tag-icon">🏷️</span>
              <span>Special Offers ({saleCount})</span>
            </button>
          </div>

          {/* TOOLBAR CONTROLS (SORT & VIEW) */}
          <div className="toolbar-controls-right">
            {/* SORT SELECTOR */}
            <div className="sort-selector-box">
              <label htmlFor="grid-sort-select" className="sort-box-label">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M7 12h10M10 18h4" />
                </svg>
                <span>Sort:</span>
              </label>
              <select
                id="grid-sort-select"
                className="sort-box-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort Fragrances in Grid"
              >
                <option value="newest">✦ Newest Added (Top of Grid)</option>
                <option value="low-stock">⚡ Vault Scarcity (Low Stock First)</option>
                <option value="price-asc">₹ Price: Low to High</option>
                <option value="price-desc">₹ Price: High to Low</option>
                <option value="discount">🏷️ Highest Discount</option>
                <option value="name-asc">A → Z Alphabetical</option>
                <option value="oldest">Classic First (Oldest)</option>
              </select>
            </div>

            {/* MOBILE GRID VIEW TOGGLE */}
            <div className="mobile-view-toggle" role="group" aria-label="Product Layout">
              <button
                type="button"
                className={`view-toggle-btn ${mobileGridMode === "grid" ? "active" : ""}`}
                onClick={() => setMobileGridMode("grid")}
                title="Grid View (Fits 2 per row)"
                aria-label="2-column grid view"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zm0 10h8v8h-8zM3 13h8v8H3z" />
                </svg>
                <span>Grid</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${mobileGridMode === "single" ? "active" : ""}`}
                onClick={() => setMobileGridMode("single")}
                title="Single Card View"
                aria-label="Single card view"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M4 5h16v3H4zm0 6h16v3H4zm0 6h16v3H4z" />
                </svg>
                <span>Full</span>
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCT GRID - OPTIMIZED FOR MOBILE 2-COL GRID */}
        <div className={`product-grid ${mobileGridMode === "grid" ? "mobile-2-col" : "mobile-1-col"}`}>
          {sortedProducts.map((product) => {
            const isOutOfStock = product.stock !== undefined && product.stock <= 0;
            const isCriticalStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
            const isLowStock = product.stock !== undefined && product.stock > 3 && product.stock <= 7;
            const isPinned = pinnedIds.includes(product.id);

            return (
              <article className={`product-card ${isPinned ? "is-pinned" : ""}`} key={product.id}>
                {/* PRODUCT IMAGE */}
                <div className="product-image">
                  <Link
                    to={`/product/${product.id}`}
                    className="product-image-link"
                    title={`View details for ${product.name}`}
                  >
                    {product.image ? (
                      <img src={getImageUrl(product.image)} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="no-image">PERFUME</div>
                    )}
                  </Link>

                  <span className="category">{product.category.name}</span>

                  {/* PIN TO TOP BUTTON */}
                  <button
                    type="button"
                    className={`pin-badge-btn ${isPinned ? "pinned" : ""}`}
                    onClick={(e) => togglePinProduct(product.id, e)}
                    title={isPinned ? "Unpin from top" : "Pin this perfume to the top of the grid"}
                    aria-label={isPinned ? `Unpin ${product.name} from top` : `Pin ${product.name} to top of grid`}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{isPinned ? "Pinned" : "Pin"}</span>
                  </button>

                  {/* FLOATING STATUS BADGES */}
                  {isPinned ? (
                    <span className="stock-alert-badge pinned-gold">
                      ⭐ TOP OF GRID
                    </span>
                  ) : isOutOfStock ? (
                    <span className="stock-alert-badge sold-out">SOLD OUT</span>
                  ) : isCriticalStock ? (
                    <span className="stock-alert-badge critical">
                      <span className="badge-pulse-dot" /> ONLY {product.stock} LEFT
                    </span>
                  ) : isLowStock ? (
                    <span className="stock-alert-badge low">
                      LOW: {product.stock} LEFT
                    </span>
                  ) : null}
                </div>

                {/* PRODUCT INFORMATION */}
                <div className="product-info">
                  <div className="info-top-row">
                    <p className="product-category">{product.category.name}</p>

                    {/* LIVE STOCK MICRO STATUS */}
                    <div
                      className={`stock-status-pill ${
                        isOutOfStock
                          ? "out"
                          : isCriticalStock
                          ? "critical"
                          : isLowStock
                          ? "low"
                          : "in"
                      }`}
                      title={
                        isOutOfStock
                          ? "Sold Out"
                          : `Current stock: ${product.stock} flacons`
                      }
                    >
                      <span className="status-dot" />
                      <span className="status-text">
                        {isOutOfStock
                          ? "Out of stock"
                          : isCriticalStock
                          ? `Only ${product.stock} left`
                          : isLowStock
                          ? `${product.stock} left`
                          : "In Stock"}
                      </span>
                    </div>
                  </div>

                  <Link to={`/product/${product.id}`} className="product-title-link">
                    <h3>{product.name}</h3>
                  </Link>

                  <p className="description">{product.description}</p>

                  <div className="price-row">
                    <div className="prices-group">
                      {product.sale_price ? (
                        <>
                          <span className="old-price">₹{product.price}</span>
                          <span className="sale-price">₹{product.sale_price}</span>
                        </>
                      ) : (
                        <span className="price">₹{product.price}</span>
                      )}
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        className={`add-cart ${isOutOfStock ? "disabled" : ""}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock || addingCartId === product.id}
                        title={isOutOfStock ? "Currently Sold Out" : "Add to Cart"}
                      >
                        {isOutOfStock
                          ? "Sold Out"
                          : addingCartId === product.id
                          ? "Adding..."
                          : "+ Cart"}
                      </button>

                      <button
                        type="button"
                        className={`instant-buy-btn ${isOutOfStock ? "disabled" : ""}`}
                        onClick={() => handleInstantBuy(product)}
                        disabled={isOutOfStock || instantBuyingId === product.id}
                        title={
                          isOutOfStock
                            ? "Currently Sold Out"
                            : "Instant Buy — Proceed straight to checkout"
                        }
                      >
                        {instantBuyingId === product.id ? (
                          <span>Securing...</span>
                        ) : (
                          <>
                            <span className="bolt-icon" aria-hidden="true">⚡</span>
                            <span className="instant-text-full">Instant Buy</span>
                            <span className="instant-text-short">Buy Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Home;
