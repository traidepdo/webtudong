import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderDetail = () => {
    const { id } = useParams(); // Lấy ID đơn hàng từ URL
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('access_token');

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/orders/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrder(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchOrderDetail();
    }, [id, token]);

    const getImageUrl = (path) => {
        if (!path) return "https://placehold.co/100x130?text=No+Image";
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000${path}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'pending': { text: 'Chờ xác nhận', color: '#f39c12' },
            'processing': { text: 'Đang xử lý', color: '#3498db' },
            'shipped': { text: 'Đang giao hàng', color: '#9b59b6' },
            'delivered': { text: 'Đã giao hàng', color: '#27ae60' },
            'cancelled': { text: 'Đã hủy', color: '#e74c3c' },
        };
        return statusMap[status] || { text: status, color: '#000' };
    };

    if (loading) return <div className="loading">Đang tải...</div>;
    if (!order) return <div className="error">Không tìm thấy đơn hàng.</div>;

    return (
        <div className="order-detail-page">
            <Header scrolled={true} />

            <div className="container">
                <div className="order-header">
                    <Link to="/order-history" className="back-link">← Quay lại lịch sử đơn hàng</Link>
                    <div className="title-row">
                        <h1>Chi tiết đơn hàng #{order.order_code || order.id}</h1>
                        <span className="status-badge" style={{ backgroundColor: getStatusLabel(order.status).color }}>
                            {getStatusLabel(order.status).text}
                        </span>
                    </div>
                    <p className="order-date">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>

                <div className="order-grid">
                    {/* THÔNG TIN NGƯỜI NHẬN */}
                    <div className="info-card">
                        <h3>Thông tin nhận hàng</h3>
                        <div className="info-content">
                            <p><strong>Người nhận:</strong> {order.full_name}</p>
                            <p><strong>Số điện thoại:</strong> {order.phone_number}</p>
                            <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                            <p><strong>Ghi chú:</strong> {order.note || "Không có ghi chú"}</p>
                        </div>
                    </div>

                    {/* THÔNG TIN THANH TOÁN */}
                    <div className="info-card">
                        <h3>Thanh toán</h3>
                        <div className="info-content">
                            <p><strong>Phương thức:</strong> {order.payment?.method === 'cod' ? "Cash On Delivery" : "Thanh toán trực tuyến"}</p>
                            <p><strong>Trạng thái:</strong> {order.payment?.status === 'completed' || order.is_paid ? "Đã thanh toán" : (order.payment?.method === 'cod' ? "Thanh toán khi nhận hàng" : "Chưa thanh toán")}</p>
                        </div>
                    </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM */}
                <div className="items-table-container">
                    <h3>Sản phẩm đã đặt</h3>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item) => (
                                <tr key={item.id}>
                                    <td className="product-col">
                                        <img src={getImageUrl(item.image)} alt={item.product_name} />
                                        <div className="item-info">
                                            <p className="name">{item.product_name}</p>
                                            <p className="variant">Phân loại: {item.color} / {item.size}</p>
                                        </div>
                                    </td>
                                    <td>{formatPrice(item.price)}</td>
                                    <td>{item.quantity}</td>
                                    <td className="subtotal">{formatPrice(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* TỔNG KẾT HÓA ĐƠN */}
                <div className="order-summary">
                    <div className="summary-row">
                        <span>Tạm tính:</span>
                        <span>{formatPrice(order.total_amount)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Phí vận chuyển:</span>
                        <span>{formatPrice(0)}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Tổng cộng:</span>
                        <span className="total-amount">{formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
                .order-detail-page { padding-top: 100px; background: #f5f5f7; min-height: 100vh; }
                .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
                
                .back-link { text-decoration: none; color: #0066cc; font-size: 14px; margin-bottom: 20px; display: block; }
                .title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
                .title-row h1 { font-size: 24px; margin: 0; color: #000; font-weight: 600; }
                
                .status-badge { color: white; padding: 5px 15px; border-radius: 20px; font-size: 13px; font-weight: 600; }
                .order-date { color: #86868b; margin-top: 5px; }

                .order-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
                .info-card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .info-card h3 { font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
                .info-content p { font-size: 14px; margin: 8px 0; color: #1d1d1f; }

                .items-table-container { background: white; margin-top: 20px; padding: 20px; border-radius: 15px; }
                .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .items-table th { text-align: left; padding: 12px; border-bottom: 2px solid #f5f5f7; color: #86868b; font-weight: 500; }
                .items-table td { padding: 15px 12px; border-bottom: 1px solid #f5f5f7; color: #000;}

                .product-col { display: flex; align-items: center; gap: 15px; }
                .product-col img { width: 60px; height: 80px; object-fit: cover; border-radius: 8px; }
                .item-info .name { font-weight: 600; margin: 0; }
                .item-info .variant { font-size: 12px; color: #86868b; margin-top: 4px; }
                
                .subtotal { font-weight: 600; }

                .order-summary { margin-top: 20px; background: white; padding: 20px; border-radius: 15px; margin-left: auto; width: 100%; }
                .summary-row { display: flex; justify-content: space-between; margin: 10px 0; color: #1d1d1f; }
                .summary-row.total { border-top: 1px solid #eee; pt: 15px; margin-top: 15px; font-weight: 700; font-size: 18px; }
                .total-amount { color: #d32f2f; }

                @media (max-width: 768px) {
                    .order-grid { grid-template-columns: 1fr; }
                    .order-summary { max-width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default OrderDetail;