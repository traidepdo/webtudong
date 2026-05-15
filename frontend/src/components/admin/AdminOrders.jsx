import React, { useEffect, useState } from 'react';
import api from '../../api';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('orders/');
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

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
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải danh sách đơn hàng...</p>
        </div>
    );

    return (
        <div className="admin-orders">
            <div className="admin-table-container">
                <div className="admin-table-header">
                    <h2>Quản lý đơn hàng</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="admin-btn admin-btn-edit">
                            <i className="bi bi-download"></i>
                            Xuất báo cáo
                        </button>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày đặt</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: '700' }}>#{order.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '600' }}>{order.full_name}</span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{order.phone}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '700' }}>{Number(order.total_amount).toLocaleString()}đ</td>
                                    <td>
                                        <span className={`status-badge ${order.status}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="admin-btn admin-btn-edit">
                                            <i className="bi bi-eye"></i>
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
