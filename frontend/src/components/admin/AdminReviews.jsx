import React, { useEffect, useState } from 'react';
import api from '../../api';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('reviews/');
            setReviews(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
        try {
            await api.delete(`reviews/${id}/`);
            fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi ${i < rating ? 'bi-star-fill' : 'bi-star'} text-warning`} style={{ fontSize: '12px', marginRight: '2px', color: '#f59e0b' }}></i>
        ));
    };

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải đánh giá...</p>
        </div>
    );

    return (
        <div className="admin-reviews">
            <div className="admin-table-container">
                <div className="admin-table-header">
                    <h2>Quản lý đánh giá</h2>
                    <div className="stats-badge" style={{ background: '#f0fdf4', color: '#16a34a', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                        Tổng số: {reviews.length} đánh giá
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Sản phẩm</th>
                                <th>Đánh giá</th>
                                <th>Nội dung</th>
                                <th>Ngày gửi</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{review.user_name || review.user}</div>
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <div style={{ fontWeight: '500', fontSize: '13px' }}>{review.product_name || review.product}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '14px' }}>{review.rating}</span>
                                            <div style={{ display: 'flex' }}>{renderStars(review.rating)}</div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                                            {review.comment || <i>Không có nhận xét</i>}
                                        </p>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#64748b' }}>
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(review.id)}>
                                            <i className="bi bi-trash"></i>
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

export default AdminReviews;
