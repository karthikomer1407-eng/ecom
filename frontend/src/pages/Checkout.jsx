import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../services/image";
import "./Checkout.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get("/cart/");
        setCart(response.data);
      } catch (error) {
        console.error("Failed to load cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (placingOrder) return;

    setPlacingOrder(true);

    try {
      // 1. Load Razorpay Checkout.
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Could not load Razorpay. Check your internet connection.");
      }

      // 2. Ask Flask to create a pending order.
      const orderResponse = await api.post(
        "/orders/create-payment-order",
        { shipping: formData }
      );

      const paymentOrder = orderResponse.data;

      // 3. Open Razorpay Checkout.
      const rawPhone = (formData.phone || "").replace(/\D/g, "");
      const sanitizedPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";

      const prefillData = {
        name: formData.fullName?.trim() || "",
        email: formData.email?.trim() || "",
      };
      if (sanitizedPhone) {
        prefillData.contact = sanitizedPhone;
      }

      const options = {
        key: paymentOrder.key_id || paymentOrder.razorpay_key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "Hayati Elixirs",
        description: "Royal Arabian Fragrances Order",
        order_id: paymentOrder.order_id,

        prefill: prefillData,

        theme: {
          color: "#d4af37",
        },

        handler: async function (paymentResponse) {
          setPlacingOrder(true);

          try {
            // 4. Ask Flask to verify the payment.
            const verificationResponse = await api.post(
              "/orders/verify-payment",
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }
            );

            window.dispatchEvent(new Event("cartUpdated"));

            if (verificationResponse.data.stock_issue) {
              alert(
                "Payment succeeded, but some items are no longer available. " +
                  "Please contact support with order ID #" +
                  verificationResponse.data.order_id
              );
            } else {
              alert(
                "Payment successful! Order ID: #" +
                  verificationResponse.data.order_id
              );
            }

            navigate("/");
          } catch (error) {
            console.error("Payment verification failed:", error);

            alert(
              error.response?.data?.error ||
                "We couldn't confirm your payment. Please contact support and do not pay again until the payment status is checked."
            );
          } finally {
            setPlacingOrder(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        const err = response.error || {};
        console.error("Razorpay payment failed details:", {
          code: err.code,
          description: err.description,
          source: err.source,
          step: err.step,
          reason: err.reason,
          metadata: err.metadata,
        });

        const reasonMsg = err.reason ? `\nReason: ${err.reason}` : "";
        const descMsg = err.description || "The transaction was declined.";

        if (descMsg.toLowerCase().includes("registered website") || (err.reason && err.reason.includes("risk_check"))) {
          alert(
            `Payment Blocked by Razorpay Risk Protection:\n\n${descMsg}\n\nTo allow payments from your new domain, please add your domain in:\nRazorpay Dashboard -> Account & Settings -> Website and App Settings.`
          );
        } else {
          alert(`Payment Failed: ${descMsg}${reasonMsg}`);
        }

        setPlacingOrder(false);
      });

      razorpay.open();
      setPlacingOrder(false);
    } catch (error) {
      console.error("Could not start payment:", error);
      console.error(
        "Payment API response:",
        error.response?.status,
        JSON.stringify(error.response?.data)
      );

      alert(
        error.response?.data?.error ||
          error.message ||
          "Could not start payment. Please try again."
      );

      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="checkout-message">Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-message">
        <h2>Your cart is empty</h2>
        <p>You need to add items to your cart before checking out.</p>
        <button onClick={() => navigate("/")} className="return-button">
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <p>SECURE CHECKOUT</p>
        <h1>Complete Your Order</h1>
      </div>

      <div className="checkout-container">
        
        {/* LEFT SIDE: SHIPPING FORM */}
        <div className="checkout-form-section">
          <h2>Shipping Information</h2>
          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <textarea name="address" rows="3" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City / District</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Postal Code / PIN</label>
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
              </div>
            </div>

          </form>
        </div>

        {/* RIGHT SIDE: ORDER SUMMARY */}
        <div className="checkout-summary-section">
          <h2>Order Summary</h2>
          
          <div className="summary-items">
            {cart.items.map((item) => (
              <div className="summary-item" key={item.id}>
                <div className="summary-item-image">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} />
                  ) : (
                    <div className="placeholder-img">No Img</div>
                  )}
                  <span className="item-badge">{item.quantity}</span>
                </div>
                <div className="summary-item-info">
                  <h4>{item.name}</h4>
                  <p>{formatCurrency(item.sale_price ?? item.price)}</p>
                </div>
                <div className="summary-item-total">
                  {formatCurrency(item.item_total)}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="totals-divider"></div>
            <div className="totals-row grand-total">
              <span>Total</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="checkout-form" 
            className="place-order-button"
            disabled={placingOrder || loading || !cart?.items?.length}
          >
            {placingOrder ? "Processing..." : "Pay Now"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Checkout;
