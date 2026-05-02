import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import Suggestion from '../components/Suggestion';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${slug}/`);
                setProduct(res.data);
                const primary = res.data.images.find(img => img.is_primary)?.image || res.data.images[0]?.image;
                setMainImage(primary);
            } catch (err) {
                console.error("Error fetching product", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [slug]);
    const [price, setPrice] = useState(0);

    useEffect(() => {
        if (!product) return;

        const idproductdefault = product.images?.find(img => img.is_primary)?.variant;

        const variant = product.variants?.find(v => v.id === idproductdefault);

        if (variant) {
            setPrice(Number(variant.price));
        }
    }, [product]);

    if (loading) return <div className="loading">Đang tải...</div>;
    if (!product) return <div className="error">Không tìm thấy sản phẩm.</div>;
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const colors = [
        ...new Set(product.variants.map(v => v.color))
    ].filter(Boolean);
    function image_change(colorId) {
        const colorclick = colorId;
        const imagess = product.images.find(img => img.color === colorclick)?.image;
        setMainImage(imagess);
    }
    const onBuyNow = () => {
        // Basic validation if variants exist
        const hasColors = product.variants.length > 0 && [...new Set(product.variants.map(v => v.color_name))].filter(Boolean).length > 0;
        const hasSizes = product.variants.length > 0 && [...new Set(product.variants.map(v => v.size_name))].filter(Boolean).length > 0;

        if (hasColors && !selectedColor) {
            alert('Vui lòng chọn màu sắc!');
            return;
        }
        if (hasSizes && !selectedSize) {
            alert('Vui lòng chọn kích thước!');
            return;
        }

        addToCart(product, quantity);
        navigate('/checkout');
    };

    const handleAddToCart = () => {
        // Basic validation if variants exist
        const hasColors = product.variants.length > 0 && [...new Set(product.variants.map(v => v.color_name))].filter(Boolean).length > 0;
        const hasSizes = product.variants.length > 0 && [...new Set(product.variants.map(v => v.size_name))].filter(Boolean).length > 0;

        if (hasColors && !selectedColor) {
            alert('Vui lòng chọn màu sắc!');
            return;
        }
        if (hasSizes && !selectedSize) {
            alert('Vui lòng chọn kích thước!');
            return;
        }

        addToCart({ ...product, price: price, }, quantity);
        alert('Đã thêm vào giỏ hàng!');
    };
    function getprice(colorId) {
        const colorclick = colorId;
        const price = product.variants.find(v => v.color === colorclick)?.price;
        console.log(colorId)
        setPrice(price);
    }

    function getpriceimage(id) {
        // console.log(id);
        const variant = product.variants.find(img => img.id === id);
        if (variant) {
            setPrice(Number(variant.price));
            setSelectedColor(variant.color); // 👈 THÊM DÒNG NÀY
        }

    }

    const handleQuantityChange = (e) => {
        console.log(e.target.value);
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value < 0) {
            setQuantity(1);
        } else {
            setQuantity(value);
        }
    };

    return (
        <div className="product-detail-page">
            <Header scrolled={true} />
            <main className="product-detail-container">
                <div className="product-gallery">
                    <div className="main-image-box">
                        <img src={mainImage} alt={product.name} />
                    </div>
                    <div className="thumbnail-list">
                        {product.images.map((img, idx) => (
                            <div
                                key={idx}
                                className={`thumbnail ${mainImage === img.image ? 'active' : ''}`}
                                onClick={() => { setMainImage(img.image); getpriceimage(img.variant) }}
                            >
                                <img src={img.image} alt="" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="product-info-section">
                    <nav className="breadcrumb">
                        <span>Trang chủ</span> / <Link to={`/products?category=${product.category}`}>{product.category_name}</Link>
                    </nav>
                    <h1 className="detail-name">{product.name}</h1>
                    <div className="detail-price">{formatPrice(price)}</div>

                    <div className="detail-description">
                        <h3>Mô tả sản phẩm</h3>
                        <p>{product.description || "Chưa có mô tả cho sản phẩm này."}</p>
                    </div>

                    {colors.length > 0 && (
                        <div className="selection-group">
                            <h3>Màu sắc</h3>
                            <div className="options-grid">
                                {
                                    colors.map((v) => (
                                        <button
                                            key={v}
                                            className={`option-btn ${selectedColor === v ? 'active' : ''}`}
                                            onClick={() => { setSelectedColor(v); image_change(v); getprice(v) }}
                                            value={v}
                                        >
                                            {product.variants.find(color => color.color === v)?.color_name}

                                        </button>
                                    ))
                                }
                            </div>

                        </div>
                    )}

                    {product.variants.length > 0 && [...new Set(product.variants.map(v => v.size_name))].filter(Boolean).length > 0 && (
                        <div className="selection-group">
                            <h3>Kích thước</h3>
                            <div className="options-grid">
                                {[...new Set(product.variants.map(v => v.size_name))].map((size, idx) => (
                                    <button
                                        key={idx}
                                        className={`option-btn ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="selection-group">
                        <div className="quantity-selector">
                            {/* <button className="quantity-btn" onClick={() => setQuantity(quantity - 1)}>-</button>
                            <input type="text" value={quantity} readOnly />
                            <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button> */}
                            <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}><i className="bi bi-plus"></i></button>
                            <input type="text" value={quantity} onChange={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 1) {
                                    setQuantity(val);
                                }
                                else if (e.target.value === "") {
                                    setQuantity(0);
                                }
                            }} />
                            <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}><i className="bi bi-dash"></i></button>
                        </div>
                    </div>

                    <div className="purchase-actions">
                        <button className="add-to-cart-btn" onClick={handleAddToCart}>
                            Thêm vào giỏ hàng
                        </button>
                        <button className="buy-now-btn" onClick={onBuyNow}>
                            Mua ngay
                        </button>
                    </div>

                    <div className="product-meta">
                        <p><strong>SKU:</strong> {product.variants[0]?.sku || 'N/A'}</p>
                        <p><strong>Danh mục:</strong> {product.category_name}</p>
                    </div>
                </div>
            </main>
            <Suggestion category={product.category} />
            <Footer />
            <style jsx>{`
                .product-detail-page { background: #fff; min-height: 100vh; }
                .product-detail-container { max-width: 1400px; margin: 120px auto 60px; padding: 0 5%; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; }
                @media (max-width: 1024px) { .product-detail-container { grid-template-columns: 1fr; margin-top: 100px; } }
                .product-gallery { position: sticky; top: 120px; height: fit-content; }
                .main-image-box { background: #f5f5f7; border-radius: 20px; overflow: hidden; aspect-ratio: 3/4; }
                .main-image-box img { width: 100%; height: 100%; object-fit: cover; }
                .thumbnail-list { display: flex; gap: 15px; margin-top: 20px; overflow-x: auto; padding-bottom: 10px; }
                .thumbnail { width: 80px; height: 100px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; transition: all 0.2s; }
                .thumbnail.active { border-color: #000; }
                .thumbnail img { width: 100%; height: 100%; object-fit: cover; }
                .product-info-section { display: flex; flex-direction: column; gap: 25px; }
                .breadcrumb { width: 100%;
                                display: flex;
                                font-size: 14px;
                                color: #86868b;
                                text-align: center;
                                justify-content: flex-start;
                                gap: 10px;}
                .detail-name { font-size: 36px; font-weight: 700; color: #1d1d1f; }
                .detail-price { font-size: 24px; font-weight: 600; color: #1d1d1f; }
                .detail-description h3, .selection-group h3 { font-size: 14px; text-transform: uppercase; color: #86868b; letter-spacing: 1px; margin-bottom: 15px; }
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .quantity-btn {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #d2d2d7;
                    background: #fff;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .quantity-selector input {
                    width: 150px;
                    height: 40px;
                    border: 1px solid #d2d2d7;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                }
                .quantity-btn:hover {
                    border-color: #000;
                    background-color: #000;
                    color: #fff;
                }

                .quantity-btn.active {
                    background: #000;
                    color: #fff;
                    border-color: #000;
                }
                .detail-description p { color: #424245; line-height: 1.6; }
                .options-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                .option-btn { padding: 8px 20px; border: 1px solid #d2d2d7; background: #fff; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
                .option-btn:hover { border-color: #000; }
                .option-btn.active { background: #000; color: #fff; border-color: #000; }
                .purchase-actions { display: flex; gap: 15px; margin-top: 20px; }
                .add-to-cart-btn, .buy-now-btn { flex: 1; padding: 16px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 16px; }
                .add-to-cart-btn { background: #fff; border: 2px solid #000; color: #000; }
                .add-to-cart-btn:hover { background: #f5f5f7; }
                .buy-now-btn { background: #000; border: none; color: #fff; }
                .buy-now-btn:hover { background: #333; }
                .product-meta { padding-top: 30px; border-top: 1px solid #d2d2d7; font-size: 14px; color: #86868b; display: flex; flex-direction: column; gap: 10px; }
            `}</style>
        </div>
    );
};

export default ProductDetail;
