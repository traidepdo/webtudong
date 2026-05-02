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

    if (loading) return <div>Đang tải đơn hàng...</div>;

    return (
        <div className="admin-orders">
            <h2>Quản lý đơn hàng</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.full_name}</td>
                            <td>{order.total_amount}đ</td>
                            <td>
                                <span className={`status-badge ${order.status}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </td>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td>
                                <button className="view-btn">Chi tiết</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style>{`
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-badge.pending { background: #f1c40f; color: white; }
                .status-badge.delivered { background: #2ecc71; color: white; }
                .status-badge.cancelled { background: #e74c3c; color: white; }
                .status-badge.processing { background: #3498db; color: white; }
                
                .view-btn {
                    padding: 5px 10px;
                    background: #2c3e50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default AdminOrders;
