import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Email hoặc mật khẩu không đúng');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Chào mừng trở lại</h2>
                <p>Vui lòng đăng nhập để tiếp tục</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="Nhập email của bạn"
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Nhập mật khẩu"
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="auth-btn">Đăng nhập</button>
                </form>
                <div className="auth-footer">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div>
            </div>
            <style>{`
                .auth-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: calc(100vh - 80px);
                    background: #f8f9fa;
                    padding: 20px;
                }
                .auth-card {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }
                .auth-card h2 {
                    margin-bottom: 10px;
                    font-size: 24px;
                    color: #333;
                }
                .auth-card p {
                    color: #666;
                    margin-bottom: 30px;
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
                    transition: border-color 0.3s;
                }
                .form-group input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                .error-message {
                    color: #dc3545;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                .auth-btn {
                    width: 100%;
                    padding: 12px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .auth-btn:hover {
                    background: #000;
                }
                .auth-footer {
                    margin-top: 25px;
                    color: #666;
                }
                .auth-footer a {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default Login;
