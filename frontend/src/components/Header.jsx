import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";


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
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <header className={scrolled ? "active" : ""}>
            <nav className="header-nav">
                <Link to="/" className="logo">ROUTINE</Link>
                <ul className="nav-links">
                    <li><Link to="/">Trang chủ</Link></li>
                    <li><Link to="/products">Sản phẩm</Link></li>
                    {/* <li><Link to="/products">Danh mục</Link></li> */}
                    <li className="nav-item">
                        {/* Thêm position-static vào đây để menu con có thể tràn ra khỏi giới hạn của thẻ li */}
                        <div className="dropdown">
                            <Link
                                className="dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                to="#"
                            >
                                Danh mục
                            </Link>

                            {/* Quan trọng: Thêm w-100 vào ul và class tùy chỉnh nếu cần */}
                            <ul className="dropdown-menu shadow-sm animate slideIn">
                                {category.map(c => (
                                    <li key={c.slug}>
                                        <NavLink
                                            to={`/products?category=${c.slug}`}
                                            className={({ isActive }) =>
                                                "dropdown-item " + (isActive ? "active" : "")
                                            }
                                        >
                                            {c.name}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                    <li><Link to="/contact">Liên hệ</Link></li>
                </ul>
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit"><i className="bi bi-search"></i></button>
                    </form>
                </div>
                <div className="user-actions">
                    <Link to="/checkout" className="cart-icon-nav" title="Giỏ hàng">
                        <i className="bi bi-bag"></i>
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </Link>

                    {user ? (
                        <div className="user-profile-nav">
                            <Link to="/profile" className="welcome-msg">
                                <img src={user.avatar} alt="" className="avatar" /> {user.first_name || user.username}
                            </Link>
                            <button onClick={logout} className="logout-btn">Đăng xuất</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="login-btn">Đăng nhập</Link>
                            <Link to="/register" className="register-btn">Tham gia ngay</Link>
                        </div>
                    )}
                </div>
            </nav>
            <div id="suggestions"></div>
        </header>
    );
}

export default Header;