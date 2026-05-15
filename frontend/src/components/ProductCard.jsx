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
        if (!product || !product.variants || product.variants.length === 0) return product?.price || 0;
        const primaryImage = product.images?.find(img => img.is_primary);
        if (primaryImage && primaryImage.variant) {
            const variant = product.variants.find(v => v.id === primaryImage.variant);
            if (variant) return Number(variant.price);
        }
        return Number(product.variants[0].price);
    }
    return (
        <div className="product-card group" data-aos="fade-up">
            <div className="product-image-wrapper">
                <Link to={`/${product.category_slug || 'san-pham'}/${product.slug}`} className="product-image-link">
                    <img
                        src={primaryImage}
                        alt={product.name}
                        className="product-image"
                    />
                </Link>
                <div className="product-actions-overlay">
                    <Link to={`/${product.category_slug || 'san-pham'}/${product.slug}`} className="view-more-btn">
                        Xem thêm
                    </Link>
                </div>
                <div className="product-badge">NEW</div>
            </div>
            <div className="product-info">
                <Link to={`/products?category=${product.category_slug || 'all'}`} className="product-category-link">
                    {product.category_name}
                </Link>
                <h3 className="product-name">
                    <Link to={`/${product.category_slug || 'san-pham'}/${product.slug}`}>{product.name}</Link>
                </h3>
                <div className="product-price-row">
                    <span className="current-price">{formatPrice(getprice(product))}</span>
                </div>
                <div className="product-colors">
                    {[...new Map(product.variants.map(v => [v.color, v])).values()].map(variant => (
                        <span
                            key={variant.id}
                            className="color-dot"
                            style={{ backgroundColor: variant.color_hex || '#ccc' }}
                            title={variant.color_name}
                        ></span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
