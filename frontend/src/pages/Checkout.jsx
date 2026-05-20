import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Checkout() {
    const [profile, setProfile] = useState({});
    const token = localStorage.getItem('access_token');

    const { cartItems, totalAmount, removeFromCart, clearCart } = useCart();
    const [formData, setFormData] = useState({
        userId: '',
        fullName: '',
        phone: '',
        address: '',
        paymentMethod: 'cod'
    });
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/profile/",
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        )
            .then(res => {
                setProfile(res.data);
                setFormData({
                    userId: res.data.user || res.data.id || '',
                    fullName: res.data.first_name + " " + res.data.last_name,
                    phone: res.data.phone_number,
                    address: res.data.address,
                    paymentMethod: 'cod'
                });
            })
            .catch(error => console.log(error));
    }, [])
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    // const handlePaymentMethodChange = (e) => {
    //     setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
    // }
    // function handleVnPay() {
    //  if(formData.paymentMethod === 'vnpay') {

    //  }   
    // }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Simplified order submission
            const orderPayload = {
                user: formData.userId || null,
                full_name: formData.fullName,
                phone_number: formData.phone,
                shipping_address: formData.address,
                total_amount: Math.round(totalAmount),
                payment_method: formData.paymentMethod,
                items: cartItems.map(item => ({
                    variant: item.idvariant,
                    quantity: item.quantity
                }))
            };
            await api.post('/orders/', orderPayload);
            setTimeout(() => {
                setOrderSuccess(true);
                setIsSubmitting(false);
                clearCart();
            }, 1500);
        } catch (err) {
            console.error("Order error", err);
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="checkout-success-page">
                <Header scrolled={true} />
                <div className="success-container">
                    <div className="success-icon"><i className="bi bi-check-circle-fill"></i></div>
                    <h1>Đặt hàng thành công!</h1>
                    <p>Cảm ơn bạn đã mua sắm tại Blue Sky. Đơn hàng của bạn đang được xử lý.</p>
                    <button onClick={() => window.location.href = '/'} className="back-home-btn">Tiếp tục mua sắm</button>
                </div>
                <Footer />
                <style jsx>{`
                    .checkout-success-page { margin-top: 150px; text-align: center; min-height: 80vh; }
                    .success-icon { font-size: 80px; color: #34c759; margin-bottom: 20px; }
                    .back-home-btn { margin-top: 30px; margin-bottom: 30px; padding: 12px 30px; background: #000; color: #fff; border: none; border-radius: 30px; cursor: pointer; }
                `}</style>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };


    return (
        <div className="checkout-page">
            <Header scrolled={true} />
            <main className="checkout-container">
                <div className="checkout-form-section">
                    <h2 className='text-2xl text-dark fw-bold mb-4'>Thông tin giao hàng</h2>
                    <form onSubmit={handleSubmit} className="checkout-form">
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="09xx xxx xxx"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Địa chỉ nhận hàng</label>
                            <textarea
                                name="address"
                                required
                                rows="3"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            ></textarea>
                        </div>

                        <div className="payment-methods">
                            <h3>Phương thức thanh toán</h3>
                            <div className="method-options">
                                <label className={`method-item ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleInputChange}
                                    />
                                    <span className='text-dark fw-bold'>Thanh toán khi nhận hàng (COD)</span>
                                </label>
                                <label className={`method-item ${formData.paymentMethod === 'vnpay' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="vnpay"
                                        checked={formData.paymentMethod === 'vnpay'}
                                        onChange={handleInputChange}
                                    />
                                    <span className='text-dark fw-bold'>VNPay</span>
                                </label>
                                <label className={`method-item ${formData.paymentMethod === 'momo' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="momo"
                                        checked={formData.paymentMethod === 'momo'}
                                        onChange={handleInputChange}
                                    />
                                    <span className='text-dark fw-bold'>Ví MOMO</span>
                                </label>
                            </div>
                        </div>
                        {cartItems.length > 0 && (
                            <button type="submit" className="place-order-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đặt hàng'}
                            </button>
                        )}
                        {cartItems.length === 0 && (
                            <button type="button" className="off-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang xử lý...' : 'Giỏ hàng trống'}
                            </button>
                        )}
                    </form>
                </div>

                <aside className="order-summary-section">
                    <div className="summary-card">
                        <h3>Tóm tắt đơn hàng</h3>
                        <div className="item-list">
                            {cartItems.map(item => {
                                const primaryImage = item.images?.find(img => img.is_primary)?.image || item.images?.[0]?.image || item.image;
                                return (
                                    <div key={item.id} className="summary-item">
                                        <div className="item-img"><img src={primaryImage} alt="" /></div>
                                        <div className="item-details">
                                            <h4>{item.name}</h4>
                                            <p>Số lượng: {item.quantity}</p>
                                        </div>
                                        <div className="item-price-col">
                                            <div className="item-price">{formatPrice(item.price || item.base_price)}</div>
                                            <div className="item-subtotal">x{item.quantity} = {formatPrice((item.price || item.base_price) * item.quantity)}</div>
                                            <button
                                                className="remove-item-btn"
                                                onClick={() => removeFromCart(item.idvariant)}
                                                title="Xóa khỏi giỏ"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {cartItems.length === 0 && (
                            <div className="empty-cart-msg">
                                Giỏ hàng trống. <a href="/products">Quay lại mua sắm</a>
                            </div>
                        )}
                        <div className="summary-totals">
                            <div className="total-row">
                                <span>Tạm tính</span>
                                <span className="subtotal-price">{formatPrice(totalAmount)}</span>
                            </div>
                            <div className="total-row">
                                <span>Phí vận chuyển</span>
                                <span className="free-shipping"><i className="bi bi-truck"></i> Miễn phí</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Tổng cộng</span>
                                <span className="grand-price">{formatPrice(totalAmount)}</span>
                            </div>
                            <Link to={`/order-history/`} className="view-detail-btn">
                                Xem lịch sử đơn hàng <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>
                    </div>
                </aside>
            </main>
            <Footer />

            <style jsx>{`
                .checkout-page { background: #fcfcfc; min-height: 100vh; 
                display: flex;
                flex-direction: column;
                }
                .checkout-container {
                    max-width: 1200px;
                    margin: 120px auto 60px;
                    padding: 0 5%;
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 60px;
                    flex: 1;
                }
                footer{
                    flex-shrink: 0;
                }
                @media (max-width: 1024px) {
                    .checkout-container { grid-template-columns: 1fr; margin-top: 100px; }
                }

                .checkout-form-section h2 { font-size: 28px; margin-bottom: 30px; }
                .checkout-form { display: flex; flex-direction: column; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 14px; font-weight: 600; color: #424245; }
                .form-group input, .form-group textarea {
                    padding: 12px 15px;
                    border: 1px solid #d2d2d7;
                    border-radius: 8px;
                    font-size: 15px;
                    outline: none;
                }
                .form-group input:focus { border-color: #000; }

                .payment-methods { margin-top: 30px; }
                .payment-methods h3 { font-size: 18px; margin-bottom: 15px; }
                .method-options { display: flex; flex-direction: column; gap: 10px; }
                .method-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px;
                    border: 1px solid #d2d2d7;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .method-item.active { border-color: #000; background: #f5f5f7; }
                .method-item input { width: 18px; height: 18px; accent-color: #000; }

                .place-order-btn {
                    margin-top: 30px;
                    padding: 18px;
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .place-order-btn:hover { background: #333; }
                .place-order-btn:disabled { background: #86868b; cursor: not-allowed; }

                .off-btn {
                    margin-top: 30px;
                    padding: 18px;
                    background: #86868b;
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .summary-card {
                    background: #fff;
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    position: sticky;
                    top: 120px;
                }
                .summary-card h3 { margin-bottom: 25px; font-size: 20px; }
                .item-list { margin-bottom: 25px; display: flex; flex-direction: column; gap: 20px; }
                .summary-item { display: flex; gap: 15px; align-items: center; }
                .item-img { width: 60px; height: 80px; background: #f5f5f7; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
                .item-img img { width:100%; height:100%; object-fit: cover; }
                .item-details { flex: 1; }
                .item-details h4 { font-size: 14px; margin-bottom: 4px; font-weight: 600; }
                .item-details p { font-size: 12px; color: #86868b; }
                .item-price { font-weight: 600; font-size: 14px; color: #0071e3; }
                .item-subtotal { font-size: 11px; color: #86868b; font-weight: 500; }
                .item-price-col { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
                .remove-item-btn { 
                    background: none; 
                    border: none; 
                    color: #ff3b30; 
                    cursor: pointer; 
                    font-size: 16px; 
                    padding: 4px;
                    transition: transform 0.2s;
                }
                .remove-item-btn:hover { transform: scale(1.2); }
                .empty-cart-msg { text-align: center; color: #86868b; padding: 20px 0; font-size: 14px; }
                .empty-cart-msg a { color: #0071e3; text-decoration: none; font-weight: 600; }

                .summary-totals { border-top: 1px solid #eee; padding-top: 20px; display: flex; flex-direction: column; gap: 14px; }
                .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; color: #424245; }
                .subtotal-price { font-weight: 600; color: #1d1d1f; }
                .free-shipping {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: linear-gradient(135deg, #34c759, #30d158);
                    color: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 20px;
                    letter-spacing: 0.3px;
                }
                .grand-total {
                    border-top: 2px solid #eee;
                    margin-top: 6px;
                    padding-top: 18px;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1d1d1f;
                }
                .grand-price {
                    font-size: 24px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #e8231a, #ff6b35);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.5px;
                }
                .view-detail-btn {
                    position: relative;
                    overflow: hidden; /* QUAN TRỌNG */
                    display: inline-block;
                    padding: 8px 20px;
                    background: #000;
                    color: #fff;
                    border: 1px solid #d2d2d7;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                /* nền khi hover */
                .view-detail-btn:hover {
                    border-color: #000;
                    background: #000;
                    color: #fff;
                }

                /* hiệu ứng ánh sáng */
                .view-detail-btn::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(
                        120deg,
                        transparent,
                        rgba(255, 255, 255, 0.6),
                        transparent
                    );
                    transform: skewX(-20deg);
                }

                /* khi hover thì chạy */
                .view-detail-btn:hover::before {
                    animation: shine 0.8s forwards;
                }

                /* animation */
                @keyframes shine {
                    0% {
                        left: -100%;
                    }
                    100% {
                        left: 150%;
                    }
                }
            `}</style>
        </div>
    );
};

export default Checkout;
