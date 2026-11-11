import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchCartCount = async () => {
    try {
      const response = await api.get("/cart/");

      const items = response.data.items || [];

      const count = items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      setCartCount(count);
    } catch (error) {
      console.error(
        "Failed to fetch cart count:",
        error
      );
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener(
      "cartUpdated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdate
      );
    };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Hayati Elixirs
      </Link>

      <div
        className={`nav-links ${isMobileMenuOpen ? "is-open" : ""}`}
        id="primary-navigation"
        aria-label="Main navigation"
      >
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        <Link to="/#collection" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
        <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>Cart</Link>
        <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
        <Link to="/admin/products" onClick={() => setIsMobileMenuOpen(false)}>Admin</Link>
      </div>

      <div className="nav-actions">
        <button
          type="button"
          className="navbar-cart"
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigate("/cart");
          }}
          aria-label={`Cart, ${cartCount} items`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="cart-count">{cartCount}</span>
          )}
        </button>
        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="primary-navigation"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {isMobileMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
