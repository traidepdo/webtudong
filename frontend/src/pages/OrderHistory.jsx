import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import aos from 'aos';
import 'aos/dist/aos.css';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');

    // Danh sách các trạng thái để lọc
    const statuses = [
        { id: 'all', name: 'Tất cả đơn hàng' },
        { id: 'pending', name: 'Chờ xác nhận' },
        { id: 'processing', name: 'Đang xử lý' },
        { id: 'shipped', name: 'Đang giao hàng' },
        { id: 'delivered', name: 'Đã giao hàng' },
        { id: 'cancelled', name: 'Đã hủy' },
    ];

    useEffect(() => {
        aos.init({
            duration: 1000,
            once: false,
            offset: 100,
            mirror: true
        });
    }, []);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setOrders(sorted);
                setFilteredOrders(sorted);
            } catch (error) {
                console.error("Lỗi fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token, navigate]);

    // Xử lý lọc theo trạng thái (Giống phần lọc Category của Products)
    useEffect(() => {
        if (selectedStatus === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status?.toLowerCase() === selectedStatus));
        }
        // Refresh AOS để tính toán lại vị trí các phần tử mới
        setTimeout(() => aos.refresh(), 100);
    }, [selectedStatus, orders]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === 'delivered') return { text: 'Hoàn thành', class: 'status-success' };
        if (s === 'cancelled') return { text: 'Đã hủy', class: 'status-danger' };
        if (s === 'shipped' || s === 'processing') return { text: 'Đang giao', class: 'status-info' };
        return { text: 'Chờ xử lý', class: 'status-warning' };
    };
    const getImageUrl = (imagePath) => {
        // Nếu API không trả về ảnh, dùng ảnh mặc định
        if (!imagePath) return "https://placehold.co/60x80?text=No+Image";

        // Nếu ảnh đã là URL hoàn chỉnh (chứa http), thì giữ nguyên
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Nếu ảnh là đường dẫn tương đối, nối thêm domain Backend vào (sửa lại port 8000 nếu bạn dùng port khác)
        return `http://127.0.0.1:8000${imagePath}`;
    };

    return (
        <div className="order-history-page">
            <Header scrolled={true} />

            <div className="catalog-container">
                {/* SIDEBAR BỘ LỌC - Giống trang Products */}
                <aside className="filters-sidebar">
                    <div className="filter-section">
                        <h3>Trạng thái đơn</h3>
                        <div className="category-list">
                            {statuses.map(status => (
                                <button
                                    key={status.id}
                                    className={`category-item ${selectedStatus === status.id ? 'active' : ''}`}
                                    onClick={() => setSelectedStatus(status.id)}
                                >
                                    {status.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section help-box">
                        <p>Cần hỗ trợ về đơn hàng?</p>
                        <button className="contact-btn">Chat với hỗ trợ</button>
                    </div>
                </aside>

                {/* DANH SÁCH ĐƠN HÀNG - Giống layout Grid của Products */}
                <main className="catalog-content">
                    <div className="results-count">
                        Hiển thị {filteredOrders.length} đơn hàng
                    </div>


                    {loading ? (
                        <div className="loading-spinner">Đang tải...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="no-results" data-aos="fade-up">
                            <i className="bi bi-bag-x"></i>
                            <p>Không tìm thấy đơn hàng nào trong mục này.</p>
                            <button onClick={() => navigate('/products')}>Tiếp tục mua sắm</button>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {filteredOrders.map((order, index) => (
                                <div key={order.id} className="order-item-card" data-aos="fade-up">
                                    <div className="order-card-header">
                                        <div>
                                            <span className="order-id">Mã đơn: #{order.order_code || order.id}</span>
                                            <p className="order-time">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                        <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                            {getStatusBadge(order.status).text}
                                        </span>
                                    </div>

                                    <div className="order-card-body">
                                        {/* Chỉ hiển thị sản phẩm đầu tiên hoặc tóm tắt */}
                                        {order.items?.slice(0, 1).map((item, i) => (
                                            <div key={i} className="product-mini">
                                                {/* Đảm bảo item.image là đúng tên field API trả về. Nếu API trả về item.product_image thì bạn đổi lại nhé */}
                                                <img src={getImageUrl(item.image)} alt={item.product_name || "Sản phẩm"} />
                                                <div className="product-info">
                                                    <h4>{item.product_name}</h4>
                                                    <p>{item.color} / {item.size} x {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {order.items?.length > 1 && (
                                            <p className="more-items">và {order.items.length - 1} sản phẩm khác...</p>
                                        )}
                                    </div>

                                    <div className="order-card-footer">
                                        <div className="total-box">
                                            <span>Tổng thanh toán:</span>
                                            <span className="price">{formatPrice(order.total_amount)}</span>
                                        </div>
                                        <button
                                            className="detail-btn"
                                            onClick={() => navigate(`/order-detail/${order.id}`)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <Footer />

            <style jsx>{`
                .order-history-page {
                    background-color: #f5f5f7;
                    min-height: 100vh;  
                }

                .catalog-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 120px 20px 60px;
                    display: grid;
                    grid-template-columns: 250px 1fr;
                    gap: 40px;
                }

                /* SIDEBAR STYLE */
                .filters-sidebar {
                    position: sticky;
                    top: 100px;
                    height: fit-content;
                }
                .filter-section h3 {
                    font-size: 14px;
                    color: #86868b;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                    letter-spacing: 0.05em;
                }
                .category-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .category-item {
                    background: none;
                    border: none;
                    text-align: left;
                    font-size: 17px;
                    color: #1d1d1f;
                    padding: 8px 0;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .category-item:hover, .category-item.active {
                    color: #0071e3;
                    font-weight: 600;
                }
                .help-box {
                    margin-top: 40px;
                    padding: 20px;
                    background: #fff;
                    border-radius: 18px;
                    font-size: 14px;
                }
                .contact-btn {
                    width: 100%;
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 20px;
                    border: 1px solid #d2d2d7;
                    background: transparent;
                    cursor: pointer;
                }

                /* CONTENT STYLE */
                .catalog-header {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .results-count { color: #86868b; font-size: 14px; }

                .orders-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .order-item-card {
                    background: #fff;
                    border-radius: 20px;
                    padding: 24px;
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                .order-item-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }

                .order-card-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f5f5f7;
                }
                .order-id { font-weight: 600; font-size: 16px; }
                .order-time { font-size: 13px; color: #86868b; margin: 0; }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-success { background: #e8f5e9; color: #2e7d32; }
                .status-warning { background: #fff3e0; color: #ef6c00; }
                .status-info { background: #e3f2fd; color: #1565c0; }
                .status-danger { background: #ffebee; color: #c62828; }

                .product-mini {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }
                .product-mini img {
                    width: 60px;
                    height: 80px;
                    border-radius: 8px;
                    object-fit: cover;
                    background: #f5f5f7;
                }
                .product-info h4 { font-size: 15px; margin: 0 0 5px; }
                .product-info p { font-size: 13px; color: #86868b; margin: 0; }
                .more-items { font-size: 13px; color: #0071e3; margin-top: 10px; }

                .order-card-footer {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #f5f5f7;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .total-box span { font-size: 14px; color: #86868b; }
                .total-box .price { 
                    display: block; 
                    font-size: 18px; 
                    font-weight: 700; 
                    color: #1d1d1f; 
                }

                .detail-btn {
                    padding: 8px 20px;
                    border-radius: 20px;
                    border: 1px solid #d2d2d7;
                    background: #fff;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .detail-btn:hover { background: #000; color: #fff; border-color: #000; }

                .no-results {
                    text-align: center;
                    padding: 100px 0;
                    background: #fff;
                    border-radius: 30px;
                }
                .no-results i { font-size: 50px; color: #d2d2d7; }
                .no-results button {
                    margin-top: 20px;
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 25px;
                    cursor: pointer;
                }

                @media (max-width: 992px) {
                    .catalog-container { grid-template-columns: 1fr; }
                    .filters-sidebar { position: static; }
                    .category-list { flex-direction: row; overflow-x: auto; padding-bottom: 10px; }
                    .category-item { white-space: nowrap; padding: 8px 15px; background: #fff; border-radius: 20px; }
                }
            `}</style>
        </div>
    );
};

export default OrderHistory;