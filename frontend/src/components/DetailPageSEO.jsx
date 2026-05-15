import { useEffect } from "react";
import useJsonLd from "../hooks/useJsonLd";
import { Helmet } from "react-helmet-async";

export default function DetailPageSEO({ product = null, pageTitle, pageDescription, baseUrl }) {
    const title = pageTitle || product?.name || "Chi tiết sản phẩm";
    const description = pageDescription || product?.description || "";
    const imageUrl = product?.images?.[0]?.image ? (product.images[0].image.startsWith('http') ? product.images[0].image : `${baseUrl}${product.images[0].image}`) : "";
    const url = typeof window !== 'undefined' ? window.location.href : `${baseUrl}/${product?.category_slug || 'san-pham'}/${product?.slug || ''}`;

    const productSchema = product ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.meta_description || product.description || "",
        url: url,
        image: product.images?.length > 0 ? product.images.map(img => img.image) : [],
        ...(product.brand && {
            brand: { "@type": "Brand", name: product.brand },
        }),
        offers: {
            "@type": "Offer",
            price: parseFloat(product?.variants?.[0]?.price || 0),
            priceCurrency: "VND",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            url: url,
        },
        ...(product.review_count > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.average_rating,
                reviewCount: product.review_count,
            },
        }),
    } : null;

    const breadcrumbSchema = product ? {
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
                name: product.category_name || "Sản phẩm",
                item: `${baseUrl}/products?category=${product.category_slug || ''}`
            },
            {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: url
            }
        ]
    } : null;

    useJsonLd("schema-product", productSchema);
    useJsonLd("schema-breadcrumb", breadcrumbSchema);

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="product" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {imageUrl && <meta property="og:image" content={imageUrl} />}

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            {imageUrl && <meta property="twitter:image" content={imageUrl} />}
        </Helmet>
    );
}
