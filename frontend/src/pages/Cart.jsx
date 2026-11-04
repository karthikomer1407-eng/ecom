import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../services/image";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const response = await api.get("/cart/");
      setCart(response.data);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    try {
      const response = await api.put(
        `/cart/items/${itemId}`,
        {
          quantity,
        }
      );

      setCart(response.data.cart);
      window.dispatchEvent(
  new Event("cartUpdated")
);
    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to update cart"
      );
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await api.delete(
        `/cart/items/${itemId}`
      );

      setCart(response.data.cart);
      window.dispatchEvent(
  new Event("cartUpdated")
);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="page-message">
        Loading cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h1>Your Cart Is Empty</h1>

        <p>
          Looks like you haven't added anything yet.
        </p>

        <button onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <section className="cart-page">

      <div className="cart-header">
        <p>YOUR SHOPPING BAG</p>
        <h1>Shopping Cart</h1>
      </div>

      <div className="cart-container">

        <div className="cart-items">

          {cart.items.map((item) => {

            const currentPrice =
              item.sale_price ?? item.price;

            return (
              <div
                className="cart-item"
                key={item.id}
              >

                <div
                  className="cart-item-image"
                  onClick={() =>
                    navigate(
                      `/product/${item.product_id}`
                    )
                  }
                >
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                    />
                  ) : (
                    <div>No Image</div>
                  )}
                </div>

                <div className="cart-item-info">

                  <p className="cart-item-category">
                    PRODUCT
                  </p>

                  <h2>{item.name}</h2>

                  <p>{formatCurrency(currentPrice)}</p>

                  <div className="cart-item-actions">

                    <div className="cart-quantity">

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          item.quantity >= item.stock
                        }
                      >
                        +
                      </button>

                    </div>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

                <div className="cart-item-total">
                  {formatCurrency(item.item_total)}
                </div>

              </div>
            );
          })}

        </div>

        <div className="cart-summary">

          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>

          <button
            className="checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

          <button
            className="continue-shopping"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>

        </div>

      </div>

    </section>
  );
}

export default Cart;
