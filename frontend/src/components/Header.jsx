import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import "../styles/Header.css";

function Header({ scrolled }) {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [category, setcategory] = useState([])
    useEffect(() => {
        const fetchCategory = async () => {
            const response = await axios.get("http://localhost:8000/api/categories/");
            setcategory(response.data);
        };
        fetchCategory();
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <header className={`main-header ${scrolled ? "active" : ""}`}>
            {/* Phần 1: Top Bar (Logo, Search, User Actions) */}
            <div className="header-top">
                <div className="header-top-container">
                    <Link to="/" className="logo" title="Routine Home" aria-label="Routine Trang chủ">ROUTINE</Link>

                    <div className="search-container">
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="search"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Tìm kiếm sản phẩm"
                            />
                            <button type="submit" aria-label="Tìm kiếm"><i className="bi bi-search"></i></button>
                        </form>
                    </div>

                    <div className="user-actions">
                        <Link to="/checkout" className="cart-icon-nav" title="Giỏ hàng" aria-label="Giỏ hàng">
                            <i className="bi bi-bag"></i>
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>

                        {user ? (
                            <div className="user-profile-nav">
                                <Link to="/profile" className="welcome-msg" title="Trang cá nhân">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="avatar" />
                                    ) :
                                        (
                                            <img src="https://cdn-icons-png.flaticon.com/512/11540/11540172.png" alt="Avatar mặc định" className="avatar" />
                                        )}
                                </Link>
                                <p className="d-flex m-0 text-dark fw-semibold fs-6">{user.first_name || user.username}</p>
                                <button onClick={logout} className="logout-btn" aria-label="Đăng xuất">Đăng xuất</button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="login-btn">Đăng nhập</Link>
                                <Link to="/register" className="register-btn">Tham gia ngay</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Phần 2: Main Navigation */}
            <nav className="header-bottom-nav" aria-label="Danh mục chính">
                <div className="nav-container">
                    <ul className="nav-links">
                        <li><Link to="/">Trang chủ</Link></li>
                        <li><Link to="/products/all">Sản phẩm</Link></li>
                        <li className="nav-item dropdown-hover">
                            <Link
                                to="/products/all"
                                className="nav-link-dropdown"
                                aria-haspopup="true"
                            >
                                Danh mục <i className="bi bi-chevron-down dropdown-icon"></i>
                            </Link>
                            <ul className="dropdown-menu-modern" aria-label="Danh mục sản phẩm">
                                {category.map(c => (
                                    <li key={c.slug}>
                                        <NavLink
                                            to={`/products/${c.slug}`}
                                            className={({ isActive }) =>
                                                "dropdown-item-modern " + (isActive ? "active" : "")
                                            }
                                            onClick={() => document.body.click()}
                                        >
                                            {c.name}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li><Link to="/contact">Liên hệ</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}

export default Header;