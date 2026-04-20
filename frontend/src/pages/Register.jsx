import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
        birth_date: '',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const [step, setstep] = useState(1)
    const navigate = useNavigate();
    const [avatarFile, setAvatarFile] = useState(null);
    const handleChange = (e) => {
        if (e.target.name === 'avatar') {
            setAvatarFile(e.target.files[0]);
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };
    const handleNextStep = (e) => {
        e.preventDefault();
        if (formData.username && formData.password) {
            setstep(2);
        }
        else {
            alert("Vui lòng điền tài khoản và mật khẩu");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Đảm bảo birth_date không bị null/undefined khi gửi
            if (key === 'birth_date' && !formData[key]) {
                return;
            }
            data.append(key, formData[key]);
        });
        // 3. Đưa file ảnh vào FormData (nếu có)
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        try {
            // 4. Gửi data (là FormData) thay vì formData (là object)
            await register(data);
            alert('Đăng ký thành công!');
            navigate('/login');
        } catch (err) {
            setError('Đăng ký lỗi, có thể do định dạng ảnh hoặc tên user đã tồn tại');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Tạo tài khoản mới</h2>
                <p>Khám phá bộ sưu tập tuyệt vời của chúng tôi</p>
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Tên đăng nhập</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="username" />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="********" />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="********" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="button" onClick={handleNextStep} className="auth-btn">Tiếp tục</button>
                        </div>
                    )}
                    {step === 2 && (
                        <div>
                            <div className="form-group">
                                <label>Họ</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="Họ" />
                            </div>
                            <div className="form-group">
                                <label>Tên</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Tên" />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} required placeholder="Số điện thoại" />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="Địa chỉ" />
                            </div>
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} required placeholder="Ngày sinh" />
                            </div>
                            <div className="form-group">
                                <label>Ảnh đại diện</label>
                                <input
                                    type="file"
                                    name="avatar"
                                    accept="image/*" // Chỉ cho phép chọn ảnh
                                    onChange={handleChange}
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="auth-btn">Đăng ký</button>
                        </div>
                    )}
                </form>
                <div className="auth-footer">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
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
                    max-width: 500px;
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
                .form-row {
                    display: flex;
                    gap: 15px;
                }
                .form-group {
                    text-align: left;
                    margin-bottom: 20px;
                    flex: 1;
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

export default Register;
