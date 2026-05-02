import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import Profile from "./pages/profile";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from 'react-router-dom';
import Event from "./pages/event";

import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function ProtectedRoute({ children, adminOnly = false }) {
    const location = useLocation();
    const token = localStorage.getItem('access_token');
    const { user, loading } = useAuth();

    if (loading) return <div>Đang tải...</div>;

    if (!token) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (adminOnly && user && !user.is_staff) {
      return <Navigate to="/" replace />
    }

    return children
  }

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home scrolled={scrolled} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/event" element={<Event />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;