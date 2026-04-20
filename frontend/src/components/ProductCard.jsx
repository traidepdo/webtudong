import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import aos from 'aos';
import 'aos/dist/aos.css';

const ProductCard = ({ product }) => {
    const primaryImage = product.images?.find(img => img.is_primary)?.image ||
        product.images?.[0]?.image ||
        'https://via.placeholder.com/400x533?text=No+Image';

    // Format price to VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };
    function getprice(product) {
        const idproduct = product.images.find(img => img.is_primary)?.variant;

        const variant = product.variants.find(v => v.id === idproduct);

        return variant ? Number(variant.price) : 0;
    }
    return (
        <div className="product-card group" data-aos="fade-up">
            <div className="product-image-wrapper">
                <Link to={`/product/${product.slug}`}>
                    <img
                        src={primaryImage}
                        alt={product.name}
                        className="product-image"
                    />
                </Link>
                <div className="product-actions-overlay">
                    <Link to={`/product/${product.slug}`} className="view-more-btn">
                        Xem thêm
                    </Link>
                </div>
                <div className="product-badge">NEW</div>
            </div>
            <div className="product-info">
                <Link to={`/product/${product.slug}`} className="product-category-link">
                    {product.category_name}
                </Link>
                <h3 className="product-name">
                    <Link to={`/product/${product.slug}`}>{product.name}</Link>
                </h3>
                <div className="product-price-row">
                    <span className="current-price">{formatPrice(getprice(product))}</span>
                </div>
                <div className="product-colors">
                    {product.variants.map(variant => (
                        <span key={variant.id} className={`color-dot color-${variant.color}`}></span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
