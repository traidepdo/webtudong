import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminUsers from '../components/admin/AdminUsers';
import Category from '../components/admin/AdminCategory';
import api from '../api';

const AdminOverview = ({ user }) => {
    const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, total_users: 0 });

    useEffect(() => {
        api.get('admin/stats/').then(res => setStats(res.data)).catch(console.error);
    }, []);

    return (
        <div className="admin-overview">
            <header>
                <h1>Chào mừng, {user?.first_name || 'Admin'}</h1>
            </header>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Tổng đơn hàng</h3>
                    <p>{stats.total_orders}</p>
                </div>
                <div className="stat-card">
                    <h3>Tổng doanh thu</h3>
                    <p>{Number(stats.total_revenue).toLocaleString()}đ</p>
                </div>
                <div className="stat-card">
                    <h3>Tổng người dùng</h3>
                    <p>{stats.total_users}</p>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    if (user && !user.is_staff) {
        return <Navigate to="/" />;
    }

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo">Admin Panel</div>
                <nav>
                    <ul>
                        <li
                            className={activeSection === 'overview' ? 'active' : ''}
                            onClick={() => setActiveSection('overview')}
                        >
                            Tổng quan
                        </li>
                        <li
                            className={activeSection === 'products' ? 'active' : ''}
                            onClick={() => setActiveSection('products')}
                        >
                            Sản phẩm
                        </li>
                        <li
                            className={activeSection === 'orders' ? 'active' : ''}
                            onClick={() => setActiveSection('orders')}
                        >
                            Đơn hàng
                        </li>
                        <li
                            className={activeSection === 'users' ? 'active' : ''}
                            onClick={() => setActiveSection('users')}
                        >
                            Người dùng
                        </li>
                        <li
                            className={activeSection === 'categories' ? 'active' : ''}
                            onClick={() => setActiveSection('categories')}
                        >
                            Danh mục
                        </li>
                    </ul>
                </nav>
                <button onClick={logout} className="logout-btn">Đăng xuất</button>
            </aside>

            <main className="admin-content">
                {/* ✅ FIX: Render trực tiếp thay vì dùng renderContent()
                    Cách cũ dùng function call khiến React unmount/mount lại component
                    mỗi khi AdminDashboard re-render → scroll bị reset về đầu trang */}
                {activeSection === 'overview' && <AdminOverview user={user} />}
                {activeSection === 'products' && <AdminProducts />}
                {activeSection === 'orders' && <AdminOrders />}
                {activeSection === 'users' && <AdminUsers />}
                {activeSection === 'categories' && <Category />}
            </main>

            <style>{`
                .admin-container {
                    display: flex;
                    min-height: 100vh;
                    background: #f4f7f6;
                }
                .admin-sidebar {
                    width: 250px;
                    background: #2c3e50;
                    color: white;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .admin-logo {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 40px;
                    text-align: center;
                }
                .admin-sidebar nav ul {
                    list-style: none;
                    padding: 0;
                }
                .admin-sidebar nav ul li {
                    padding: 12px 15px;
                    margin-bottom: 5px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .admin-sidebar nav ul li:hover, .admin-sidebar nav ul li.active {
                    background: #34495e;
                }
                .logout-btn {
                    margin-top: auto;
                    padding: 10px;
                    background: #e74c3c;
                    border: none;
                    color: white;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .admin-content {
                    flex: 1;
                    padding: 30px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .stat-card h3 {
                    margin: 0;
                    font-size: 14px;
                    color: #7f8c8d;
                }
                .stat-card p {
                    margin: 10px 0 0;
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;