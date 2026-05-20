import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useLocation, Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../api';
import aos from 'aos';
import 'aos/dist/aos.css';
import "../styles/Products.css";

// ============================================================
// QUY TẮC 9: Schema.org JSON-LD builders
// ============================================================
const buildItemListSchema = (products, baseUrl, categoryName, categorySlug) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryName === 'all' ? 'Tất cả sản phẩm' : categoryName,
    url: `${baseUrl}/products/${categorySlug || 'all'}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
            '@type': 'Product',
            name: p.name,
            url: `${baseUrl}/${p.category_slug || 'all'}/${p.slug}`,
            brand: { '@type': 'Brand', name: p.brand || 'Blue Sky' },
            description: p.meta_description || p.description || '',
            image: p.images?.[0]?.image || '',
            offers: p.variants?.length > 0 ? {
                '@type': 'AggregateOffer',
                priceCurrency: 'VND',
                lowPrice: Math.min(...p.variants.map(v => parseFloat(v.price || 0))),
                highPrice: Math.max(...p.variants.map(v => parseFloat(v.price || 0))),
                offerCount: p.variants.length,
                availability: p.variants.some(v => v.stock_quantity > 0)
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            } : undefined,
            aggregateRating: p.average_rating ? {
                '@type': 'AggregateRating',
                ratingValue: p.average_rating,
                reviewCount: p.review_count || 1,
            } : undefined,
        },
    })),
});

const buildBreadcrumbSchema = (crumbs, baseUrl) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: `${baseUrl}${c.url}`,
    })),
});

const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Stars component - QUY TẮC 6
const StarRating = ({ rating = 0, count = 0 }) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
        <div className="ps-stars" aria-label={`${rating} trên 5 sao, ${count} đánh giá`}>
            {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"
                    fill={i <= full ? '#d4af37' : (i === full + 1 && half ? 'url(#half)' : 'none')}
                    stroke="#d4af37" strokeWidth="1.5">
                    <defs>
                        <linearGradient id="half"><stop offset="50%" stopColor="#d4af37" /><stop offset="50%" stopColor="transparent" /></linearGradient>
                    </defs>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
            {count > 0 && <span className="ps-stars-count">({count})</span>}
        </div>
    );
};

// ============================================================
// COMPONENT CHÍNH
// ============================================================
const Products = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { categorySlug, brandSlug } = useParams();
    const [searchParams] = useSearchParams();
    const [currentBrand, setCurrentBrand] = useState(null);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState(searchParams.get('q') || searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceRange, setPriceRange] = useState(2000000);
    const [selectedSize, setSelectedSize] = useState('all');
    const [selectedColor, setSelectedColor] = useState('all');
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sortBy, setSortBy] = useState('default'); // QUY TẮC 7: Sắp xếp
    const [visibleCount, setVisibleCount] = useState(12); // QUY TẮC 8: Phân trang

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const canonicalUrl = categorySlug && categorySlug !== 'all'
        ? `${baseUrl}/products/${categorySlug}`
        : `${baseUrl}/products`;

    useEffect(() => {
        const q = searchParams.get('q') || searchParams.get('search');
        if (q !== null) setSearch(q);
    }, [searchParams]);

    useEffect(() => {
        aos.init({ duration: 600, once: true, offset: 80 });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(location.search);
                const sq = params.get('q') || params.get('search');
                const apiParams = {};
                if (sq) apiParams.search = sq;
                if (categorySlug && categorySlug !== 'all') apiParams.category = categorySlug;
                if (brandSlug) apiParams.brand = brandSlug;

                const [prodRes, catRes, brandRes] = await Promise.all([
                    api.get('/products/', { params: apiParams }),
                    api.get('/categories/'),
                    api.get('/brands/')
                ]);

                if (categorySlug && categorySlug !== 'all') {
                    const matched = catRes.data.find(cat => cat.slug === categorySlug);
                    if (!matched) { navigate('/404', { replace: true }); return; }
                    setCurrentCategory(matched);
                    setSelectedCategory(matched.name);
                } else {
                    setCurrentCategory(null);
                    setSelectedCategory('all');
                }

                if (brandSlug) {
                    const brandName = prodRes.data[0]?.brand_name || brandSlug;
                    setCurrentBrand({ slug: brandSlug, name: brandName });
                } else {
                    setCurrentBrand(null);
                }

                setProducts(prodRes.data);
                setCategories(catRes.data);
                setBrands(brandRes.data);
                setVisibleCount(12);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [categorySlug, location.search, navigate, brandSlug]);

    // QUY TẮC 1: Meta title & description — 50-60 ký tự, có CTR
    const pageTitle = useMemo(() =>
        currentCategory
            ? `${currentCategory.name} Chính Hãng, Giá Tốt 2026 | Blue Sky`
            : 'Thời Trang Chính Hãng, Giá Tốt 2026 | Blue Sky'
        , [currentCategory]);

    const pageDescription = useMemo(() =>
        currentCategory
            ? `Mua ngay ${currentCategory.name} chính hãng tại Blue Sky. Đa dạng mẫu mã, thương hiệu nổi tiếng, giá cực tốt năm 2026. Giao hàng toàn quốc. Đặt hàng ngay!`
            : 'Mua sắm thời trang cao cấp chính hãng tại Blue Sky. Đa dạng sản phẩm, cập nhật xu hướng 2026, giá tốt nhất thị trường. Mua ngay hôm nay!'
        , [currentCategory]);

    // QUY TẮC 5: Breadcrumb data (Đường dẫn có cấp bậc)
    const breadcrumbs = useMemo(() => {
        const crumbs = [
            { name: 'Trang chủ', url: '/' },
            { name: 'Sản phẩm', url: '/products' },
        ];
        
        if (currentCategory) {
            if (categories && categories.length > 0 && currentCategory.id) {
                const catPath = [];
                let current = categories.find(c => c.id === currentCategory.id);
                while (current) {
                    catPath.unshift({ name: current.name, url: `/products/${current.slug}` });
                    if (current.parent) {
                        current = categories.find(c => c.id === current.parent);
                    } else {
                        current = null;
                    }
                }
                crumbs.push(...catPath);
            } else {
                crumbs.push({ name: currentCategory.name, url: `/products/${currentCategory.slug}` });
            }
        }
        
        if (currentBrand) {
            crumbs.push({ name: currentBrand.name, url: `/products/${categorySlug || 'all'}/${currentBrand.slug}` });
        }
        
        return crumbs;
    }, [currentCategory, currentBrand, categorySlug, categories]);

    const schemaItemList = useMemo(() =>
        buildItemListSchema(products, baseUrl, selectedCategory, categorySlug),
        [products, baseUrl, selectedCategory, categorySlug]);

    const schemaBreadcrumb = useMemo(() =>
        buildBreadcrumbSchema(breadcrumbs, baseUrl),
        [breadcrumbs, baseUrl]);

    // QUY TẮC 2: Category description
    const categoryDescription = useMemo(() => {
        if (currentCategory?.meta_description) return currentCategory.meta_description;
        if (currentCategory) return `Khám phá bộ sưu tập <strong>${currentCategory.name}</strong> của Blue Sky — nơi phong cách gặp gỡ chất lượng. Những thiết kế tinh tế, phù hợp mọi dịp, chất liệu cao cấp và giá cả hợp lý.`;
        return 'Khám phá toàn bộ bộ sưu tập thời trang <strong>Blue Sky</strong> — từ áo, quần đến phụ kiện thời thượng. Cập nhật liên tục xu hướng mới, giao hàng toàn quốc.';
    }, [currentCategory]);

    const handleCategorySelect = useCallback((cat) => {
        setSidebarOpen(false);
        setVisibleCount(12);
        if (cat === 'all') { setSelectedCategory('all'); navigate('/products'); }
        else { setSelectedCategory(cat.name); navigate(`/products/${cat.slug}`); }
    }, [navigate]);

    const handleBrandSelect = useCallback((brand) => {
        setSidebarOpen(false);
        setVisibleCount(12);
        if (brand === 'all') {
            setSelectedBrand('all');
            navigate(categorySlug ? `/products/${categorySlug}` : '/products');
        } else {
            setSelectedBrand(brand.name);
            navigate(`/products/${categorySlug || 'all'}/${brand.slug}`);
        }
    }, [navigate, categorySlug]);

    // Lấy danh mục con / danh mục liên quan
    const displaySubCategories = useMemo(() => {
        if (!categories || categories.length === 0) return [];
        if (!currentCategory || !currentCategory.id) {
            // Đang ở "Tất cả" -> Hiện danh mục gốc (không có parent) hoặc tất cả nếu không phân cấp
            const parents = categories.filter(c => !c.parent);
            return parents.length > 0 ? parents : categories;
        }

        // Đang ở danh mục cụ thể -> Hiện danh mục con của nó
        const children = categories.filter(c => c.parent === currentCategory.id);
        if (children.length > 0) return children;

        // Nếu không có danh mục con, currentCategory là danh mục con.
        // Trả về TẤT CẢ danh mục con của danh mục chính (cùng cha), bao gồm cả chính nó.
        if (currentCategory.parent) {
            return categories.filter(c => c.parent === currentCategory.parent);
        }

        return [];
    }, [categories, currentCategory]);

    const availableSizes = useMemo(() => {
        const sizes = new Set();
        products.forEach(p => p.variants?.forEach(v => { if (v.size_name) sizes.add(v.size_name); }));
        return Array.from(sizes).sort();
    }, [products]);

    const availableColors = useMemo(() => {
        const colors = new Set();
        products.forEach(p => p.variants?.forEach(v => { if (v.color_name) colors.add(v.color_name); }));
        return Array.from(colors).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        let list = products.filter(item => {
            const name = (item.name || item.title || '').toLowerCase();
            const matchSearch = name.includes((search || '').toLowerCase());
            const matchCat = selectedCategory === 'all' || item.category_name === selectedCategory || item.category === parseInt(selectedCategory);
            const matchPrice = item.variants ? item.variants.some(v => parseFloat(v.price || 0) <= priceRange) : false;
            const matchSize = selectedSize === 'all' || item.variants?.some(v => v.size_name === selectedSize);
            const matchColor = selectedColor === 'all' || item.variants?.some(v => v.color_name === selectedColor);
            const itemBrand = String(item.brand_slug || item.brand_name || item.brand || '').toLowerCase();
            const matchBrand = !brandSlug || itemBrand === brandSlug.toLowerCase();
            return matchSearch && matchCat && matchPrice && matchSize && matchColor && matchBrand;
        });
        // QUY TẮC 7: Sắp xếp
        if (sortBy === 'price-asc') list = [...list].sort((a, b) => {
            const pa = a.variants?.[0] ? Math.min(...a.variants.map(v => parseFloat(v.price || 0))) : 0;
            const pb = b.variants?.[0] ? Math.min(...b.variants.map(v => parseFloat(v.price || 0))) : 0;
            return pa - pb;
        });
        if (sortBy === 'price-desc') list = [...list].sort((a, b) => {
            const pa = a.variants?.[0] ? Math.min(...a.variants.map(v => parseFloat(v.price || 0))) : 0;
            const pb = b.variants?.[0] ? Math.min(...b.variants.map(v => parseFloat(v.price || 0))) : 0;
            return pb - pa;
        });
        if (sortBy === 'rating') list = [...list].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return list;
    }, [products, search, selectedCategory, priceRange, selectedSize, selectedColor, brandSlug, sortBy]);

    // QUY TẮC 4: Best sellers — sản phẩm bán chạy (top rated + nhiều review)
    const bestSellers = useMemo(() =>
        [...products]
            .filter(p => p.average_rating >= 4)
            .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
            .slice(0, 4)
        , [products]);

    const hasActiveFilter = search || selectedCategory !== 'all' || priceRange < 2000000 || selectedSize !== 'all' || selectedColor !== 'all';

    const resetFilters = () => {
        setSearch('');
        setPriceRange(2000000);
        setSelectedSize('all');
        setSelectedColor('all');
        handleCategorySelect('all');
    };

    // ============================================================
    // LOADING
    // ============================================================
    if (loading) return (
        <div className="ps-loading" aria-label="Đang tải">
            <div className="ps-spinner" />
            <p>Đang tải sản phẩm...</p>
        </div>
    );

    return (
        <div className="ps-page">

            {/* ================================================
                QUY TẮC 1+9: Meta Tags + JSON-LD Schema
            ================================================ */}
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify(schemaItemList)}</script>
                <script type="application/ld+json">{JSON.stringify(schemaBreadcrumb)}</script>
            </Helmet>

            <Header scrolled={true} />

            {/* ================================================
                QUY TẮC 2+5: BANNER — H1 duy nhất + Breadcrumb
            ================================================ */}
            <div className="ps-banner">
                <div className="ps-banner-inner">
                    <nav className="ps-breadcrumb" aria-label="Breadcrumb">
                        <ol className="ps-crumb-list">
                            {breadcrumbs.map((crumb, i) => (
                                <li key={crumb.url} className="ps-crumb-item">
                                    {i > 0 && <span className="ps-crumb-sep" aria-hidden="true">›</span>}
                                    {i < breadcrumbs.length - 1
                                        ? <Link to={crumb.url}>{crumb.name}</Link>
                                        : <span aria-current="page">{crumb.name}</span>
                                    }
                                </li>
                            ))}
                        </ol>
                    </nav>

                    {/* QUY TẮC 2: 1 H1 duy nhất */}
                    <h1 className="ps-banner-title">
                        {currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}
                    </h1>
                    {/* QUY TẮC 2: 2-3 câu giới thiệu chứa từ khóa */}
                    <p
                        className="ps-banner-desc"
                        dangerouslySetInnerHTML={{ __html: categoryDescription }}
                    />
                </div>
            </div>

            {/* ================================================
                QUY TẮC 3: Sub-categories — Điều hướng nhanh
            ================================================ */}
            {displaySubCategories.length > 0 && (
                <section className="ps-subcategories" aria-label="Danh mục liên quan">
                    <div className="ps-subcategories-inner">
                        <button
                            className={`ps-subcat-chip${selectedCategory === 'all' ? ' ps-subcat-chip--active' : ''}`}
                            onClick={() => handleCategorySelect('all')}
                        >
                            🛍️ Tất cả
                        </button>
                        {displaySubCategories.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/products/${cat.slug}`}
                                className={`ps-subcat-chip${selectedCategory === cat.name ? ' ps-subcat-chip--active' : ''}`}
                            >
                                {cat.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{cat.icon}</span>}
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ================================================
                QUY TẮC 4: Best Sellers — Sản phẩm bán chạy
            ================================================ */}
            {bestSellers.length > 0 && (
                <section className="ps-bestsellers" aria-label="Sản phẩm bán chạy">
                    <div className="ps-bestsellers-inner">
                        <div className="ps-section-header">
                            <span className="ps-section-badge">🔥 Hot</span>
                            <h2 className="ps-section-title">Bán Chạy Nhất</h2>
                            <p className="ps-section-sub">Được khách hàng tin chọn nhiều nhất</p>
                        </div>
                        <div className="ps-bestsellers-grid">
                            {bestSellers.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="ps-bestseller-card"
                                    data-aos="fade-up"
                                    data-aos-delay={idx * 80}
                                >
                                    <div className="ps-bestseller-badge">#{idx + 1} Bán chạy</div>
                                    <ProductCard
                                        product={item}
                                        imageProps={{ loading: 'eager', fetchPriority: idx === 0 ? 'high' : 'auto' }}
                                    />
                                    {/* QUY TẮC 6: Rating stars */}
                                    {item.average_rating > 0 && (
                                        <StarRating rating={item.average_rating} count={item.review_count} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ================================================
                QUY TẮC 5: Brands — Thương hiệu nổi bật
            ================================================ */}
            {brands.length > 0 && (
                <section className="ps-brands" aria-label="Thương hiệu nổi bật">
                    <div className="ps-brands-inner">
                        <h2 className="ps-brands-title">Thương Hiệu Nổi Bật</h2>
                        <div className="ps-brands-scroll">
                            {brands.map(brand => (
                                <Link
                                    key={brand.id}
                                    to={`/products/${categorySlug || 'all'}/${brand.slug}`}
                                    className={`ps-brand-item${selectedBrand === brand.name ? ' ps-brand-item--active' : ''}`}
                                    aria-label={`Xem sản phẩm thương hiệu ${brand.name}`}
                                >
                                    {brand.logo
                                        ? <img src={brand.logo} alt={`Logo ${brand.name}`} className="ps-brand-logo" width="60" height="40" loading="lazy" />
                                        : <span className="ps-brand-name-only">{brand.name}</span>
                                    }
                                    <span className="ps-brand-label">{brand.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ================================================
                QUY TẮC 7+8: Main — Filters + Product Grid
            ================================================ */}

            {/* Mobile filter toggle */}
            <div className="ps-mobile-bar">
                <span className="ps-count-mobile" aria-live="polite">
                    <strong>{filteredProducts.length}</strong> sản phẩm
                </span>
                <div className="ps-mobile-bar-right">
                    {/* Sort mobile */}
                    <select
                        className="ps-sort-select"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        aria-label="Sắp xếp sản phẩm"
                    >
                        <option value="default">Mặc định</option>
                        <option value="newest">Mới nhất</option>
                        <option value="price-asc">Giá tăng dần</option>
                        <option value="price-desc">Giá giảm dần</option>
                        <option value="rating">Đánh giá cao</option>
                    </select>
                    <button
                        className="ps-filter-toggle"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Mở bộ lọc"
                        aria-expanded={sidebarOpen}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
                        </svg>
                        Bộ lọc {hasActiveFilter && <span className="ps-filter-dot" />}
                    </button>
                </div>
            </div>

            <main className="ps-layout">
                {/* Sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="ps-overlay"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* ============================================
                    SIDEBAR — QUY TẮC 7: Bộ lọc thông minh
                ============================================ */}
                <aside className={`ps-sidebar${sidebarOpen ? ' ps-sidebar--open' : ''} p-3 `} aria-label="Bộ lọc sản phẩm">
                    <div className="ps-sidebar-head">
                        <span className="ps-sidebar-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Bộ lọc
                        </span>
                        <button className="ps-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Đóng bộ lọc">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Tìm kiếm */}
                    <div className="ps-filter-group">
                        <label className="ps-filter-label" htmlFor="product-search">Tìm kiếm</label>
                        <div className="ps-search-box" role="search">
                            <svg className="ps-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                id="product-search"
                                type="search"
                                placeholder="Tên sản phẩm..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Tìm kiếm sản phẩm"
                            />
                            {search && (
                                <button className="ps-search-clear" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">✕</button>
                            )}
                        </div>
                    </div>

                    {/* Danh mục */}
                    <div className="ps-filter-group">
                        <p className="ps-filter-label">Danh mục</p>
                        <ul className="ps-cat-list" role="list">
                            <li role="listitem">
                                <button
                                    className={`ps-cat-btn${selectedCategory === 'all' ? ' ps-cat-btn--active' : ''}`}
                                    onClick={() => handleCategorySelect('all')}
                                    aria-pressed={selectedCategory === 'all'}
                                >
                                    <span className="ps-cat-dot" aria-hidden="true" />
                                    Tất cả sản phẩm
                                </button>
                            </li>
                            {categories.map(cat => (
                                <li key={cat.id} role="listitem">
                                    <button
                                        className={`ps-cat-btn${selectedCategory === cat.name ? ' ps-cat-btn--active' : ''}`}
                                        onClick={() => handleCategorySelect(cat)}
                                        aria-pressed={selectedCategory === cat.name}
                                    >
                                        <span className="ps-cat-dot" aria-hidden="true" />
                                        {cat.name}
                                        <span className="ps-cat-count">
                                            {products.filter(p => p.category_name === cat.name).length}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Thương hiệu */}
                    <div className="ps-filter-group">
                        <p className="ps-filter-label">Thương hiệu</p>
                        <ul className="ps-cat-list" role="list">
                            <li role="listitem">
                                <button
                                    className={`ps-cat-btn${selectedBrand === 'all' ? ' ps-cat-btn--active' : ''}`}
                                    onClick={() => handleBrandSelect('all')}
                                    aria-pressed={selectedBrand === 'all'}
                                >
                                    <span className="ps-cat-dot" aria-hidden="true" />
                                    Tất cả thương hiệu
                                </button>
                            </li>
                            {brands.map(brand => (
                                <li key={brand.id} role="listitem">
                                    <button
                                        className={`ps-cat-btn${selectedBrand === brand.name ? ' ps-cat-btn--active' : ''}`}
                                        onClick={() => handleBrandSelect(brand)}
                                        aria-pressed={selectedBrand === brand.name}
                                    >
                                        <span className="ps-cat-dot" aria-hidden="true" />
                                        {brand.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Giá */}
                    <div className="ps-filter-group">
                        <p className="ps-filter-label">
                            Giá tối đa
                            <span className="ps-price-val">{formatPrice(priceRange)}</span>
                        </p>
                        <input
                            type="range"
                            min="0"
                            max="2000000"
                            step="50000"
                            value={priceRange}
                            onChange={e => setPriceRange(parseInt(e.target.value))}
                            className="ps-slider"
                            aria-label={`Giá tối đa: ${formatPrice(priceRange)}`}
                        />
                        <div className="ps-price-labels" aria-hidden="true">
                            <span>0₫</span>
                            <span>2.000.000₫</span>
                        </div>
                    </div>

                    {/* Size */}
                    {availableSizes.length > 0 && (
                        <div className="ps-filter-group">
                            <label className="ps-filter-label" htmlFor="filter-size">Size</label>
                            <div className="ps-size-grid">
                                <button
                                    className={`ps-size-btn${selectedSize === 'all' ? ' ps-size-btn--active' : ''}`}
                                    onClick={() => setSelectedSize('all')}
                                >
                                    All
                                </button>
                                {availableSizes.map(s => (
                                    <button
                                        key={s}
                                        className={`ps-size-btn${selectedSize === s ? ' ps-size-btn--active' : ''}`}
                                        onClick={() => setSelectedSize(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Màu sắc */}
                    {availableColors.length > 0 && (
                        <div className="ps-filter-group">
                            <label className="ps-filter-label" htmlFor="filter-color">Màu sắc</label>
                            <select
                                id="filter-color"
                                className="ps-select"
                                value={selectedColor}
                                onChange={e => setSelectedColor(e.target.value)}
                                aria-label="Lọc theo màu sắc"
                            >
                                <option value="all">Tất cả màu</option>
                                {availableColors.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {hasActiveFilter && (
                        <button className="ps-reset-btn" onClick={resetFilters} aria-label="Xóa tất cả bộ lọc">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                            </svg>
                            Xóa bộ lọc
                        </button>
                    )}
                </aside>

                {/* ============================================
                    NỘI DUNG CHÍNH — QUY TẮC 7+8
                ============================================ */}
                <section className="ps-content" aria-label="Danh sách sản phẩm">

                    {/* Desktop header: result count + sort */}
                    <div className="ps-content-header">
                        <p className="ps-results" aria-live="polite" aria-atomic="true">
                            <strong>{filteredProducts.length}</strong> sản phẩm
                            {search && <span> cho "<em>{search}</em>"</span>}
                        </p>
                        {/* QUY TẮC 7: Sort desktop */}
                        <div className="ps-sort-desktop">
                            <label htmlFor="sort-desktop" className="ps-sr-only">Sắp xếp</label>
                            <select
                                id="sort-desktop"
                                className="ps-sort-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                aria-label="Sắp xếp sản phẩm"
                            >
                                <option value="default">Mặc định</option>
                                <option value="newest">Mới nhất</option>
                                <option value="price-asc">Giá tăng dần</option>
                                <option value="price-desc">Giá giảm dần</option>
                                <option value="rating">Đánh giá cao</option>
                            </select>
                        </div>
                    </div>

                    {/* QUY TẮC 8: Product Grid */}
                    {filteredProducts.length > 0 ? (
                        <>
                            <div className="ps-grid" role="list" aria-label={`${filteredProducts.length} sản phẩm`}>
                                {filteredProducts.slice(0, visibleCount).map((item, idx) => (
                                    <div
                                        key={item.id}
                                        role="listitem"
                                        className="ps-grid-item"
                                        data-aos="fade-up"
                                        data-aos-delay={idx < 8 ? (idx % 4) * 60 : 0}
                                    >
                                        <ProductCard
                                            product={item}
                                            imageProps={{
                                                loading: idx < 3 ? 'eager' : 'lazy',
                                                fetchPriority: idx === 0 ? 'high' : 'auto',
                                            }}
                                        />
                                        {/* QUY TẮC 6: Rating stars dưới mỗi sản phẩm */}
                                        {item.average_rating > 0 && (
                                            <StarRating rating={item.average_rating} count={item.review_count} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* QUY TẮC 8: Nút "Xem thêm" chuẩn SEO */}
                            {visibleCount < filteredProducts.length && (
                                <div className="ps-load-more">
                                    <button
                                        className="ps-load-more-btn"
                                        onClick={() => setVisibleCount(v => v + 12)}
                                        aria-label={`Xem thêm ${Math.min(12, filteredProducts.length - visibleCount)} sản phẩm`}
                                    >
                                        Xem thêm sản phẩm
                                        <span className="ps-load-more-count">
                                            ({visibleCount}/{filteredProducts.length})
                                        </span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="ps-empty" role="status">
                            <div className="ps-empty-icon" aria-hidden="true">
                                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <p className="ps-empty-title">Không tìm thấy sản phẩm</p>
                            <p className="ps-empty-sub">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                            <button className="ps-empty-reset" onClick={resetFilters}>
                                Xóa tất cả bộ lọc
                            </button>
                        </div>
                    )}
                </section>
            </main>

            {/* ================================================
                QUY TẮC 9: SEO Content — Hướng dẫn + FAQ
            ================================================ */}
            <section className="ps-seo-content" aria-label="Hướng dẫn mua hàng và câu hỏi thường gặp">
                <div className="ps-seo-content-inner">

                    <div className="ps-seo-grid">
                        {/* Cột trái: bài viết SEO */}
                        <div className="ps-seo-article">
                            <h2 className="ps-seo-h2">
                                Hướng dẫn chọn mua {currentCategory ? currentCategory.name.toLowerCase() : 'thời trang'} chính hãng 2026
                            </h2>
                            <p>
                                Bạn đang tìm kiếm <strong>{currentCategory ? currentCategory.name.toLowerCase() : 'những sản phẩm thời trang'}</strong> cao cấp, bắt kịp xu hướng mới nhất năm 2026? Tại <strong>Blue Sky</strong>, chúng tôi tự hào mang đến bộ sưu tập đa dạng từ các thương hiệu hàng đầu thế giới. Dù bạn cần phong cách thanh lịch công sở, năng động dạo phố hay sang trọng dự tiệc, chúng tôi luôn có lựa chọn hoàn hảo dành cho bạn.
                            </p>

                            <h3 className="ps-seo-h3">Tại sao nên chọn mua tại Blue Sky?</h3>
                            <ul className="ps-seo-list">
                                <li>
                                    <strong>Chất lượng đảm bảo:</strong> 100% sản phẩm chính hãng, nguồn gốc rõ ràng, đi kèm chế độ bảo hành uy tín.
                                </li>
                                <li>
                                    <strong>Đa dạng thương hiệu:</strong> Từ các hãng bình dân đến cao cấp, đáp ứng mọi phân khúc và nhu cầu khách hàng.
                                </li>
                                <li>
                                    <strong>Giá cả cạnh tranh:</strong> Liên tục có các chương trình khuyến mãi ưu đãi đặc quyền cho thành viên.
                                </li>
                                <li>
                                    <strong>Giao hàng nhanh:</strong> Toàn quốc trong 1–3 ngày làm việc, miễn phí cho đơn từ 500.000₫.
                                </li>
                            </ul>
                        </div>

                        {/* Cột phải: FAQ */}
                        <div className="ps-faq">
                            <h3 className="ps-seo-h3">Câu hỏi thường gặp (FAQ)</h3>

                            <details className="ps-faq-item">
                                <summary className="ps-faq-q">Thời gian giao hàng mất bao lâu?</summary>
                                <p className="ps-faq-a">Blue Sky hỗ trợ giao hàng toàn quốc siêu tốc từ 1–3 ngày làm việc. Với các đơn hàng tại TP. HCM và Hà Nội, thời gian giao có thể trong ngày.</p>
                            </details>

                            <details className="ps-faq-item">
                                <summary className="ps-faq-q">Có hỗ trợ đổi trả nếu không vừa size không?</summary>
                                <p className="ps-faq-a">Chúng tôi áp dụng chính sách đổi trả dễ dàng trong vòng 7 ngày đối với các sản phẩm còn nguyên tem mác và chưa qua sử dụng.</p>
                            </details>

                            <details className="ps-faq-item">
                                <summary className="ps-faq-q">Làm sao biết sản phẩm có chính hãng không?</summary>
                                <p className="ps-faq-a">Mỗi sản phẩm tại Blue Sky đều có tem bảo hành và mã QR để xác thực nguồn gốc. Bạn có thể quét mã ngay trên app sau khi nhận hàng.</p>
                            </details>

                            <details className="ps-faq-item">
                                <summary className="ps-faq-q">Có chương trình tích điểm không?</summary>
                                <p className="ps-faq-a">Có! Thành viên Blue Sky nhận điểm thưởng cho mỗi đơn hàng và có thể dùng điểm để giảm giá cho lần mua tiếp theo.</p>
                            </details>
                        </div>
                    </div>

                    {/* Chính sách nổi bật */}
                    <div className="ps-trust-row">
                        {[
                            { icon: '🚚', title: 'Giao hàng nhanh', desc: 'Toàn quốc 1–3 ngày' },
                            { icon: '✅', title: '100% chính hãng', desc: 'Có tem xác thực' },
                            { icon: '🔄', title: 'Đổi trả 7 ngày', desc: 'Miễn phí đổi size' },
                            { icon: '💳', title: 'Thanh toán an toàn', desc: 'Mã hóa 256-bit' },
                        ].map(t => (
                            <div key={t.title} className="ps-trust-item">
                                <span className="ps-trust-icon" aria-hidden="true">{t.icon}</span>
                                <strong className="ps-trust-title">{t.title}</strong>
                                <span className="ps-trust-desc">{t.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Products;