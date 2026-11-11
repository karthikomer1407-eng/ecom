import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Footer from "./components/Footer";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/AdminLogin";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import Orders from "./pages/Orders";

function ProtectedRoute({ children }) {
  return sessionStorage.getItem("adminToken")
    ? children
    : <Navigate to="/admin/login" replace />;
}

function AdminSessionManager() {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");

    if (!isAdminRoute) {
      sessionStorage.removeItem("adminToken");
      localStorage.removeItem("adminToken");
    }
  }, [location.pathname]);

  return null;
}

function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return (
    <>
      {showPreloader && (
        <Preloader onComplete={handlePreloaderComplete} />
      )}
      <BrowserRouter>
        <AdminSessionManager />
        <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/product/:id" element={<ProductDetails />} />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track-order" element={<Orders />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
    </>
  );
}

export default App;
