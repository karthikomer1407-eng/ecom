import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import "./Orders.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

const trackingSteps = [
  { key: "pending", label: "Order Placed", description: "Payment verified and order secured." },
  { key: "processing", label: "Blending & Preparation", description: "Artisanal bottling, boxing, and inspection." },
  { key: "shipped", label: "Dispatched & In Transit", description: "Handed over to insured luxury courier." },
  { key: "delivered", label: "Delivered", description: "Safely delivered to your address." },
];

const statusStages = {
  pending: 0,
  placed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const FAQ_ITEMS = [
  {
    q: "How long does shipping take across India?",
    a: "Orders are prepared within 24 hours and delivered in 3 to 5 business days across India via our insured express courier partners.",
  },
  {
    q: "Can I update my delivery address or phone number?",
    a: "Yes! If your order is in 'Processing' status, contact our WhatsApp Concierge with your Order ID and we will update your destination immediately.",
  },
  {
    q: "What is your damaged or broken bottle guarantee?",
    a: "Every bottle is securely encased in luxury vault packaging. In the rare event of transit damage, share a photo with our Concierge with your Order ID for an immediate free replacement.",
  },
  {
    q: "Are the fragrances authentic and long-lasting?",
    a: "All Hayati Elixirs creations are crafted with high-concentration Extrait de Parfum oils sourced from Grasse and the Middle East, delivering 12-16 hours of projection.",
  },
];

export default function Orders() {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get("id");
  const isNewOrder = searchParams.get("new") === "true";

  // Search input states
  const [activeTab, setActiveTab] = useState("id"); // "id" or "contact"
  const [orderIdInput, setOrderIdInput] = useState(urlOrderId || "");
  const [emailInput, setEmailInput] = useState(() => localStorage.getItem("hayati_user_email") || "");
  const [phoneInput, setPhoneInput] = useState(() => localStorage.getItem("hayati_user_phone") || "");

  // Data states
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // Local device orders
  const [deviceOrders, setDeviceOrders] = useState([]);

  // Customer Support Form Modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccessTicket, setSupportSuccessTicket] = useState(null);
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderId: "",
    issueType: "Order Tracking & Status",
    message: "",
  });

  // FAQ accordion active item
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Load device orders from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hayati_my_orders") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        setDeviceOrders(saved);
        // Automatically sync recent orders from backend if available
        const ids = saved.map((o) => o.order_id).filter(Boolean);
        if (ids.length > 0 && !urlOrderId) {
          api
            .post("/orders/list", { order_ids: ids })
            .then((res) => {
              if (Array.isArray(res.data) && res.data.length > 0) {
                setOrdersList(res.data);
              }
            })
            .catch(() => {
              // Silently ignore background sync failures
            });
        }
      }
    } catch {
      // Ignore parse error
    }
  }, [urlOrderId]);

  // If URL has ?id=..., automatically track that order
  useEffect(() => {
    if (urlOrderId) {
      setOrderIdInput(urlOrderId);
      fetchSingleOrder(urlOrderId);
    }
  }, [urlOrderId]);

  // Fetch single order by ID
  const fetchSingleOrder = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/orders/track", {
        order_id: idToFetch,
      });
      setSelectedOrder(response.data);

      // Pre-fill support form details
      setSupportForm((prev) => ({
        ...prev,
        orderId: response.data.order_id,
        name: response.data.full_name || prev.name,
        email: response.data.email || prev.email,
        phone: response.data.phone || prev.phone,
      }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not locate Order #" + idToFetch + ". Please check the Order ID."
      );
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Search by Order ID
  const handleSearchById = (e) => {
    e.preventDefault();
    const clean = orderIdInput.trim().replace("#", "");
    if (!clean) {
      setError("Please enter a valid numeric Order ID (e.g. 4 or #4)");
      return;
    }
    fetchSingleOrder(clean);
  };

  // Search by Contact (Email or Phone)
  const handleSearchByContact = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() && !phoneInput.trim()) {
      setError("Please enter either your checkout email or phone number.");
      return;
    }
    setLoading(true);
    setError("");
    setSelectedOrder(null);

    try {
      const response = await api.post("/orders/list", {
        email: emailInput.trim(),
        phone: phoneInput.trim(),
      });
      setOrdersList(response.data);
      if (response.data.length === 1) {
        setSelectedOrder(response.data[0]);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No orders found matching the provided contact details."
      );
      setOrdersList([]);
    } finally {
      setLoading(false);
    }
  };

  // Copy Order ID to clipboard
  const handleCopyOrderId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(`#${id}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Open support modal with pre-filled context
  const handleOpenSupport = (targetOrderId = null) => {
    const activeId = targetOrderId || selectedOrder?.order_id || "";
    setSupportForm((prev) => ({
      ...prev,
      orderId: activeId ? `#${activeId}` : prev.orderId,
      name: selectedOrder?.full_name || prev.name,
      email: selectedOrder?.email || prev.email,
      phone: selectedOrder?.phone || prev.phone,
    }));
    setSupportSuccessTicket(null);
    setSupportModalOpen(true);
  };

  // Submit Support Ticket to backend
  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportForm.message.trim()) {
      alert("Please enter a short message describing what you need help with.");
      return;
    }
    setSupportSending(true);
    try {
      const res = await api.post("/orders/support", {
        order_id: supportForm.orderId,
        name: supportForm.name,
        email: supportForm.email,
        phone: supportForm.phone,
        subject: supportForm.issueType,
        message: supportForm.message,
      });
      setSupportSuccessTicket(res.data.ticket_id);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to submit support request. You can also message us directly on WhatsApp."
      );
    } finally {
      setSupportSending(false);
    }
  };

  // WhatsApp concierge pre-filled text
  const currentOrderId = selectedOrder?.order_id || urlOrderId || orderIdInput || "";
  const waMessage = currentOrderId
    ? encodeURIComponent(
        `Hello Hayati Elixirs Royal Concierge, I need assistance with my Order #${currentOrderId}.`
      )
    : encodeURIComponent(
        "Hello Hayati Elixirs Royal Concierge, I have an inquiry about an order."
      );
  const waLink = `https://wa.me/918606607343?text=${waMessage}`;
  const mailtoLink = `mailto:karthikomer1407@gmail.com?subject=${encodeURIComponent(
    currentOrderId ? `Support Request for Order #${currentOrderId}` : "Hayati Elixirs Support Request"
  )}`;

  // Stage calculation for tracker
  const normalizedStatus = (selectedOrder?.status || "pending").toLowerCase();
  const currentStage = statusStages[normalizedStatus] ?? 0;
  const isCancelled = normalizedStatus === "cancelled";

  return (
    <div className="orders-page">
      {/* HEADER SECTION */}
      <header className="orders-header">
        <p className="orders-eyebrow">HAYATI ELIXIRS · ROYAL ORDER CONCIERGE</p>
        <h1>My Orders & Order Care</h1>
        <p className="orders-subtitle">
          Look up your order IDs, live fulfillment milestones, fragrance receipts, and access dedicated 24/7 customer support.
        </p>
      </header>

      {/* NEW ORDER CELEBRATION BANNER */}
      {isNewOrder && selectedOrder && (
        <aside className="orders-celebration" aria-live="polite">
          <div className="celebration-icon">✨</div>
          <div className="celebration-text">
            <h3>Order Confirmed & Payment Verified!</h3>
            <p>
              Your royal order <strong>#{selectedOrder.order_id}</strong> has been secured. Our artisans have commenced bottling and bespoke packaging. A confirmation has been logged for your records.
            </p>
          </div>
          <button
            type="button"
            className="celebration-copy-btn"
            onClick={() => handleCopyOrderId(selectedOrder.order_id)}
          >
            {copiedId ? "Copied! ✓" : `Copy Order ID #${selectedOrder.order_id}`}
          </button>
        </aside>
      )}

      {/* MAIN CONTAINER */}
      <main className="orders-container">
        {/* LOOKUP CONTROLS CARD */}
        <section className="orders-search-card" aria-label="Find an order">
          <div className="search-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "id"}
              className={`search-tab ${activeTab === "id" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("id");
                setError("");
              }}
            >
              Search by Order ID
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "contact"}
              className={`search-tab ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("contact");
                setError("");
              }}
            >
              Search by Email / Phone
            </button>
          </div>

          {activeTab === "id" ? (
            <form className="orders-search-form" onSubmit={handleSearchById}>
              <div className="form-input-row">
                <div className="input-with-prefix">
                  <span className="input-hash">#</span>
                  <input
                    type="text"
                    id="order-id-input"
                    placeholder="Enter Order ID (e.g. 4)"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="orders-search-btn" disabled={loading}>
                  {loading ? "Searching..." : "View Order Details"}
                </button>
              </div>
              <p className="search-hint">
                Your Order ID is provided upon checkout and on your payment receipt (e.g. #4).
              </p>
            </form>
          ) : (
            <form className="orders-search-form" onSubmit={handleSearchByContact}>
              <div className="form-input-grid">
                <input
                  type="email"
                  placeholder="Checkout Email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Checkout Phone Number"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
                <button type="submit" className="orders-search-btn" disabled={loading}>
                  {loading ? "Locating..." : "Find My Orders"}
                </button>
              </div>
              <p className="search-hint">
                Enter either email or phone used at checkout to retrieve all orders placed on your account.
              </p>
            </form>
          )}

          {error && <div className="orders-error-alert" role="alert">{error}</div>}
        </section>

        {/* DEVICE RECENT ORDERS CAROUSEL (IF ANY EXIST & NO ORDER SELECTED YET) */}
        {!selectedOrder && deviceOrders.length > 0 && (
          <section className="device-orders-section" aria-label="Recent orders on this device">
            <div className="section-title-row">
              <h2>Recent Orders on This Device</h2>
              <span className="orders-badge">{deviceOrders.length} saved</span>
            </div>
            <div className="device-orders-grid">
              {deviceOrders.map((ord) => (
                <article className="device-order-card" key={ord.order_id}>
                  <div className="device-order-header">
                    <div>
                      <span className="device-order-label">ORDER ID</span>
                      <h3>#{ord.order_id}</h3>
                    </div>
                    <button
                      type="button"
                      className="mini-copy-btn"
                      onClick={() => handleCopyOrderId(ord.order_id)}
                      title="Copy Order ID"
                      aria-label={`Copy Order ID #${ord.order_id}`}
                    >
                      {copiedId ? "✓" : "📋"}
                    </button>
                  </div>
                  <p className="device-order-date">
                    {ord.date ? new Date(ord.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "Recent Purchase"}
                  </p>
                  <p className="device-order-customer">{ord.full_name || ord.email || "Royal Guest"}</p>
                  <div className="device-order-footer">
                    <strong>{formatCurrency(ord.total_amount)}</strong>
                    <button
                      type="button"
                      className="view-details-action"
                      onClick={() => fetchSingleOrder(ord.order_id)}
                    >
                      View Details ➔
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* LIST OF MULTIPLE FOUND ORDERS (IF CONTACT SEARCH RETURNED MULTIPLE) */}
        {!selectedOrder && ordersList.length > 1 && (
          <section className="orders-list-section" aria-label="Matching orders list">
            <h2>Matching Orders ({ordersList.length})</h2>
            <div className="device-orders-grid">
              {ordersList.map((ord) => (
                <article className="device-order-card" key={ord.order_id}>
                  <div className="device-order-header">
                    <div>
                      <span className="device-order-label">ORDER ID</span>
                      <h3>#{ord.order_id}</h3>
                    </div>
                    <span className={`status-pill pill-${ord.status.toLowerCase()}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="device-order-date">{ord.created_at}</p>
                  <p className="device-order-customer">{ord.full_name}</p>
                  <p className="device-order-items-snippet">
                    {ord.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(", ")}
                  </p>
                  <div className="device-order-footer">
                    <strong>{formatCurrency(ord.total_amount)}</strong>
                    <button
                      type="button"
                      className="view-details-action"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      Inspect Order ➔
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SELECTED ORDER FULL DETAILS VIEW */}
        {selectedOrder && (
          <article className="order-details-card" aria-label="Order summary details">
            {/* Top Toolbar */}
            <div className="order-details-topbar">
              <button
                type="button"
                className="back-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ← Back to Order Search
              </button>
              <div className="topbar-actions">
                <button
                  type="button"
                  className="print-receipt-btn"
                  onClick={() => window.print()}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  className="support-direct-btn"
                  onClick={() => handleOpenSupport(selectedOrder.order_id)}
                >
                  💬 Need Help with Order #{selectedOrder.order_id}?
                </button>
              </div>
            </div>

            {/* Order Identity & Status Banner */}
            <div className="order-meta-banner">
              <div className="order-id-block">
                <span className="banner-kicker">OFFICIAL ORDER RECEIPT</span>
                <div className="order-id-flex">
                  <h2>Order #{selectedOrder.order_id}</h2>
                  <button
                    type="button"
                    className="copy-badge-btn"
                    onClick={() => handleCopyOrderId(selectedOrder.order_id)}
                    aria-label={`Copy Order ID #${selectedOrder.order_id}`}
                  >
                    {copiedId ? "Copied to Clipboard! ✓" : "Copy ID 📋"}
                  </button>
                </div>
                <p className="order-timestamp">
                  Placed on {selectedOrder.created_at || "Recent"} · Payment:{" "}
                  <strong className="payment-highlight">{selectedOrder.payment_status}</strong>
                  {selectedOrder.razorpay_payment_id && (
                    <span className="razorpay-ref"> (Ref: {selectedOrder.razorpay_payment_id})</span>
                  )}
                </p>
              </div>

              <div className="order-status-block">
                <span className="status-label">STATUS</span>
                <span className={`status-pill pill-${normalizedStatus}`}>
                  <span className="status-dot" />
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Visual 4-Stage Progress Timeline */}
            {!isCancelled ? (
              <div className="order-timeline-card">
                <h3>Fulfillment Milestones</h3>
                <ol className="timeline-stages" aria-label="Fulfillment stages">
                  {trackingSteps.map((step, idx) => {
                    const isPassed = idx <= currentStage;
                    const isCurrent = idx === currentStage;
                    return (
                      <li
                        key={step.key}
                        className={`timeline-step ${isPassed ? "completed" : ""} ${
                          isCurrent ? "current" : ""
                        }`}
                      >
                        <div className="step-marker" aria-hidden="true">
                          {isPassed ? "✓" : idx + 1}
                        </div>
                        <div className="step-info">
                          <strong>{step.label}</strong>
                          <p>{step.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <div className="cancelled-banner">
                ⚠️ This order was cancelled. If you believe this is in error or require a refund status update, please contact our Royal Concierge below.
              </div>
            )}

            {/* Items Breakdown & Delivery Info 2-Column Grid */}
            <div className="order-specs-grid">
              {/* Items Card */}
              <div className="order-items-pane">
                <h3>Fragrance Selections</h3>
                <div className="items-table">
                  {selectedOrder.items?.map((item, idx) => (
                    <div className="item-row" key={`${item.product_name}-${idx}`}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="item-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="item-thumb-placeholder">💎</div>
                      )}
                      <div className="item-info">
                        <p className="item-title">{item.product_name}</p>
                        <p className="item-quantity">
                          Qty: <strong>{item.quantity}</strong> × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-cost-breakdown">
                  <div className="cost-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="cost-row">
                    <span>Luxury Insured Shipping</span>
                    <span className="free-shipping">COMPLIMENTARY</span>
                  </div>
                  <div className="cost-row cost-total">
                    <strong>Grand Total</strong>
                    <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Details Card */}
              <div className="order-delivery-pane">
                <h3>Delivery & Contact Details</h3>
                <div className="delivery-details-list">
                  <div className="detail-field">
                    <span className="field-label">Recipient</span>
                    <span className="field-value">{selectedOrder.full_name}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Shipping Address</span>
                    <span className="field-value">{selectedOrder.address}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Phone</span>
                    <span className="field-value">{selectedOrder.phone}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Email</span>
                    <span className="field-value">{selectedOrder.email}</span>
                  </div>
                  {selectedOrder.razorpay_order_id && (
                    <div className="detail-field">
                      <span className="field-label">Gateway Order ID</span>
                      <span className="field-value font-mono">
                        {selectedOrder.razorpay_order_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Assistance Box */}
                <div className="order-help-callout">
                  <h4>Need to alter this order?</h4>
                  <p>
                    Reach out immediately with Order <strong>#{selectedOrder.order_id}</strong> via WhatsApp (+91 8606607343) or email (karthikomer1407@gmail.com) to modify delivery instructions before departure.
                  </p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="callout-wa-link"
                  >
                    Chat with Concierge about #{selectedOrder.order_id} ➔
                  </a>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* 24/7 CUSTOMER SUPPORT & CONCIERGE HUB */}
        <section className="support-hub-section" aria-label="Customer support and concierge">
          <div className="support-hub-header">
            <span className="support-kicker">AT YOUR SERVICE</span>
            <h2>Royal Customer Support</h2>
            <p>
              Every fragrance is an intimate journey. Whether you need an update on your Order ID, express delivery changes, or bottle guidance, our private concierge is available 24/7.
            </p>
          </div>

          <div className="support-channels-grid">
            {/* WhatsApp Card */}
            <div className="support-channel-card highlight-channel">
              <div className="channel-badge">FASTEST RESPONSE</div>
              <div className="channel-icon">💬</div>
              <h3>WhatsApp Concierge</h3>
              <p>Instant 1-on-1 assistance with our Royal fragrance desk. Pre-loaded with your Order details.</p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="channel-action-btn wa-action"
              >
                Chat on WhatsApp ➔
              </a>
              <span className="channel-note">+91 8606607343 · Replies within 5–15 minutes</span>
            </div>

            {/* Email Support Card */}
            <div className="support-channel-card">
              <div className="channel-icon">✉️</div>
              <h3>Direct Email Desk</h3>
              <p>Send an official inquiry with your order receipt, invoice questions, or custom requests.</p>
              <a href={mailtoLink} className="channel-action-btn email-action">
                Email Support ➔
              </a>
              <span className="channel-note">karthikomer1407@gmail.com</span>
            </div>

            {/* In-App Ticket Card */}
            <div className="support-channel-card">
              <div className="channel-icon">🎫</div>
              <h3>Submit Support Inquiry</h3>
              <p>Create an official order ticket. Our support artisans will review and notify you immediately.</p>
              <button
                type="button"
                className="channel-action-btn ticket-action"
                onClick={() => handleOpenSupport()}
              >
                Open Inquiry Ticket ➔
              </button>
              <span className="channel-note">Generates a verified tracking ticket ID</span>
            </div>
          </div>

          {/* FAQ ACCORDION */}
          <div className="faq-container">
            <h3 className="faq-heading">Frequently Asked Questions</h3>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.q}>
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="faq-chevron">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && <div className="faq-answer">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* SUPPORT INQUIRY MODAL */}
      {supportModalOpen && (
        <div className="support-modal-overlay" role="dialog" aria-modal="true">
          <div className="support-modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-kicker">PRIORITY INQUIRY</span>
                <h3>Hayati Customer Care Desk</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSupportModalOpen(false)}
                aria-label="Close support dialog"
              >
                ✕
              </button>
            </div>

            {supportSuccessTicket ? (
              <div className="modal-ticket-success">
                <div className="ticket-success-icon">✓</div>
                <h4>Inquiry Successfully Registered</h4>
                <div className="ticket-id-display">
                  <span>YOUR TICKET ID</span>
                  <strong>{supportSuccessTicket}</strong>
                </div>
                <p>
                  Our Royal Concierge has received your message regarding{" "}
                  <strong>{supportForm.orderId || "your inquiry"}</strong>. A fragrance specialist will reach out to you via WhatsApp or Email promptly.
                </p>
                <div className="modal-success-actions">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-wa-btn"
                  >
                    Speed up via WhatsApp
                  </a>
                  <button
                    type="button"
                    className="modal-done-btn"
                    onClick={() => setSupportModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form className="support-modal-form" onSubmit={handleSubmitSupport}>
                <div className="modal-field-grid">
                  <div className="modal-field">
                    <label htmlFor="sup-order-id">Order ID (if applicable)</label>
                    <input
                      id="sup-order-id"
                      type="text"
                      placeholder="e.g. #4"
                      value={supportForm.orderId}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, orderId: e.target.value })
                      }
                    />
                  </div>

                  <div className="modal-field">
                    <label htmlFor="sup-issue-type">Topic</label>
                    <select
                      id="sup-issue-type"
                      value={supportForm.issueType}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, issueType: e.target.value })
                      }
                    >
                      <option value="Order Tracking & Status">Order Tracking & Status</option>
                      <option value="Change Delivery Address">Change Delivery Address</option>
                      <option value="Damaged or Broken Item Guarantee">
                        Damaged or Broken Item Guarantee
                      </option>
                      <option value="Payment Verification & Invoice">
                        Payment Verification & Invoice
                      </option>
                      <option value="Fragrance Consultation & Returns">
                        Fragrance Consultation & Returns
                      </option>
                      <option value="Other Question">Other Question</option>
                    </select>
                  </div>
                </div>

                <div className="modal-field-grid">
                  <div className="modal-field">
                    <label htmlFor="sup-name">Your Full Name</label>
                    <input
                      id="sup-name"
                      type="text"
                      placeholder="e.g. Omar Khan"
                      value={supportForm.name}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="modal-field">
                    <label htmlFor="sup-phone">WhatsApp / Phone</label>
                    <input
                      id="sup-phone"
                      type="tel"
                      placeholder="e.g. 8606607343"
                      value={supportForm.phone}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label htmlFor="sup-email">Email Address</label>
                  <input
                    id="sup-email"
                    type="email"
                    placeholder="e.g. you@example.com"
                    value={supportForm.email}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="sup-message">How can our concierge assist you?</label>
                  <textarea
                    id="sup-message"
                    rows={4}
                    placeholder="Provide any details about your order, delivery questions, or address changes..."
                    value={supportForm.message}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, message: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setSupportModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={supportSending}
                  >
                    {supportSending ? "Submitting Ticket..." : "Submit Support Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
