import React, { useState, useEffect } from 'react';
import axios from "axios";
import Header from '../components/Header';

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

            <style jsx>{`
            .profile-page {
                background-color: #f4f7f9;
                min-height: 100vh;
                padding-top: 100px;
            }
            .profile-container {
                display: flex;
                justify-content: center;
                padding: 20px;
            }
            .profile-card {
                background: white;
                width: 100%;
                max-width: 800px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                overflow: hidden;
            }
            .profile-header {
                background: linear-gradient(135deg, #333 0%, #000 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            .profile-avatar {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 4px solid white;
                object-fit: cover;
                margin-bottom: 15px;
            }
            .avatar-placeholder {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 15px;
                border: 4px solid white;
            }
            .username-tag {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                margin-top: 5px;
            }
            .profile-body {
                padding: 40px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
                margin-bottom: 40px;
            }
            .info-item label {
                display: block;
                font-size: 13px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .info-item p {
                font-size: 16px;
                font-weight: 500;
                color: #333;
                margin: 0;
            }
            .edit-btn {
                width: 100%;
                padding: 12px;
                background: #333;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: 0.3s;
            }
            .edit-btn:hover {
                background: #000;
                transform: translateY(-2px);
            }
            @media (max-width: 600px) {
                .profile-body { padding: 20px; }
                .info-grid { grid-template-columns: 1fr; }
            }
            input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-top: 5px;
                }
        `}</style>
        </div>
    );
}
export default Profile;