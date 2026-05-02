import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import ListProduct from '../components/ListProduct';
import '../product.css';


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
    useEffect(() => {
        if (!product || !selectedColor || !selectedSize) return;
        const variant = product.variants.find(
            v => v.color === selectedColor && v.size === selectedSize
        );
        if (variant) setPrice(Number(variant.price));
    }, [selectedColor, selectedSize]);
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

        addToCart({ ...product, price: price, }, quantity, selectedColor, selectedSize, idVariant);
        alert('Đã thêm vào giỏ hàng!');

    };
    function getprice(colorId) {
        // Nếu đã chọn size → lấy giá đúng variant (color + size)
        // Nếu chưa chọn size → lấy giá variant đầu tiên của màu đó
        const variant = selectedSize
            ? product.variants.find(v => v.color === colorId && v.size === selectedSize)
            : product.variants.find(v => v.color === colorId);
        if (variant) setPrice(Number(variant.price));
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
        // console.log(e.target.value);
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value < 0) {
            setQuantity(1);
        } else {
            setQuantity(value);
        }
    };

    const idVariant = product?.variants?.find(p =>
        p.color === selectedColor && p.size === selectedSize
    )?.id
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

                    {/* Màu sắc */}
                    {colors.length > 0 && (
                        <div className="selection-group">
                            <h3>Màu sắc</h3>
                            <div className="options-grid">
                                {colors.map((colorId) => {
                                    // Nếu đã chọn size → chỉ hiện màu có size đó
                                    const available = selectedSize
                                        ? product.variants.some(v => v.color === colorId && v.size === selectedSize)
                                        : true;

                                    return (
                                        <button
                                            key={colorId}
                                            className={`option-btn ${selectedColor === colorId ? 'active' : ''} ${!available ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!available) return;

                                                if (selectedColor === colorId) {
                                                    setSelectedColor(null);
                                                }
                                                else {
                                                    setSelectedColor(colorId);
                                                    image_change(colorId);
                                                    getprice(colorId);
                                                }
                                            }}
                                            style={{ opacity: available ? 1 : 0.35, cursor: available ? 'pointer' : 'not-allowed' }}
                                        >
                                            {product.variants.find(v => v.color === colorId)?.color_name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Kích thước */}
                    {product.variants.length > 0 && (
                        <div className="selection-group">
                            <h3>Kích thước</h3>
                            <div className="options-grid">
                                {/* Lấy tất cả size duy nhất */}
                                {[...new Map(
                                    product.variants.map(v => [v.size, { sizeId: v.size, sizeName: v.size_name }])
                                ).values()].map(({ sizeId, sizeName }) => {
                                    // Nếu đã chọn màu → chỉ hiện size có màu đó
                                    const available = selectedColor
                                        ? product.variants.some(v => v.size === sizeId && v.color === selectedColor)
                                        : true;

                                    return (
                                        <button
                                            key={sizeId}
                                            className={`option-btn ${selectedSize === sizeId ? 'active' : ''}`}
                                            onClick={() => {
                                                if (!available) return;

                                                if (selectedSize === sizeId) {
                                                    setSelectedSize(null);
                                                }
                                                else {
                                                    setSelectedSize(sizeId);
                                                    // getprice(null,sizeId);
                                                }
                                            }}
                                            style={{ opacity: available ? 1 : 0.35, cursor: available ? 'pointer' : 'not-allowed' }}
                                        >
                                            {sizeName}
                                        </button>
                                    );
                                })}
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
            <ListProduct category={product.category} slugged={product.slug} />
            <Footer />
        </div>
    );
};

export default ProductDetail;
