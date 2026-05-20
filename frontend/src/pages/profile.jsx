import React, { useState, useEffect } from 'react';
import axios from "axios";
import Header from '../components/Header';
import "../styles/Profile.css";

function Profile() {
    const token = localStorage.getItem('access_token');
    const [user, setuser] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // 1. Fetch data on mount
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/profile/", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setuser(res.data);
                setFormData(res.data); // Initialize draft data
            })
            .catch(error => console.log(error));
    }, [token]);

    const handleEdit = () => {
        setFormData(user); // Reset draft to current user data when opening
        setIsEditing(true);
    };

    // 2. Define the missing handleChange
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // 3. Updated handleSave with event prevention
    const handleSave = (e) => {
        e.preventDefault(); // Stop page reload
        axios.put("http://127.0.0.1:8000/api/profile/", formData, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setuser(res.data);
                setIsEditing(false);
                alert("Cập nhật thành công!");
            })
            .catch(error => {
                console.log(error);
                alert("Có lỗi xảy ra khi cập nhật.");
            });
    };

    return (
        <div className="profile-page">
            <Header />
            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-section">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="profile-avatar" />
                            ) : (
                                <div className="avatar-placeholder">{user.username?.charAt(0).toUpperCase()}</div>
                            )}
                            <h2>{user.first_name} {user.last_name}</h2>
                            <span className="username-tag">@{user.username}</span>
                        </div>
                    </div>

                    <div className="profile-body">
                        {isEditing ? (
                            <form onSubmit={handleSave}>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="info-item">
                                        <label>Số điện thoại</label>
                                        <input
                                            type="text"
                                            name="phone_number"
                                            value={formData.phone_number || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="info-item">
                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            name="birth_date"
                                            value={formData.birth_date || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="info-item">
                                        <label>Địa chỉ</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="edit-btn" style={{ background: '#28a745' }}>Lưu</button>
                                    <button type="button" className="edit-btn" onClick={() => setIsEditing(false)} style={{ background: '#6c757d' }}>Hủy</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="info-grid">
                                    <div className="info-item"><label>Email</label><p>{user.email || 'Chưa cập nhật'}</p></div>
                                    <div className="info-item"><label>Số điện thoại</label><p>{user.phone_number || 'Chưa cập nhật'}</p></div>
                                    <div className="info-item"><label>Ngày sinh</label><p>{user.birth_date || 'Chưa cập nhật'}</p></div>
                                    <div className="info-item"><label>Địa chỉ</label><p>{user.address || 'Chưa cập nhật'}</p></div>
                                </div>
                                <button className="edit-btn" onClick={handleEdit}>Chỉnh sửa hồ sơ</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Profile;