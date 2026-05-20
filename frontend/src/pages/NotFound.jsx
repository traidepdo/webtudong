// pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <Helmet>
                <title>Lỗi 404 - Trang Không Tồn Tại</title>
                <meta name="description" content="Trang bạn đang truy cập không tồn tại hoặc đã bị xóa." />
                <link rel="canonical" href="http://localhost:5173/404" />
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            {/* Giữ nguyên Header để đồng bộ trải nghiệm thương hiệu */}
            <Header scrolled={true} />

            <main className="not-found-container">
                <div className="not-found-content">
                    <span className="error-code">404</span>
                    <h1>Hình như bạn đang đi lạc?</h1>
                    <p className="error-message">
                        Trang bạn đang truy cập không tồn tại, đã bị xóa hoặc thay đổi đường dẫn cấu trúc.
                    </p>

                    {/* Ô tìm kiếm cứu cánh cho khách hàng */}
                    <div className="not-found-search">
                        <form action="/search" method="get">
                            <input
                                type="text"
                                name="q"
                                placeholder="Tìm sản phẩm khác tại đây..."
                            />
                            <button type="submit"><i className="bi bi-search"></i> Tìm kiếm</button>
                        </form>
                    </div>

                    {/* Các nút điều hướng thông minh */}
                    <div className="suggested-links">
                        <Link to="/" className="btn-home">Quay về trang chủ</Link>
                        <Link to="/products/all" className="btn-products">Xem sản phẩm mới</Link>
                        <Link to="/blog" className="btn-blog">Đọc tin tức mới</Link>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                .not-found-container {
                    max-width: 800px;
                    margin: 120px auto 60px;
                    padding: 0 20px;
                    text-align: center;
                }
                .error-code {
                    font-size: 100px;
                    font-weight: 800;
                    color: #0071e3;
                    line-height: 1;
                    display: block;
                    margin-bottom: 10px;
                }
                .not-found-content h1 {
                    font-size: 32px;
                    margin-bottom: 15px;
                    color: #1d1d1f;
                }
                .error-message {
                    color: #86868b;
                    font-size: 16px;
                    margin-bottom: 30px;
                }
                .not-found-search {
                    max-width: 450px;
                    margin: 0 auto 40px;
                }
                .not-found-search form {
                    display: flex;
                    border: 1px solid #d2d2d7;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .not-found-search input {
                    flex: 1;
                    padding: 12px 15px;
                    border: none;
                    outline: none;
                }
                .not-found-search button {
                    background: #0071e3;
                    color: white;
                    border: none;
                    padding: 0 20px;
                    cursor: pointer;
                }
                .suggested-links {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .suggested-links a {
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .btn-home {
                    background: #000;
                    color: #fff;
                }
                .btn-products, .btn-blog {
                    border: 1px solid #d2d2d7;
                    color: #1d1d1f;
                }
                .suggested-links a:hover {
                    opacity: 0.8;
                }
                @media (max-width: 768px) {
                    .not-found-container {
                        margin: 80px auto 40px;
                    }
                    .error-code {
                        font-size: 70px;
                    }
                    .not-found-content h1 {
                        font-size: 24px;
                    }
                    .not-found-search {
                        width: 100%;
                    }
                    .suggested-links {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .suggested-links a {
                        width: 100%;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default NotFound;