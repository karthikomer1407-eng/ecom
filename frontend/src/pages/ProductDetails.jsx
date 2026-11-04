import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../services/image";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const response = await api.get(`/products/${id}`);

      setProduct(response.data);
    } catch (error) {
      console.error(error);

      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const [instantBuying, setInstantBuying] = useState(false);

  const handleAddToCart = async () => {
    try {
      await api.post("/cart/", {
        product_id: product.id,
        quantity: quantity,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert(`${product.name} added to cart!`);
    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to add product to cart"
      );
    }
  };

  const handleInstantBuy = async () => {
    if (!product || product.stock === 0) return;
    try {
      setInstantBuying(true);
      try {
        await api.post("/cart/", {
          product_id: product.id,
          quantity: quantity,
        });
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        const errMsg = err.response?.data?.error || "";
        if (!errMsg.includes("Not enough stock")) {
          throw err;
        }
      }
      navigate("/checkout");
    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to proceed to instant checkout"
      );
    } finally {
      setInstantBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-message">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-message">
        <h2>{error}</h2>

        <button onClick={() => navigate("/")}>
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <section className="product-details">

      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="product-details-container">

        {/* IMAGE */}

        <div className="details-image">

          {product.image ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
            />
          ) : (
            <div className="details-no-image">
              No Image
            </div>
          )}

        </div>

        {/* INFORMATION */}

        <div className="details-info">

          <p className="details-category">
            {product.category.name}
          </p>

          <h1>
            {product.name}
          </h1>

          <p className="details-description">
            {product.description}
          </p>

          <div className="details-price">

            {product.sale_price ? (
              <>
                <span className="details-sale-price">
                  ₹{product.sale_price}
                </span>

                <span className="details-original-price">
                  ₹{product.price}
                </span>
              </>
            ) : (
              <span className="details-sale-price">
                ₹{product.price}
              </span>
            )}

          </div>

          <p className="stock">

            {product.stock > 0
              ? `${product.stock} items available`
              : "Out of stock"}

          </p>

          {/* QUANTITY */}

          {product.stock > 0 && (
            <div className="quantity-section">

              <span>Quantity</span>

              <div className="quantity-control">

                <button onClick={decreaseQuantity}>
                  −
                </button>

                <span>
                  {quantity}
                </span>

                <button onClick={increaseQuantity}>
                  +
                </button>

              </div>

            </div>
          )}

          {/* CART & INSTANT BUY BUTTONS */}
          <div className="details-action-buttons">
            <button
              type="button"
              className="details-instant-buy-button"
              onClick={handleInstantBuy}
              disabled={product.stock === 0 || instantBuying}
            >
              {instantBuying
                ? "Securing..."
                : product.stock > 0
                ? "⚡ Instant Buy"
                : "Out of Stock"}
            </button>

            <button
              type="button"
              className="details-cart-button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock > 0
                ? "+ Add to Cart"
                : "Out of Stock"}
            </button>
          </div>

        </div>

      </div>

    </section>
  );
}

export default ProductDetails;
