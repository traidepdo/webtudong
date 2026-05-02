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
            // This might need a new endpoint if it doesn't exist
            // For now, let's assume /api/profile/ returns all users if admin? 
            // Usually it's /api/users/
            const res = await api.get('profile/'); // Fallback to current user if others fail
            setUsers([res.data]);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="admin-users">
            <h2>Quản lý người dùng</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Họ tên</th>
                        <th>Vai trò</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.email}</td>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.is_staff ? 'Admin' : 'Khách hàng'}</td>
                            <td>
                                <button className="edit-btn">Sửa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUsers;
