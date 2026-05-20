import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import "../styles/Home.css";

/* Hook: trigger animation when element enters viewport */
function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("is-visible");
                    observer.unobserve(el);
                }
            },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
}

function Home({ scrolled }) {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const categoriesRef = useReveal();
    const productsRef = useReveal();
    const featuresRef = useReveal();
    const aboutRef = useReveal();
    const ctaRef = useReveal();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, brandsRes] = await Promise.all([
                    axios.get("http://127.0.0.1:8000/api/products/"),
                    axios.get("http://127.0.0.1:8000/api/brands/"),
                ]);
                setFeaturedProducts(productsRes.data.slice(0, 8));
                setBrands(brandsRes.data);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getCategoryImage = (slug, image) => {
        if (image && !image.includes("placeholder")) return image;

        // Map slug to high-quality Unsplash fashion images (Focusing on Women's Fashion)
        const imageMap = {
            'vay': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80', // Beautiful dress
            'van-phong': 'https://images.unsplash.com/photo-1485230895905-ef25ba22002f?w=600&q=80', // Office wear
            'hien-dai': 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80', // Modern/Trendy
            'co-trang': 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80', // Vintage/Traditional

            // Other possible slugs
            'ao-so-mi': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
            'ao-thun': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
            'quan-jean': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
            'vay-dam': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
            'phu-kien': 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80',
        };

        return imageMap[slug] || 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80'; // Default women's fashion fallback
    };

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const categories = [
        {
            id: 1,
            title: "Váy",
            link: "/products/dress",
            imgSrc: "https://germe.vn/wp-content/uploads/2024/05/5.png"
        },
        {
            id: 2,
            title: "Áo",
            link: "/products/ao",
            imgSrc: "https://bizweb.dktcdn.net/thumb/1024x1024/100/119/564/products/ao-thun-nu-han-quoc-s5952.jpg?v=1686128637410" // Ảnh ví dụ, bạn thay bằng ảnh thật
        },
        {
            id: 3,
            title: "Chân váy",
            link: "/products?category=chan-vay",
            imgSrc: "https://pos.nvncdn.com/f567fc-206017/ps/20240930_UYEZ7HBB7S.jpeg?v=1727670170"
        },
        {
            id: 4,
            title: "Quần",
            link: "/products?category=quan",
            imgSrc: "https://aaajeans.com/wp-content/uploads/2024/07/wld02_IN-3.jpg"
        }
    ];

    return (
        <div className="home-page">
            <Helmet>
                <title>Trang chủ – Routine | Thời trang cao cấp Việt Nam</title>
                <meta
                    name="description"
                    content="Routine.vn – thời trang cao cấp Việt Nam với thiết kế hiện đại, chất liệu bền vững. Khám phá áo sơ mi, quần, váy và phụ kiện tôn dáng người Á Đông."
                />
                <meta
                    name="keywords"
                    content="thời trang việt nam, áo sơ mi cao cấp, quần công sở, váy đầm, thời trang bền vững, routine fashion"
                />
                <link rel="canonical" href={siteUrl} />

                <meta property="og:type" content="website" />
                <meta property="og:title" content="Routine – Thời trang cao cấp Việt Nam" />
                <meta property="og:description" content="Khám phá bộ sưu tập thời trang cao cấp, thiết kế hiện đại, chất liệu bền vững." />
                <meta property="og:url" content={siteUrl} />
                <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        name: "Routine",
                        description: "Thời trang cao cấp Việt Nam với thiết kế hiện đại, chất liệu bền vững",
                        url: siteUrl,
                        logo: `${siteUrl}/logo.png`,
                        potentialAction: {
                            "@type": "SearchAction",
                            target: `${siteUrl}/products?search={search_term_string}`,
                            "query-input": "required name=search_term_string",
                        },
                    })}
                </script>
            </Helmet>

            <Header scrolled={scrolled} />

            <main className="home-main" id="main-content">

                {/* ── HERO ── */}
                <section className="hero-section" aria-label="Giới thiệu Routine">
                    <div className="hero-container">
                        <div className="hero-content hero-animate">
                            <h1 className="hero-title">
                                Thời Trang Cao Cấp
                                <span className="hero-subtitle">Tôn Vinh Vóc Dáng Á Đông</span>
                            </h1>
                            <p className="hero-description">
                                Routine.vn mang đến bộ sưu tập thời trang hiện đại với chất liệu bền
                                vững, thiết kế tinh tế và form dáng hoàn hảo cho người Việt Nam.
                            </p>
                            <div className="hero-actions">
                                <Link to="/products" className="btn-primary">
                                    Khám Phá Bộ Sưu Tập
                                </Link>
                                <Link to="/products?category=officee" className="btn-secondary">
                                    Thời Trang Công Sở
                                </Link>
                            </div>
                        </div>

                        <div className="hero-image hero-animate hero-animate--delay">
                            <img
                                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
                                alt="Bộ sưu tập thời trang Routine 2026"
                                width="600"
                                height="750"
                                loading="eager"
                                fetchPriority="high"
                            />
                        </div>
                    </div>
                </section>

                {/* ── CATEGORIES ── */}
                <section className="categories-section reveal" ref={categoriesRef}>
                    <div className="category-grid container my-5">
                        <h2 className="text-center fs-1 fw-bold py-5">Danh mục sản phẩm</h2>
                        <div className="row g-4">
                            {categories.map((cat) => (
                                <div className="col-lg-3 col-md-4 col-sm-6 col-6" key={cat.id}>
                                    <Link to={cat.link} className="text-decoration-none">
                                        <div className="category-card">
                                            <div className="w-image">
                                                <img src={cat.imgSrc} alt={`Danh mục ${cat.title}`} />
                                            </div>
                                            <div className="category-info text-center py-3">
                                                <h3 className="category-title">{cat.title}</h3>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="brand">
                    <h2 className="text-center fs-1 fw-bold py-5">Thương hiệu</h2>
                    <div className="container">
                        <div className="row justify-content-center">
                            {brands.map((brand) => (
                                <div className="brand-item col-md-2 col-4" key={brand.id}>
                                    <Link to={`/products/all/${brand.slug}`}>
                                        <div className="brand-card rounded-circle d-flex flex-column align-items-center">
                                            <img className="rounded-circle w-50 h-50" src={brand.logo} alt={brand.name} />
                                            <h3 className="title-brand mt-3 fs-6 text-dark">{brand.name}</h3>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FEATURED PRODUCTS ── */}
                <section className="featured-products-section reveal" ref={productsRef}>
                    <div className="section-container">
                        <header className="section-header">
                            <h2>Sản Phẩm Nổi Bật</h2>
                            <p>Những thiết kế được yêu thích nhất tại Routine</p>
                        </header>

                        {loading ? (
                            <div className="loading-state" aria-live="polite">
                                <p>Đang tải sản phẩm…</p>
                            </div>
                        ) : (
                            <>
                                <ul className="products-grid" role="list">
                                    {featuredProducts.map((product) => (
                                        <li key={product.id} className="product-item">
                                            <ProductCard product={product} />
                                        </li>
                                    ))}
                                </ul>
                                <div className="section-footer">
                                    <Link to="/products" className="btn-view-all">
                                        Xem Tất Cả Sản Phẩm
                                        <span className="arrow" aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section className="features-section reveal" ref={featuresRef}>
                    <div className="section-container">
                        <header className="section-header">
                            <h2>Tại Sao Chọn Routine?</h2>
                        </header>

                        <ul className="features-grid" role="list">
                            {[
                                {
                                    icon: "✦",
                                    title: "Chất Liệu Cao Cấp",
                                    desc: "Sợi bã cà phê, sợi tre tự nhiên và Repreve tái chế – thân thiện môi trường, bền bỉ theo thời gian.",
                                },
                                {
                                    icon: "✦",
                                    title: "Thiết Kế Tôn Dáng",
                                    desc: "Form cắt nghiên cứu theo tỷ lệ cơ thể người Việt, tôn vinh vóc dáng Á Đông một cách hoàn hảo.",
                                },
                                {
                                    icon: "✦",
                                    title: "Bền Màu Lâu Dài",
                                    desc: "Công nghệ nhuộm sinh thái cao cấp giúp màu sắc giữ nguyên sau 50+ lần giặt.",
                                },
                                {
                                    icon: "✦",
                                    title: "Thoải Mái Cả Ngày",
                                    desc: "Vải chống nhăn, thoáng khí 4 chiều, thoát ẩm nhanh – thoải mái suốt 8 tiếng làm việc.",
                                },
                            ].map((f) => (
                                <li key={f.title} className="feature-card">
                                    <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── ABOUT ── */}
                <section className="about-section reveal" ref={aboutRef}>
                    <div className="section-container">
                        <div className="about-content">
                            <div className="about-text">
                                <h2>Về Routine</h2>
                                <p>
                                    Routine.vn không chỉ là một nền tảng thời trang, mà là không gian
                                    nghệ thuật nơi phong cách thanh lịch và nhịp sống hiện đại giao thoa.
                                </p>
                                <p>
                                    Đại diện cho tư duy "Look Smart" – tinh giản, sắc sảo, đầy tính ứng
                                    dụng – chúng tôi mang lăng kính mới về thời trang Việt Nam cao cấp,
                                    tôn vinh vóc dáng người Á Đông.
                                </p>
                                <Link to="/about" className="btn-learn-more">
                                    Tìm Hiểu Thêm <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                            <div className="about-image">
                                <img
                                    src="https://img.vietcetera.com/uploads/images/12-aug-2021/anyconv.com-.jpeg"
                                    alt="Xưởng may Routine – thời trang cao cấp Việt Nam"
                                    width="400"
                                    height="500"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="cta-section reveal" ref={ctaRef} aria-label="Đăng ký nhận ưu đãi">
                    <div className="cta-container">
                        <h2>Bắt Đầu Hành Trình Thời Trang Của Bạn</h2>
                        <p>Đăng ký nhận thông tin về bộ sưu tập mới và ưu đãi đặc biệt</p>
                        <Link to="/products" className="btn-cta-large">
                            Khám Phá Ngay
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}

export default Home;