import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
    const primaryImage =
        product.images?.find(img => img.is_primary)?.image ||
        product.images?.[0]?.image ||
        'https://via.placeholder.com/400x533?text=No+Image';

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const getPrice = (product) => {
        if (!product?.variants?.length) return product?.price || 0;
        const primaryImg = product.images?.find(img => img.is_primary);
        if (primaryImg?.variant) {
            const variant = product.variants.find(v => v.id === primaryImg.variant);
            if (variant) return Number(variant.price);
        }
        return Number(product.variants[0].price);
    };

    const uniqueColors = [...new Map(product.variants.map(v => [v.color, v])).values()];
    const productUrl = `/${product.category_slug || 'san-pham'}/${product.slug}`;

    return (
        <div className="pc-card">
            <div className="pc-image-wrap">
                <Link to={productUrl}>
                    <img src={primaryImage} alt={product.name} className="pc-image" />
                </Link>

                <span className="pc-badge">NEW</span>

                <div className="pc-overlay">
                    <Link to={productUrl} className="pc-btn-view">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        Xem sản phẩm
                    </Link>
                </div>
            </div>

            <div className="pc-body">
                <Link to={`/${product.category_slug || 'all'}`} className="pc-category">
                    {product.category_name}
                </Link>

                <h3 className="pc-name">
                    <Link to={productUrl}>{product.name}</Link>
                </h3>

                <div className="pc-footer">
                    <span className="pc-price">{formatPrice(getPrice(product))}</span>

                    <div className="pc-colors">
                        {uniqueColors.map(variant => (
                            <span
                                key={variant.id}
                                className="pc-dot"
                                style={{ backgroundColor: variant.color_hex || '#ccc' }}
                                title={variant.color_name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;