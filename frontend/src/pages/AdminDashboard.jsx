import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminUsers from '../components/admin/AdminUsers';
import Category from '../components/admin/AdminCategory';
import AdminReviews from '../components/admin/AdminReviews';
import api from '../api';

const AdminOverview = ({ user }) => {
    const [stats, setStats] = useState({
        total_orders: 0,
        total_revenue: 0,
        total_users: 0,
        pending_orders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, ordersRes] = await Promise.all([
                    api.get('admin/stats/'),
                    api.get('orders/recent/')
                ]);
                setStats(statsRes.data);
                setRecentOrders(ordersRes.data);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Chờ xử lý',
            'processing': 'Đang chuẩn bị',
            'shipped': 'Đang giao',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy'
        };
        return labels[status] || status;
    };

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải dữ liệu tổng quan...</p>
        </div>
    );

    return (
        <div className="admin-overview">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <h3>Tổng đơn hàng</h3>
                        <p className="stat-value">{stats.total_orders}</p>
                    </div>
                    <div className="stat-icon orders">
                        <i className="bi bi-cart-check"></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <h3>Doanh thu</h3>
                        <p className="stat-value">{Number(stats.total_revenue).toLocaleString()}đ</p>
                    </div>
                    <div className="stat-icon revenue">
                        <i className="bi bi-currency-dollar"></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <h3>Người dùng</h3>
                        <p className="stat-value">{stats.total_users}</p>
                    </div>
                    <div className="stat-icon users">
                        <i className="bi bi-people"></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <h3>Đơn hàng chờ</h3>
                        <p className="stat-value">{stats.pending_orders}</p>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <i className="bi bi-clock-history"></i>
                    </div>
                </div>
            </div>

            <div className="admin-table-container">
                <div className="admin-table-header">
                    <h2>Đơn hàng gần đây</h2>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Giá trị</th>
                            <th>Trạng thái</th>
                            <th>Ngày đặt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map(order => (
                            <tr key={order.id}>
                                <td style={{ fontWeight: '700' }}>#{order.id}</td>
                                <td>{order.full_name}</td>
                                <td style={{ fontWeight: '600' }}>{Number(order.total_amount).toLocaleString()}đ</td>
                                <td>
                                    <span className={`status-badge ${order.status}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td style={{ fontSize: '13px', color: '#64748b' }}>
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminDashboard = ({ initialSection = 'overview' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(initialSection);

    // Sync state if initialSection prop changes
    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    if (user && !user.is_staff) {
        return <Navigate to="/" />;
    }

    const getSectionTitle = () => {
        switch (activeSection) {
            case 'overview': return 'Tổng quan hệ thống';
            case 'products': return 'Quản lý sản phẩm';
            case 'orders': return 'Quản lý đơn hàng';
            case 'users': return 'Quản lý người dùng';
            case 'categories': return 'Quản lý danh mục';
            case 'reviews': return 'Quản lý đánh giá';
            default: return 'Admin Panel';
        }
    };

    const handleSectionChange = (section, path) => {
        setActiveSection(section);
        navigate(path);
    };

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo-wrapper">
                    <div className="logo-icon">R</div>
                    <div className="admin-logo-text">ROUTINE Admin</div>
                </div>
                <nav>
                    <ul>
                        <li
                            className={activeSection === 'overview' ? 'active' : ''}
                            onClick={() => handleSectionChange('overview', '/admin/homeadmin')}
                        >
                            <i className="bi bi-grid-1x2"></i>
                            Tổng quan
                        </li>
                        <li
                            className={activeSection === 'products' ? 'active' : ''}
                            onClick={() => handleSectionChange('products', '/admin/products')}
                        >
                            <i className="bi bi-box-seam"></i>
                            Sản phẩm
                        </li>
                        <li
                            className={activeSection === 'orders' ? 'active' : ''}
                            onClick={() => handleSectionChange('orders', '/admin/order')}
                        >
                            <i className="bi bi-bag-check"></i>
                            Đơn hàng
                        </li>
                        <li
                            className={activeSection === 'users' ? 'active' : ''}
                            onClick={() => handleSectionChange('users', '/admin/users')}
                        >
                            <i className="bi bi-people"></i>
                            Người dùng
                        </li>
                        <li
                            className={activeSection === 'categories' ? 'active' : ''}
                            onClick={() => handleSectionChange('categories', '/admin/categories')}
                        >
                            <i className="bi bi-tags"></i>
                            Danh mục
                        </li>
                        <li
                            className={activeSection === 'reviews' ? 'active' : ''}
                            onClick={() => handleSectionChange('reviews', '/admin/reviews')}
                        >
                            <i className="bi bi-star"></i>
                            Đánh giá
                        </li>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">
                        <i className="bi bi-box-arrow-right"></i>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="admin-content">
                <div className="admin-top-bar">
                    <div className="top-bar-left">
                        <h2>{getSectionTitle()}</h2>
                    </div>
                    <div className="top-bar-right">
                        <div className="admin-profile-pill">
                            <img src={user?.avatar || "https://cdn-icons-png.flaticon.com/512/11540/11540172.png"} alt="Avatar" />
                            <span>{user?.first_name || user?.username || 'Admin'}</span>
                        </div>
                    </div>
                </div>

                <div className="admin-main-inner">
                    {activeSection === 'overview' && <AdminOverview user={user} />}
                    {activeSection === 'products' && <AdminProducts />}
                    {activeSection === 'orders' && <AdminOrders />}
                    {activeSection === 'users' && <AdminUsers />}
                    {activeSection === 'categories' && <Category />}
                    {activeSection === 'reviews' && <AdminReviews />}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
