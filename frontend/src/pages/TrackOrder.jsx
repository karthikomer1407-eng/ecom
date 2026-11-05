import { useState } from "react";
import api from "../services/api";
import "./TrackOrder.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

const trackingSteps = [
  { key: "placed", label: "Order placed", description: "We received your order." },
  { key: "processing", label: "Processing", description: "Your order is being prepared." },
  { key: "shipped", label: "Shipped", description: "Your order is on its way." },
  { key: "delivered", label: "Delivered", description: "Your order has arrived." },
];

const statusStages = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function TrackOrder() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrders([]);
    setSelectedOrder(null);
    setOrderFilter("all");

    try {
      const response = await api.post("/orders/list", {
        email,
        phone,
      });
      setOrders(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "We could not look up your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (orderId) => {
    setTrackingOrderId(orderId);
    setSelectedOrder(null);
    setError("");

    try {
      const response = await api.post("/orders/track", {
        order_id: orderId,
        email,
        phone,
      });
      setSelectedOrder(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "We could not load tracking for this order. Please try again."
      );
    } finally {
      setTrackingOrderId(null);
    }
  };

  const normalizedStatus = selectedOrder?.status?.toLowerCase();
  const currentStage = statusStages[normalizedStatus] ?? -1;
  const isCancelled = normalizedStatus === "cancelled";
  const confirmedOrders = orders.filter(
    (order) =>
      order.payment_status === "Paid" &&
      !["Delivered", "Cancelled"].includes(order.status)
  );
  const finishedOrders = orders.filter((order) => order.status === "Delivered");
  const visibleOrders =
    orderFilter === "confirmed"
      ? confirmedOrders
      : orderFilter === "finished"
        ? finishedOrders
        : orders;

  return (
    <section className="tracking-page">
      <div className="tracking-heading">
        <p className="tracking-eyebrow">HAYATI ELIXIRS / ORDER CARE</p>
        <h1>Your orders</h1>
        <p>Find your order list and IDs with the contact details used at checkout.</p>
      </div>

      <div className="tracking-card">
        <form className="tracking-form" onSubmit={handleSubmit}>
          <label htmlFor="tracking-email">Checkout email</label>
          <input
            id="tracking-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="tracking-phone">Checkout phone number</label>
          <input
            id="tracking-phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone number used for the order"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Finding orders..." : "Find my orders"}
          </button>
          <p className="tracking-form-note">
            We use both details to show only orders placed with your contact information.
          </p>
        </form>

        <div className="tracking-content">
        {error && <p className="tracking-error tracking-feedback" role="alert">{error}</p>}

        {orders.length > 0 ? (
          <div className="customer-orders">
            <h2>Your order list <span>{visibleOrders.length}</span></h2>
            <div className="customer-order-filters" role="tablist" aria-label="Your order lists">
              {[
                { key: "all", label: "All", count: orders.length },
                { key: "confirmed", label: "Confirmed", count: confirmedOrders.length },
                { key: "finished", label: "Finished", count: finishedOrders.length },
              ].map((filter) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={orderFilter === filter.key}
                  className={orderFilter === filter.key ? "active" : ""}
                  key={filter.key}
                  onClick={() => {
                    setOrderFilter(filter.key);
                    setSelectedOrder(null);
                  }}
                >
                  {filter.label} <span>{filter.count}</span>
                </button>
              ))}
            </div>
            <p className="customer-order-definition">
              Confirmed orders are paid and still in progress. Finished orders have been delivered.
            </p>
            {visibleOrders.length > 0 ? (
              <div className="customer-order-list">
              {visibleOrders.map((customerOrder) => (
                <article className="customer-order-card" key={customerOrder.order_id}>
                  <div className="customer-order-topline">
                    <div>
                      <span className="tracking-result-label">ORDER ID</span>
                      <h3>#{customerOrder.order_id}</h3>
                    </div>
                    <span className={`tracking-status status-${customerOrder.status.toLowerCase()}`}>
                      {customerOrder.status}
                    </span>
                  </div>
                  <p className="customer-order-meta">
                    {customerOrder.created_at || "Date unavailable"} - Payment {customerOrder.payment_status}
                  </p>
                  <p className="customer-order-items">
                    {customerOrder.items.map((item) => `${item.quantity} x ${item.product_name}`).join(", ")}
                  </p>
                  <div className="customer-order-bottomline">
                    <strong>{formatCurrency(customerOrder.total_amount)}</strong>
                    <button
                      type="button"
                      className="customer-order-track-button"
                      disabled={trackingOrderId === customerOrder.order_id}
                      onClick={() => handleTrackOrder(customerOrder.order_id)}
                    >
                      {trackingOrderId === customerOrder.order_id ? "Loading..." : "View progress"}
                    </button>
                  </div>
                </article>
              ))}
              </div>
            ) : (
              <p className="customer-orders-empty">
                No {orderFilter} orders yet.
              </p>
            )}
          </div>
        ) : (
          !loading && !error && (
            <div className="tracking-empty-state">
              <span className="tracking-empty-mark" aria-hidden="true">H</span>
              <h2>Order progress, all in one place</h2>
              <p>Enter your checkout email and phone number to see your order IDs and latest updates.</p>
            </div>
          )
        )}

        {selectedOrder && (
          <div className="tracking-result" aria-live="polite">
            <div className="tracking-result-header">
              <div>
                <span className="tracking-result-label">ORDER</span>
                <h2>#{selectedOrder.order_id}</h2>
              </div>
              <span className={`tracking-status status-${normalizedStatus}`}>
                {selectedOrder.status}
              </span>
            </div>

            <p className="tracking-date">
              Placed {selectedOrder.created_at || "date unavailable"} - Payment {selectedOrder.payment_status}
            </p>

            {isCancelled ? (
              <div className="tracking-cancelled">
                This order was cancelled. Please contact us if you need help.
              </div>
            ) : (
              <ol className="tracking-timeline" aria-label="Order progress">
                {trackingSteps.map((step, index) => {
                  const complete = index <= currentStage;
                  const active = index === currentStage;
                  return (
                    <li
                      className={`tracking-step${complete ? " is-complete" : ""}${active ? " is-active" : ""}`}
                      key={step.key}
                    >
                      <span className="tracking-step-marker" aria-hidden="true">
                        {complete ? "\u2713" : index + 1}
                      </span>
                      <div>
                        <strong>{step.label}</strong>
                        <span>{step.description}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="tracking-items">
              <h3>Items in this order</h3>
              {selectedOrder.items.map((item, index) => (
                <div className="tracking-item" key={`${item.product_name}-${index}`}>
                  <span>{item.quantity} x {item.product_name}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="tracking-total">
                <strong>Total</strong>
                <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

export default TrackOrder;
