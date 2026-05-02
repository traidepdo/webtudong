import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(email, password);
            if (user.is_staff) {
                navigate('/admin/homeadmin');
            } else {
                setError('Bạn không có quyền truy cập vào khu vực Admin');
                // Optional: logout if they are a regular user trying to access admin login
            }
        } catch (err) {
            setError('Email hoặc mật khẩu không đúng');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-badge">Admin Panel</div>
                <h2>Đăng nhập Quản trị</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Quản trị</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="********"
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="admin-login-btn">Vào hệ thống</button>
                </form>
            </div>
            <style>{`
                .admin-login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #2c3e50;
                }
                .admin-login-card {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }
                .admin-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .admin-login-card h2 {
                    margin-bottom: 30px;
                    color: #2c3e50;
                }
                .form-group {
                    text-align: left;
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #444;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                }
                .error-message {
                    color: #e74c3c;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                .admin-login-btn {
                    width: 100%;
                    padding: 12px;
                    background: #2c3e50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .admin-login-btn:hover {
                    background: #1a252f;
                }
            `}</style>
        </div>
    );
};

export default AdminLogin;
