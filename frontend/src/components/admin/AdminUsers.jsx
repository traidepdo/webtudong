import React, { useEffect, useState } from 'react';
import api from '../../api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('users/');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải danh sách người dùng...</p>
        </div>
    );

    return (
        <div className="admin-users">
            <div className="admin-table-container">
                <div className="admin-table-header">
                    <h2>Quản lý người dùng</h2>
                    <button className="admin-btn admin-btn-primary">
                        <i className="bi bi-person-plus"></i>
                        Thêm người dùng
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Người dùng</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Ngày tham gia</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: '700' }}>#{user.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
                                                {(user.first_name || user.username || 'U')[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600' }}>{user.first_name || user.username} {user.last_name}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`status-badge ${user.is_staff ? 'shipped' : 'pending'}`}>
                                            {user.is_staff ? 'Admin' : 'Khách hàng'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-btn admin-btn-edit">
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            {!user.is_staff && (
                                                <button className="admin-btn admin-btn-delete">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            )}
                                        </div>
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

export default AdminUsers;
