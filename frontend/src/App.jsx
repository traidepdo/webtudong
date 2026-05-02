import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import Profile from "./pages/profile";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from 'react-router-dom';
import Event from "./pages/event";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import HomeAdmin from "./pages/admin/Homeadmin";
import CategoryAdmin from "./pages/admin/Category";
import ProductAdmin from "./pages/admin/Product";
import EditProduct from "./pages/admin/EditProduct";
import CreateProduct from "./pages/admin/CreateProduct";

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

    if (loading) return <div className="loading-screen">Đang tải...</div>;

    if (!token) {
      // Nếu là route admin thì chuyển về trang login admin, ngược lại chuyển về login user
      const loginPath = adminOnly ? "/admin/login" : "/login";
      return <Navigate to={loginPath} state={{ from: location }} replace />
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
            {/* User Routes */}
            <Route path="/" element={<Home scrolled={scrolled} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/event" element={<Event />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/homeadmin" element={
              <ProtectedRoute adminOnly={true}>
                <HomeAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute adminOnly={true}>
                <CategoryAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/product" element={
              <ProtectedRoute adminOnly={true}>
                <ProductAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/product/create" element={
              <ProtectedRoute adminOnly={true}>
                <CreateProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/product/:slug" element={
              <ProtectedRoute adminOnly={true}>
                <EditProduct />
              </ProtectedRoute>
            } />
          </Routes>

        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;