import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
    'Sản phẩm nào đang hot?',
    'Tôi muốn đặt hàng sản phẩm này',
    'Đưa tôi đến trang chủ',
    'Xem giỏ hàng của tôi',
];

const getSessionId = () => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = 'session_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('chat_session_id', newId);
    return newId;
};

// Component hiển thị sản phẩm dạng card trong chat
const ProductCard = ({ product, onNavigate }) => {
    // Dự phòng trường hợp backend trả về id hoặc product_slug thay vì slug
    const targetSlug = product.slug || product.product_slug || product.id;

    return (
        <div
            onClick={() => {
                if (targetSlug) onNavigate(`/product/${targetSlug}`);
            }}
            style={{
                border: '1px solid #e0dffe', borderRadius: 10, padding: '8px 10px',
                cursor: 'pointer', background: '#faf9ff', marginTop: 6,
                display: 'flex', gap: 10, alignItems: 'center',
                transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0edff'}
            onMouseLeave={e => e.currentTarget.style.background = '#faf9ff'}
        >
            {product.images && product.images.length > 0 && (
                <img src={product.images[0].image || product.images[0]} alt={product.name} style={{
                    width: 44, height: 44, objectFit: 'cover', borderRadius: 6
                }} />
            )}
            <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>
                    {product.name}
                </div>
                <div style={{ fontSize: 12, color: '#534AB7' }}>
                    Từ {product.min_price?.toLocaleString('vi-VN')}đ
                </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>→</div>
        </div>
    );
};

const MiniOrderForm = ({ productSlug, productName, onSubmit, isOrdering, initialColor, initialSize, initialQuantity, availableColors, availableSizes }) => {
    const [form, setForm] = useState({
        product_slug: productSlug,
        full_name: '',
        phone: '',
        address: '',
        color: initialColor || (availableColors?.[0] || ''),
        size: initialSize || (availableSizes?.[0] || ''),
        quantity: initialQuantity || 1,
        payment_method: 'cod'
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const inputStyle = {
        width: '100%', padding: '8px 10px', fontSize: 13,
        border: '1px solid #e0dffe', borderRadius: 6, marginTop: 8,
        outline: 'none', boxSizing: 'border-box', background: '#faf9ff'
    };

    const selectStyle = {
        ...inputStyle, marginTop: 0, padding: '7px 10px',
        cursor: 'pointer', appearance: 'auto'
    };

    return (
        <div style={{
            background: '#fff', border: '1px solid #e0dffe',
            borderRadius: 12, padding: 12, marginTop: 8,
            boxShadow: '0 2px 10px rgba(127, 119, 221, 0.1)'
        }}>
            {/* Tên sản phẩm đang mua */}
            {productName && (
                <div style={{
                    fontSize: 12, color: '#fff', fontWeight: 600,
                    background: '#7F77DD', borderRadius: 8,
                    padding: '6px 10px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6
                }}>
                    🛍️ {productName}
                </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', marginBottom: 4 }}>
                📝 Thông tin nhận hàng
            </div>

            <input name="full_name" placeholder="Họ và tên..." onChange={handleChange} style={inputStyle} />
            <input name="phone" placeholder="Số điện thoại..." onChange={handleChange} style={inputStyle} />
            <input name="address" placeholder="Địa chỉ giao hàng..." onChange={handleChange} style={inputStyle} />

            {/* Màu sắc & Kích thước */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Màu sắc</div>
                    {availableColors && availableColors.length > 0 ? (
                        <select name="color" value={form.color} onChange={handleChange} style={selectStyle}>
                            <option value="">-- Chọn màu --</option>
                            {availableColors.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    ) : (
                        <input name="color" value={form.color} placeholder="VD: Đen" onChange={handleChange}
                            style={{ ...inputStyle, marginTop: 0 }} />
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Kích thước</div>
                    {availableSizes && availableSizes.length > 0 ? (
                        <select name="size" value={form.size} onChange={handleChange} style={selectStyle}>
                            <option value="">-- Chọn size --</option>
                            {availableSizes.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    ) : (
                        <input name="size" value={form.size} placeholder="VD: S, M, L" onChange={handleChange}
                            style={{ ...inputStyle, marginTop: 0 }} />
                    )}
                </div>
            </div>

            {/* Số lượng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Số lượng:</span>
                <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleChange}
                    style={{ ...inputStyle, width: 60, marginTop: 0 }} />
            </div>

            {/* Phương thức thanh toán */}
            <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>💳 Phương thức thanh toán</div>
                <select name="payment_method" value={form.payment_method} onChange={handleChange} style={selectStyle}>
                    <option value="cod">🚚 Thanh toán khi nhận hàng (COD)</option>
                    <option value="vnpay">🏦 VNPay</option>
                    <option value="momo">💜 Ví MoMo</option>
                    <option value="stripe">💳 Thẻ tín dụng (Stripe)</option>
                </select>
            </div>

            <button
                onClick={() => onSubmit(form)}
                disabled={isOrdering}
                style={{
                    width: '100%', padding: '10px 0', marginTop: 14,
                    background: isOrdering ? '#ccc' : '#7F77DD',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: isOrdering ? 'not-allowed' : 'pointer',
                    transition: '0.2s'
                }}
            >
                {isOrdering ? 'Đang xử lý...' : '✅ Xác nhận Đặt hàng'}
            </button>
        </div>
    );
};


function ProductChat({ slug, productName, selectedColor, selectedSize, selectedQuantity }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: productName
                ? `Xin chào! Mình có thể tư vấn về "${productName}" hoặc giúp bạn đặt hàng 😊`
                : 'Xin chào! Mình là trợ lý AI của Blue Sky Fashion. Mình có thể tư vấn, tìm sản phẩm, hoặc đặt hàng hộ bạn! 🛍️',
            action: 'none'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOrdering, setIsOrdering] = useState(false);

    const bottomRef = useRef(null);

    const userId = user ? user.id : null;
    const sessionId = userId ? `user_${userId}` : getSessionId();

    // Load chat history on mount or when sessionId changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history/?session_id=${sessionId}`);
                if (res.data && res.data.length > 0) {
                    setMessages(res.data);
                } else {
                    // Reset to initial message if there's no history for this session
                    setMessages([
                        {
                            role: 'assistant',
                            content: productName
                                ? `Xin chào! Mình có thể tư vấn về "${productName}" hoặc giúp bạn đặt hàng 😊`
                                : 'Xin chào! Mình là trợ lý AI của Blue Sky Fashion. Mình có thể tư vấn, tìm sản phẩm, hoặc đặt hàng hộ bạn! 🛍️',
                            action: 'none'
                        }
                    ]);
                }
            } catch (error) {
                console.error('Failed to load chat history', error);
            }
        };
        fetchHistory();
    }, [sessionId, productName]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Hàm chuyển trang được thiết kế lại an toàn hơn
    // 1. HÀM CHUYỂN TRANG CƯỠNG CHẾ
    const handleNavigate = (path) => {
        if (!path) return;

        // Làm sạch đường link (xóa các dấu câu thừa như . , ! ? ở cuối chữ nếu AI lỡ sinh ra)
        let formattedPath = path.trim().replace(/[.,!?;:]$/, '');

        if (!formattedPath.startsWith('/')) {
            formattedPath = '/' + formattedPath;
        }

        // Ép trình duyệt chuyển trang ngay lập tức (Chắc chắn 100% sẽ chuyển)
        window.location.href = formattedPath;
    };

    // 2. HÀM GỬI TIN NHẮN (Bắt link thông minh hơn)
    const send = async (text) => {
        if (!text.trim() || loading) return;
        addMessage('user', text);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat/', {
                message: text,
                session_id: sessionId,
                // Gửi thêm thông tin trang hiện tại cho AI
                current_url: window.location.origin + location.pathname,
                path_name: location.pathname,
                user_id: userId,
                slug: slug, // Gửi thêm slug của sản phẩm đang xem
                selected_color: selectedColor,
                selected_size: selectedSize,
                selected_quantity: selectedQuantity
            });

            let { reply, action, data } = res.data;

            // Chỉ bắt link khi AI chắc chắn muốn điều hướng (có từ "chuyển", "đến trang", "xem tại")
            // Tránh trigger navigation nhầm khi AI chỉ đề cập đường dẫn trong câu thông thường
            const navIntent = /chuy[eể]n|đến trang|xem tại|đi đến/i.test(reply);
            const linkMatch = reply.match(/\/(product|products|cart|checkout|login|profile|admin)(\/[\w-]*)?/);

            if (navIntent && linkMatch && (!action || action === 'none')) {
                action = 'navigate';
                data = { ...(data || {}), path: linkMatch[0] };
            }

            addMessage('assistant', reply, { action, data });

            // THỰC THI CHUYỂN TRANG TỰ ĐỘNG
            if (action === 'navigate' && data?.path) {
                setTimeout(() => {
                    handleNavigate(data.path);
                }, 1200); // Đợi 1.2s cho người dùng đọc tin nhắn rồi mới chuyển
            }

        } catch (error) {
            console.error(error);
            addMessage('assistant', 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 🙏');
        }
        setLoading(false);
    };

    const addMessage = (role, content, extra = {}) => {
        setMessages(prev => [...prev, { role, content, ...extra }]);
    };


    const handleOrderSubmit = async (formData) => {
        setIsOrdering(true);
        try {
            const res = await api.post('/submit-checkout/', formData);
            addMessage('assistant', res.data.message || '🎉 Đặt hàng thành công! Cảm ơn bạn nhé.');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin! 😢';
            addMessage('assistant', `Lỗi: ${errorMsg}`);
        }
        setIsOrdering(false);
    };

    const renderMessage = (m, i) => {
        const isUser = m.role === 'user';
        return (
            <div key={i}>
                <div style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 6, marginBottom: 2
                }}>
                    {!isUser && (
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: '#EEEDFE', flexShrink: 0,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11
                        }}>✦</div>
                    )}
                    <div style={{
                        maxWidth: '78%', padding: '9px 13px',
                        fontSize: 13.5, lineHeight: 1.6,
                        background: isUser ? '#7F77DD' : '#f3f3f5',
                        color: isUser ? '#fff' : '#1d1d1f',
                        borderRadius: isUser
                            ? '16px 4px 16px 16px'
                            : '4px 16px 16px 16px',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {m.content}
                    </div>
                </div>

                {m.action === 'navigate' && m.data?.path && (
                    <div style={{ paddingLeft: 32, marginTop: 4 }}>
                        <button
                            onClick={() => handleNavigate(m.data.path)}
                            style={{
                                fontSize: 12, padding: '5px 14px',
                                borderRadius: 20, border: 'none',
                                background: '#7F77DD', color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            Đi đến {m.data.path} →
                        </button>
                    </div>
                )}

                {m.action === 'show_order_form' && m.data?.product_slug && (
                    <div style={{ paddingLeft: 32, marginTop: 4 }}>
                        <MiniOrderForm
                            productSlug={m.data.product_slug}
                            productName={m.data.product_name}
                            initialColor={m.data.color || selectedColor}
                            initialSize={m.data.size || selectedSize}
                            initialQuantity={m.data.quantity || selectedQuantity}
                            availableColors={m.data.available_colors}
                            availableSizes={m.data.available_sizes}
                            onSubmit={handleOrderSubmit}
                            isOrdering={isOrdering}
                        />
                    </div>
                )}

                {m.action === 'show_products' && m.data?.products?.map((p, j) => (
                    <div key={j} style={{ paddingLeft: 32, marginTop: 4 }}>
                        <ProductCard product={p} onNavigate={handleNavigate} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
                    width: 56, height: 56, borderRadius: '50%',
                    background: open ? '#444' : '#7F77DD',
                    color: '#fff', border: 'none', fontSize: 22,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(127,119,221,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s'
                }}
            >
                {open ? '✕' : '💬'}
            </button>

            {open && (
                <div style={{
                    position: 'fixed', bottom: 90, right: 24, zIndex: 999,
                    width: 370, height: 540, borderRadius: 16,
                    background: '#fff',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid #eee'
                }}>
                    <div style={{
                        padding: '12px 16px', background: '#7F77DD',
                        color: '#fff', display: 'flex',
                        alignItems: 'center', gap: 10, flexShrink: 0
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 16
                        }}>✦</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                                Trợ lý AI Blue Sky
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.85 }}>
                                ● Tư vấn • Điều hướng • Đặt hàng
                            </div>
                        </div>
                    </div>

                    <div style={{
                        flex: 1, overflowY: 'auto',
                        padding: '14px 12px',
                        display: 'flex', flexDirection: 'column', gap: 10
                    }}>
                        {messages.map((m, i) => renderMessage(m, i))}

                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: '#EEEDFE', flexShrink: 0,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 11
                                }}>✦</div>
                                <div style={{
                                    background: '#f3f3f5', padding: '10px 14px',
                                    borderRadius: '4px 16px 16px 16px',
                                    display: 'flex', gap: 5, alignItems: 'center'
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#aaa',
                                            animation: `cb 1.2s ${i * 0.2}s infinite`
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.length === 1 && !loading && (
                            <div style={{
                                display: 'flex', flexWrap: 'wrap',
                                gap: 6, marginTop: 4, paddingLeft: 32
                            }}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} onClick={() => send(s)} style={{
                                        fontSize: 12, padding: '5px 11px',
                                        borderRadius: 20,
                                        border: '1px solid #e0dffe',
                                        background: '#f5f3ff', color: '#534AB7',
                                        cursor: 'pointer'
                                    }}>{s}</button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div style={{
                        padding: '10px 12px',
                        borderTop: '1px solid #eee',
                        display: 'flex', gap: 8,
                        flexShrink: 0, background: '#fff'
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                            placeholder="Hỏi gì đó hoặc ra lệnh cho AI..."
                            disabled={loading}
                            style={{
                                flex: 1, padding: '8px 14px',
                                borderRadius: 20, fontSize: 13.5,
                                border: '1px solid #ddd', outline: 'none',
                                color: '#1d1d1f'
                            }}
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={loading || !input.trim()}
                            style={{
                                width: 38, height: 38, borderRadius: '50%',
                                background: loading || !input.trim() ? '#ddd' : '#7F77DD',
                                border: 'none',
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                color: '#fff', fontSize: 16, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >↑</button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes cb {
                    0%,60%,100% { transform: translateY(0); }
                    30% { transform: translateY(-5px); }
                }
            `}</style>
        </>
    );
}

export default ProductChat;