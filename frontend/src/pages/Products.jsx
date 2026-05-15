import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../api';
import aos from 'aos';
import 'aos/dist/aos.css';
import ListPageSEO from '../components/ListPageSEO';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [priceRange, setPriceRange] = useState(2000000); // Max price default
    console.log(selectedCategory)

    useEffect(() => {
        const querySearch = searchParams.get('search');
        if (querySearch !== null) {
            setSearch(querySearch);
        }
    }, [searchParams]);
    useEffect(() => {
        aos.init({
            duration: 1000,
            once: false,
            offset: 200,
            mirror: true
        });
    }, []);
    const location = useLocation(); // Lấy thông tin URL hiện tại

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const category = params.get('category');
                const search = params.get('search');

                const [prodRes, catRes] = await Promise.all([
                    api.get('/products/', { params: { category, search } }),
                    api.get('/categories/')
                ]);

                setProducts(prodRes.data);
                setCategories(catRes.data);
                setSelectedCategory(catRes.data.find(cat => cat.slug === category)?.name || 'all');
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location.search]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    api.get('/products/'),
                    api.get('/categories/')
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error("Error fetching catalog data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, []);


    // Filter Logic
    const filteredProducts = products.filter(item => {
        // 1. Lọc theo tên
        const productName = item.name || item.title || '';
        const matchesSearch = productName.toLowerCase().includes((search || '').toLowerCase());

        // 2. Lọc theo danh mục
        const matchesCategory =
            selectedCategory === 'all' ||
            item.category_name === selectedCategory ||
            item.category === parseInt(selectedCategory);

        // 3. Lọc theo giá (SỬA Ở ĐÂY)
        // Dùng .some() để kiểm tra xem có biến thể (variant) nào có giá <= priceRange không
        // Nếu không có mảng variants (tránh lỗi API), mặc định cho matchesPrice = false
        const matchesPrice = item.variants ? item.variants.some(variant => {
            const variantPrice = parseFloat(variant.price || 0);
            return variantPrice <= priceRange;
        }) : false;

        // Sản phẩm phải thỏa mãn cả 3 điều kiện mới được hiển thị
        return matchesSearch && matchesCategory && matchesPrice;
    });
    if (loading) return <div className="loading">Đang tải danh sách sản phẩm...</div>;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="products-page">
            <ListPageSEO
                products={filteredProducts}
                pageTitle="Danh sách sản phẩm | Routine"
                pageDescription="Khám phá các sản phẩm thời trang cao cấp tại Routine"
                baseUrl={window.location.origin}
            />
            <Header scrolled={true} />

            <div className="catalog-banner">
                <h1>Blue Sky</h1>
                <p>Khám phá bộ sưu tập mới nhất từ Blue Sky</p>

            </div>

            <main className="catalog-container">
                <aside className="filter-sidebar">
                    <div className="filter-group">
                        <nav className="breadcrumb" style={{ marginTop: '15px', color: '#000' }}>
                            <Link to="/" style={{ color: '#000', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#000' }}>{selectedCategory === 'all' ? 'Tất cả sản phẩm' : selectedCategory}</span>
                        </nav>
                        <h3>Tìm kiếm</h3>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Tên sản phẩm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <i className="bi bi-search"></i>
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Danh mục</h3>
                        <ul className="category-list">
                            <li
                                className={selectedCategory === 'all' ? 'active' : ''}
                                onClick={() => setSelectedCategory('all')}
                            >
                                Tất cả sản phẩm
                            </li>
                            {categories.map(cat => (
                                <li
                                    key={cat.id}
                                    className={selectedCategory === cat.name ? 'active' : ''}
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    {cat.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="filter-group">
                        <h3>Giá tối đa: {formatPrice(priceRange)}</h3>
                        <input
                            type="range"
                            min="0"
                            max="2000000"
                            step="50000"
                            value={priceRange}
                            onChange={(e) => setPriceRange(parseInt(e.target.value))}
                            className="price-slider"
                        />
                        <div className="price-labels">
                            <span>0₫</span>
                            <span>2.000.000₫+</span>
                        </div>
                    </div>
                </aside>

                <section className="catalog-content">
                    <div className="catalog-header">
                        <span className="results-count">Hiển thị {filteredProducts.length} sản phẩm</span>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="catalog-grid">
                            {filteredProducts.map(item => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            <i className="bi bi-search"></i>
                            <p>Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.</p>
                            <button onClick={() => { setSearch(''); setSelectedCategory('all'); setPriceRange(2000000); }}>
                                Xóa tất cả bộ lọc
                            </button>
                        </div>
                    )}
                </section>
            </main>

            <Footer />

            <style jsx>{`
                .products-page {
                    background: #fcfcfc;
                    min-height: 100vh;
                }
                .product-name a {
                    color: #121212;
                }

                .catalog-container {
                    max-width: 1400px;
                    margin: 60px auto;
                    padding: 0 5%;
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 50px;
                }

                @media (max-width: 1024px) {
                    .catalog-container {
                        grid-template-columns: 1fr;
                    }
                    .filter-sidebar {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 20px;
                    }
                }

                .filter-sidebar {
                    position: sticky;
                    top: 120px;
                    height: fit-content;
                }

                .filter-group {
                    margin-bottom: 40px;
                }

                .filter-group h3 {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #1d1d1f;
                }

                .search-box {
                    position: relative;
                    background: #fff;
                    border: 1px solid #d2d2d7;
                    border-radius: 8px;
                    padding: 10px 15px;
                }

                .search-box input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 14px;
                }

                .category-list {
                    list-style: none;
                    padding: 0;
                }

                .category-list li {
                    padding: 8px 0;
                    color: #424245;
                    cursor: pointer;
                    font-size: 15px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }

                .category-list li:hover, .category-list li.active {
                    color: #0071e3;
                    font-weight: 600;
                    padding-left: 5px;
                }

                .price-slider {
                    width: 100%;
                    accent-color: #000;
                }

                .price-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #86868b;
                    margin-top: 10px;
                }

                .catalog-header {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: flex-end;
                }

                .results-count {
                    font-size: 14px;
                    color: #86868b;
                }

                .catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 30px;
                    align-items: start;
                }

                .no-results {
                    text-align: center;
                    padding: 100px 0;
                    color: #86868b;
                }
                .no-results i {
                    font-size: 48px;
                    margin-bottom: 20px;
                    display: block;
                }
                .no-results button {
                    margin-top: 20px;
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default Products;
