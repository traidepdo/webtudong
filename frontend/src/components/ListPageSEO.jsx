/**
 * ListPageSEO.jsx
 * Đặt component này vào trang danh sách sản phẩm.
 * Nó inject 2 thứ vào <head>:
 *   1. <title> + <meta description>
 *   2. JSON-LD ItemList schema → Google hiểu đây là danh sách sản phẩm
 */
import { useEffect } from "react";
import useJsonLd from "../hooks/useJsonLd";
import { Helmet } from "react-helmet-async";

export default function ListPageSEO({ products = [], pageTitle, pageDescription, baseUrl }) {
    const title = pageTitle || "Danh sách sản phẩm";
    const description = pageDescription || "Khám phá danh sách sản phẩm cao cấp.";
    const url = typeof window !== 'undefined' ? window.location.href : baseUrl;

    // ── 2. JSON-LD: ItemList ────────────────────────────────────────────────────
    // Schema này giúp Google hiểu trang là một danh sách sản phẩm có cấu trúc.
    // Mỗi sản phẩm trong list có thể hiện Rich Snippet riêng (giá, sao).
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: pageTitle || "Danh sách sản phẩm",
        description: pageDescription,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,           // Thứ tự trong danh sách — Google dùng để rank
            url: `${baseUrl}/${product.category_slug || 'san-pham'}/${product.slug}`,
            item: {
                "@type": "Product",
                name: product.name,
                url: `${baseUrl}/${product.category_slug || 'san-pham'}/${product.slug}`,
                description: product.meta_description || product.description || "",
                // Ảnh đại diện
                image: product.primary_image?.url
                    ? (product.primary_image.url.startsWith("http")
                        ? product.primary_image.url
                        : `${baseUrl}${product.primary_image.url}`)
                    : undefined,
                // Brand nếu có
                ...(product.brand && {
                    brand: { "@type": "Brand", name: product.brand },
                }),
                // Giá — dùng AggregateOffer nếu có nhiều variant
                offers: {
                    "@type": "Offer",
                    price: parseFloat(product.min_price || 0),
                    priceCurrency: "VND",
                    availability: product.is_in_stock
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    itemCondition: "https://schema.org/NewCondition",
                    url: `${baseUrl}/${product.category_slug || 'san-pham'}/${product.slug}`,
                },
                // Rating — chỉ thêm nếu có review
                ...(product.review_count > 0 && {
                    aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: product.average_rating,
                        reviewCount: product.review_count,
                        bestRating: 5,
                        worstRating: 1,
                    },
                }),
            },
        })),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: baseUrl
            },
            {
                "@type": "ListItem",
                position: 2,
                name: pageTitle || "Sản phẩm",
                item: url
            }
        ]
    };

    useJsonLd("schema-itemlist", itemListSchema);
    useJsonLd("schema-breadcrumb", breadcrumbSchema);

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            
            {/* Twitter */}
            <meta property="twitter:card" content="summary" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
        </Helmet>
    );
}