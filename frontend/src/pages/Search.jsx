import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../api';
import aos from 'aos';
import 'aos/dist/aos.css';
import "../styles/Products.css"; // Reuse Products styles or create new ones

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || searchParams.get('search') || '';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const [priceRange, setPriceRange] = useState(2000000);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [selectedSize, setSelectedSize] = useState('all');
    const [selectedColor, setSelectedColor] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${baseUrl}/search?q=${encodeURIComponent(query)}`;

    useEffect(() => {
        aos.init({ duration: 700, once: true, offset: 100 });
    }, []);

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes, brandRes] = await Promise.all([
                    api.get('/products/', { params: { search: query } }),
                    api.get('/categories/'),
                    api.get('/brands/')
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
                setBrands(brandRes.data);
            } catch (err) {
                console.error("Lỗi khi tìm kiếm:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSearchResults();
        window.scrollTo(0, 0);
    }, [query]);

    // Lọc sản phẩm
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

    const filteredProducts = useMemo(() => products.filter(item => {
        const matchCat = selectedCategory === 'all' || item.category_name === selectedCategory || item.category === parseInt(selectedCategory);
        const matchBrand = selectedBrand === 'all' || item.brand_name === selectedBrand;
        const matchPrice = item.variants ? item.variants.some(v => parseFloat(v.price || 0) <= priceRange) : false;
        const matchSize = selectedSize === 'all' || item.variants?.some(v => v.size_name === selectedSize);
        const matchColor = selectedColor === 'all' || item.variants?.some(v => v.color_name === selectedColor);
        return matchCat && matchBrand && matchPrice && matchSize && matchColor;
    }), [products, selectedCategory, selectedBrand, priceRange, selectedSize, selectedColor]);

    const hasActiveFilter = selectedCategory !== 'all' || selectedBrand !== 'all' || priceRange < 2000000 || selectedSize !== 'all' || selectedColor !== 'all';
    
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // SEO cho trang tìm kiếm (Thường sẽ để noindex để tránh thin content, 
    // nhưng nếu cố tình SEO trang search keyword, ta dùng canonical)
    const pageTitle = query ? `Kết quả tìm kiếm cho "${query}" | Blue Sky` : 'Tìm kiếm sản phẩm | Blue Sky';
    const pageDescription = query
        ? `Khám phá các sản phẩm liên quan đến "${query}" tại Blue Sky. Chất lượng cao, giá cả phải chăng.`
        : 'Tìm kiếm hàng ngàn sản phẩm thời trang tại Blue Sky.';

    const schemaItemList = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Kết quả tìm kiếm cho ${query}`,
        url: canonicalUrl,
        numberOfItems: filteredProducts.length,
        itemListElement: filteredProducts.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
                '@type': 'Product',
                name: p.name,
                url: `${baseUrl}/${p.category_slug || 'all'}/${p.slug}`,
                image: p.images?.[0]?.image || '',
            },
        })),
    }), [filteredProducts, query, baseUrl, canonicalUrl]);

    if (loading) return (
        <div className="ps-loading">
            <div className="ps-spinner" />
            <p>Đang tìm kiếm...</p>
        </div>
    );

    return (
        <div className="ps-page">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <link rel="canonical" href={canonicalUrl} />
                {/* Nên thêm noindex cho trang search tránh duplicate content với trang category */}
                <meta name="robots" content="noindex, follow" />
                <script type="application/ld+json">{JSON.stringify(schemaItemList)}</script>
            </Helmet>

            <Header scrolled={true} />

            <div className="ps-banner" style={{ minHeight: '200px', padding: '60px 0 30px' }}>
                <div className="ps-banner-inner">
                    <nav className="ps-breadcrumb" aria-label="Breadcrumb">
                        <span className="ps-crumb"><Link to="/">Trang chủ</Link></span>
                        <span className="ps-crumb"><span className="ps-crumb-sep">/</span>Tìm kiếm</span>
                    </nav>
                    <h1 className="ps-banner-title">
                        {query ? `Kết quả tìm kiếm: "${query}"` : 'Nhập từ khóa để tìm kiếm'}
                    </h1>
                    <p className="ps-banner-sub">
                        Tìm thấy {filteredProducts.length} sản phẩm phù hợp.
                    </p>
                </div>
            </div>

            {/* MOBILE FILTER BAR */}
            <div className="ps-mobile-bar">
                <span className="ps-count-mobile" aria-live="polite">
                    {filteredProducts.length} sản phẩm
                </span>
                <button
                    className="ps-filter-toggle"
                    onClick={() => setSidebarOpen(o => !o)}
                    aria-expanded={sidebarOpen}
                    aria-controls="filter-sidebar"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="10" y2="18" />
                    </svg>
                    Bộ lọc
                    {hasActiveFilter && <span className="ps-filter-dot" aria-label="Đang có bộ lọc" />}
                </button>
            </div>

            {sidebarOpen && (
                <div
                    className="ps-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <main className="ps-main" id="main-content">
                <aside
                    id="filter-sidebar"
                    className={`ps-sidebar${sidebarOpen ? ' ps-sidebar--open' : ''}`}
                    aria-label="Bộ lọc sản phẩm"
                >
                    <div className="ps-sidebar-head">
                        <span className="ps-sidebar-title">Bộ lọc</span>
                        <button
                            className="ps-sidebar-close"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Đóng bộ lọc"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Danh mục */}
                    <div className="ps-filter-group">
                        <h2 className="ps-filter-label">Danh mục</h2>
                        <ul className="ps-cat-list" role="list">
                            <li role="listitem">
                                <button
                                    className={`ps-cat-btn${selectedCategory === 'all' ? ' ps-cat-btn--active' : ''}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    <span className="ps-cat-dot" aria-hidden="true" />
                                    Tất cả danh mục
                                </button>
                            </li>
                            {categories.map(cat => (
                                <li key={cat.id} role="listitem">
                                    <button
                                        className={`ps-cat-btn${selectedCategory === cat.name ? ' ps-cat-btn--active' : ''}`}
                                        onClick={() => setSelectedCategory(cat.name)}
                                    >
                                        <span className="ps-cat-dot" aria-hidden="true" />
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Thương hiệu */}
                    <div className="ps-filter-group">
                        <h2 className="ps-filter-label">Thương hiệu</h2>
                        <ul className="ps-cat-list" role="list">
                            <li role="listitem">
                                <button
                                    className={`ps-cat-btn${selectedBrand === 'all' ? ' ps-cat-btn--active' : ''}`}
                                    onClick={() => setSelectedBrand('all')}
                                >
                                    <span className="ps-cat-dot" aria-hidden="true" />
                                    Tất cả thương hiệu
                                </button>
                            </li>
                            {brands.map(brand => (
                                <li key={brand.id} role="listitem">
                                    <button
                                        className={`ps-cat-btn${selectedBrand === brand.name ? ' ps-cat-btn--active' : ''}`}
                                        onClick={() => setSelectedBrand(brand.name)}
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
                        <h2 className="ps-filter-label">
                            Giá tối đa
                            <span className="ps-price-val">{formatPrice(priceRange)}</span>
                        </h2>
                        <input
                            type="range"
                            min="0"
                            max="2000000"
                            step="50000"
                            value={priceRange}
                            onChange={e => setPriceRange(parseInt(e.target.value))}
                            className="ps-slider"
                        />
                        <div className="ps-price-labels" aria-hidden="true">
                            <span>0₫</span>
                            <span>2.000.000₫</span>
                        </div>
                    </div>

                    {/* Size */}
                    {availableSizes.length > 0 && (
                        <div className="ps-filter-group">
                            <h2 className="ps-filter-label">Size</h2>
                            <select
                                className="ps-select"
                                value={selectedSize}
                                onChange={e => setSelectedSize(e.target.value)}
                            >
                                <option value="all">Tất cả size</option>
                                {availableSizes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Màu sắc */}
                    {availableColors.length > 0 && (
                        <div className="ps-filter-group">
                            <h2 className="ps-filter-label">Màu sắc</h2>
                            <select
                                className="ps-select"
                                value={selectedColor}
                                onChange={e => setSelectedColor(e.target.value)}
                            >
                                <option value="all">Tất cả màu</option>
                                {availableColors.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Reset */}
                    {hasActiveFilter && (
                        <button
                            className="ps-reset-btn"
                            onClick={() => { setPriceRange(2000000); setSelectedSize('all'); setSelectedColor('all'); setSelectedCategory('all'); setSelectedBrand('all'); }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                            </svg>
                            Xóa bộ lọc
                        </button>
                    )}
                </aside>

                <section className="ps-content" aria-label="Danh sách sản phẩm">
                    <div className="ps-content-header">
                        <p className="ps-results" aria-live="polite">
                            <strong>{filteredProducts.length}</strong> sản phẩm phù hợp
                        </p>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="ps-grid" role="list">
                            {filteredProducts.map((item, idx) => (
                                <div key={item.id} role="listitem" data-aos="fade-up" data-aos-delay={idx < 8 ? idx * 45 : 0}>
                                    <ProductCard product={item} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="ps-empty" role="status">
                            <div className="ps-empty-icon">
                                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <p className="ps-empty-title">Không có kết quả nào cho "{query}"</p>
                            <p className="ps-empty-sub">Vui lòng thử lại với từ khóa khác.</p>
                            <Link to="/products/all" className="btn btn-primary mt-3">Xem tất cả sản phẩm</Link>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Search;
