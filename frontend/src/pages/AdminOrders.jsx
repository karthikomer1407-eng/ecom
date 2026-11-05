import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./AdminProducts.css"; // Reusing the layout styles
import "./AdminOrders.css";   // Unique styles for orders

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/orders/");
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      // Update the UI locally to feel instant
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch {
      alert("Failed to update status");
    }
  };

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const revenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
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

  if (loading) {
    return <div className="admin-loading">Loading orders...</div>;
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
          <Link to="/admin/products" className="admin-nav-item">
            <span>◈</span> Products
          </Link>
          <Link to="/" className="admin-nav-item">
            <span>⌂</span> Store
          </Link>
          <Link to="/admin/orders" className="admin-nav-item active">
            <span>▢</span> Orders
          </Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">HAYATI ELIXIRS / ADMIN</p>
            <h1>Orders</h1>
            <p className="admin-subtitle">Manage customer orders and shipping status.</p>
          </div>
        </header>

        {/* STATS */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">▢</div>
            <div><span>Total Orders</span><strong>{orders.length}</strong></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{color: '#b5574e'}}>!</div>
            <div><span>Pending Orders</span><strong>{pendingCount}</strong></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{color: '#4c805c'}}>$</div>
            <div><span>Total Revenue</span><strong>{formatCurrency(revenue)}</strong></div>
          </div>
        </section>

        {/* ORDERS LIST */}
        <section className="admin-products-section">
          <div className="products-section-header">
            <div>
              <h2>Order History</h2>
            </div>
            <button className="refresh-button" onClick={fetchOrders}>↻ Refresh</button>
          </div>

          <div className="admin-order-filters" role="tablist" aria-label="Order lists">
            {[
              { key: "all", label: "All Orders", count: orders.length },
              { key: "confirmed", label: "Confirmed", count: confirmedOrders.length },
              { key: "finished", label: "Finished", count: finishedOrders.length },
            ].map((filter) => (
              <button
                type="button"
                role="tab"
                aria-selected={orderFilter === filter.key}
                className={orderFilter === filter.key ? "active" : ""}
                key={filter.key}
                onClick={() => setOrderFilter(filter.key)}
              >
                {filter.label} <span>{filter.count}</span>
              </button>
            ))}
          </div>
          <p className="admin-order-filter-note">
            Confirmed means payment received and not yet delivered. Finished means delivered.
          </p>

          {error ? (
            <div className="admin-error"><p>{error}</p></div>
          ) : (
            <div className="admin-order-list">
              {visibleOrders.length === 0 && (
                <div className="admin-empty">
                  <h3>{orders.length === 0 ? "No orders yet" : "No orders in this list"}</h3>
                </div>
              )}

              {visibleOrders.map((order) => (
                <article className="admin-order-card" key={order.id}>
                  <div className="order-header">
                    <div className="order-id-date">
                      <h3>Order #{order.id}</h3>
                      <span>{order.created_at}</span>
                    </div>
                    <div className="order-status-wrap">
                      <select 
                        className={`status-select status-${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="order-details-grid">
                    <div className="customer-info">
                      <h4>Customer Details</h4>
                      <p><strong>{order.full_name}</strong></p>
                      <p>{order.email}</p>
                      <p>{order.phone}</p>
                      <p className="order-payment-status">Payment: {order.payment_status}</p>
                      <p className="order-address">{order.address}</p>
                    </div>

                    <div className="order-items-list">
                      <h4>Items Ordered</h4>
                      {order.items.map(item => (
                        <div className="order-item-row" key={item.id}>
                          <span>{item.quantity}x {item.product_name}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="order-total-row">
                        <strong>Grand Total</strong>
                        <strong>{formatCurrency(order.total_amount)}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminOrders;
