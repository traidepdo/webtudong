import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import "../App.css"
import aos from "aos";
import "aos/dist/aos.css";

const products = [
    {
        id: 1, name: "Vitamin C Brightening Serum", brand: "Routine Skincare",
        oldPrice: 850000, newPrice: 425000, discount: 50,
        rating: 4.8, reviews: 1243, sold: 3820,
        volume: "30ml", skin: "Mọi loại da", badge: "BÁN CHẠY #1",
        tags: ["Làm sáng da", "Chống oxy hoá"], stockLeft: 12,
        img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    },
    {
        id: 2, name: "Hydra Boost Moisture Cream", brand: "Routine Skincare",
        oldPrice: 620000, newPrice: 372000, discount: 40,
        rating: 4.7, reviews: 876, sold: 2100,
        volume: "50ml", skin: "Da khô & hỗn hợp", badge: "MỚI VỀ",
        tags: ["Cấp ẩm sâu", "Phục hồi"], stockLeft: 28,
        img: "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?w=600&q=80",
    },
    {
        id: 3, name: "Sunscreen Fluid SPF 50+", brand: "Routine Skincare",
        oldPrice: 320000, newPrice: 192000, discount: 40,
        rating: 4.9, reviews: 2140, sold: 5600,
        volume: "40ml", skin: "Da nhạy cảm", badge: "YÊU THÍCH",
        tags: ["PA++++", "Kết cấu nhẹ"], stockLeft: 5,
        img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    },
    {
        id: 4, name: "Gentle Pore Cleansing Foam", brand: "Routine Skincare",
        oldPrice: 275000, newPrice: 165000, discount: 40,
        rating: 4.6, reviews: 654, sold: 1890,
        volume: "120ml", skin: "Da dầu mụn", badge: "GỢI Ý",
        tags: ["Làm sạch sâu", "Kiểm soát dầu"], stockLeft: 40,
        img: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
    },
    {
        id: 5, name: "Rose Toner Balancing Mist", brand: "Routine Skincare",
        oldPrice: 480000, newPrice: 288000, discount: 40,
        rating: 4.7, reviews: 432, sold: 980,
        volume: "150ml", skin: "Da thường & khô", badge: "TRENDING",
        tags: ["Cân bằng pH", "Hoa hồng Bulgaria"], stockLeft: 19,
        img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",
    },
    {
        id: 6, name: "Complete Routine Gift Set", brand: "Routine Skincare",
        oldPrice: 1200000, newPrice: 720000, discount: 40,
        rating: 4.9, reviews: 389, sold: 720,
        volume: "Bộ 5 sản phẩm", skin: "Mọi loại da", badge: "COMBO HOT",
        tags: ["Tiết kiệm 480k", "Hộp quà cao cấp"], stockLeft: 8,
        img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80",
    },
];

function StarRating({ rating }) {
    return (
        <span className="stars-row">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={i <= Math.round(rating) ? "star filled" : "star"}>★</span>
            ))}
            <span className="rating-num">{rating}</span>
        </span>
    );
}

function ProductCard({ product, index }) {
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const urgent = product.stockLeft <= 10;
    const handleAdd = () => { setAdded(true); setTimeout(() => setAdded(false), 1800); };

    return (
        <div className="product-card" style={{ animationDelay: `${index * 0.07}s` }}>
            {/* Badge */}
            <span className="product-badge">{product.badge}</span>

            {/* Wishlist */}
            <button
                className={`wish-btn ${wishlisted ? "wished" : ""}`}
                onClick={() => setWishlisted(!wishlisted)}
                title="Yêu thích"
            >
                {wishlisted ? "♥" : "♡"}
            </button>

            {/* Image wrapper */}
            <div className="product-image-wrapper">
                <img src={product.img} alt={product.name} className="product-image" />
                <div className="discount-ribbon">-{product.discount}%</div>

                {/* Overlay actions */}
                <div className="product-actions-overlay">
                    <button
                        className={`view-more-btn ${added ? "btn-added" : ""}`}
                        onClick={handleAdd}
                    >
                        {added ? "✓ Đã thêm" : "Thêm vào giỏ"}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="product-info">
                <span className="product-category-link">{product.brand} · {product.volume}</span>
                <div className="product-name">{product.name}</div>

                {/* Tags */}
                <div className="p-tags">
                    {product.tags.map((t, i) => <span key={i} className="p-tag">{t}</span>)}
                    <span className="p-tag skin-tag">{product.skin}</span>
                </div>

                {/* Rating */}
                <div className="rating-row">
                    <StarRating rating={product.rating} />
                    <span className="review-count">({product.reviews.toLocaleString()})</span>
                </div>

                {/* Sold bar */}
                <div className="sold-section">
                    <div className="sold-bar-bg">
                        <div className="sold-bar-fill" style={{ width: `${Math.min(product.sold / 70, 100)}%` }}></div>
                    </div>
                    <span className="sold-label">Đã bán <strong>{product.sold.toLocaleString()}</strong></span>
                </div>

                {/* Stock warning */}
                {urgent && (
                    <div className="stock-alert">Chỉ còn {product.stockLeft} sản phẩm</div>
                )}

                {/* Price */}
                <div className="product-price-row">
                    <div className="prices">
                        <span className="price-old">{product.oldPrice.toLocaleString()}₫</span>
                        <span className="price-new">{product.newPrice.toLocaleString()}₫</span>
                    </div>
                    <span className="price-save">Tiết kiệm {(product.oldPrice - product.newPrice).toLocaleString()}₫</span>
                </div>
            </div>
        </div>
    );
}

function Event() {
    const [activeFilter, setActiveFilter] = useState(0);
    const filters = ["Tất cả", "Serum", "Kem dưỡng", "Chống nắng", "Sữa rửa mặt", "Combo"];
    const [index, setIndex] = useState(0);
    const slides = [
        {
            img: "https://www.yellowbrick.co/wp-content/uploads/2023/08/fashion_blog_styling_blog_two-models-min-1024x683.jpg",
            title: "Thời trang hiện đại",
            content: "Routine.vn không chỉ đơn thuần là một nền tảng thương mại điện tử, mà là một không gian nghệ thuật trực tuyến, nơi phong cách thanh lịch và nhịp sống hiện đại giao thoa.Đại diện cho tư duy thời trang 'Look Smart' – tinh giản, sắc sảo và đầy tính ứng dụng, website của Routine mang đến cho giới mộ điệu một lăng kính mới về thời trang Việt Nam cao cấp, được chế tác tỉ mỉ để tôn vinh vóc dáng người Á Đông.",
        },
        {
            img: "https://static.fibre2fashion.com//articleresources/images/23/2287/SS988ebe_Small.jpg",
            title: "Tôn Vinh Chất Liệu Bền Vững",
            content: "Thể hiện tầm nhìn của một thương hiệu thời trang tiên phong, Routine.vn là nơi khách hàng có thể tiếp cận với các bộ sưu tập 'Thời trang Xanh'. Những thiết kế tại đây ưu tiên ứng dụng kỹ thuật dệt may tiên tiến từ các chất liệu sinh thái như sợi bã cà phê, sợi tre tự nhiên (bamboo) hay vật liệu tái chế Repreve, hướng tới giá trị cốt lõi về phát triển bền vững.",
        },
        {
            img: "https://mpics-cdn-acc.mgronline.com/pics/Images/569000002172201.JPEG.webp",
            title: "Thời trang hiện đại",
            content: "Routine.vn không chỉ đơn thuần là một nền tảng thương mại điện tử, mà là một không gian nghệ thuật trực tuyến, nơi phong cách thanh lịch và nhịp sống hiện đại giao thoa.Đại diện cho tư duy thời trang 'Look Smart' – tinh giản, sắc sảo và đầy tính ứng dụng, website của Routine mang đến cho giới mộ điệu một lăng kính mới về thời trang Việt Nam cao cấp, được chế tác tỉ mỉ để tôn vinh vóc dáng người Á Đông.",
        }
    ];
    useEffect(() => {
        aos.init({ once: false });
    }, [index]);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [index]);

    function nextSlides() { setIndex(prev => (prev + 1) % slides.length); }
    function prevSlides() { setIndex(prev => (prev - 1 + slides.length) % slides.length); }
    console.log(slides)
    return (
        <div>
            <Header />

            {/* Hero video */}
            <div className="content">
                <video autoPlay loop muted>
                    <source src="../public/8517567-uhd_4096_2160_24fps.mp4" type="video/mp4" />
                </video>
                <div className="event-content">
                    <h1>VƯỢT QUA NHỊP SỐNG THƯỜNG NGÀY. SỰ KIỆN CHUYÊN NGHIỆP. KHOẢNH KHẮC ĐÁNG NHỚ.</h1>
                    <p>Cùng khám phá các mặc hàng đang được giảm giá cực sốc của routine</p>
                </div>
            </div>
            <section className="slide" style={{ overflow: 'hidden' }}>
                {/* ✅ Thêm style transform để slide thực sự trượt */}
                <div className="into" style={{ transform: `translateX(-${index * 100}%)` }}>
                    {slides.map((slide, i) => (
                        <div className="cart_slide" key={i}>
                            <img
                                data-aos="fade-up"
                                data-aos-duration="1000"
                                data-aos-easing="ease-in-out"
                                src={slide.img}
                                alt={slide.title}
                            />
                            <div className="content">
                                <h1
                                    data-aos="fade-left"
                                    data-aos-duration="1000"
                                    data-aos-delay="200"
                                    data-aos-easing="ease-in-out"
                                >
                                    {slide.title}
                                </h1>
                                <span
                                    data-aos="fade-left"
                                    data-aos-duration="1000"
                                    data-aos-delay="400"
                                    data-aos-easing="ease-in-out"
                                    style={{ display: 'inline-block' }}
                                >
                                    {slide.content}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="prev" onClick={prevSlides}>❮</button>
                <button className="next" onClick={nextSlides}>❯</button>
            </section>

            {/* ===== PROMO SECTION ===== */}
            <div className="promo-section">

                {/* Header */}
                <div className="promo-head">
                    <div className="eyebrow-wrap">
                        <span className="eyebrow-line" />
                        <span className="eyebrow-text">KHUYẾN MÃI ĐẶC BIỆT</span>
                        <span className="eyebrow-line" />
                    </div>
                    <h1 className="promo-title">Các Khuyến Mãi Hot</h1>
                    <p className="promo-sub">Sản phẩm chăm sóc da cao cấp — ưu đãi có hạn</p>
                </div>

                {/* Filter */}
                <div className="filter-row">
                    {filters.map((f, i) => (
                        <span
                            key={i}
                            className={`filter-chip ${activeFilter === i ? "active" : ""}`}
                            onClick={() => setActiveFilter(i)}
                        >{f}</span>
                    ))}
                </div>

                {/* Product grid */}
                <div className="product-list">
                    {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>

                {/* View more */}
                <div className="view-more-wrap">
                    <a href="#" className="view-more-link">Xem tất cả sản phẩm →</a>
                </div>

                {/* Perks */}
                <div className="perks-grid">
                    {[
                        { icon: "✈", title: "Miễn phí vận chuyển", sub: "Đơn từ 499.000₫" },
                        { icon: "↩", title: "Đổi trả 30 ngày", sub: "Không cần giải thích" },
                        { icon: "◎", title: "Hàng chính hãng", sub: "Cam kết từ nhà sản xuất" },
                        { icon: "◈", title: "Thanh toán an toàn", sub: "Mã hoá SSL 256-bit" },
                    ].map((p, i) => (
                        <div key={i} className="perk-item">
                            <span className="perk-icon">{p.icon}</span>
                            <div>
                                <div className="perk-title">{p.title}</div>
                                <div className="perk-sub">{p.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Combo banner */}
                <div className="combo-banner">
                    <div className="combo-inner">
                        <span className="combo-eyebrow">ƯU ĐÃI ĐẶC BIỆT</span>
                        <h2 className="combo-title">Mua 2 — Tặng 1</h2>
                        <p className="combo-desc">Áp dụng toàn bộ dòng Routine Serum & Moisturizer. Quà tặng trị giá 150.000₫.</p>
                        <div className="combo-pills">
                            <span className="cpill">Số lượng có hạn</span>
                            <span className="cpill">Không cần mã giảm giá</span>
                        </div>
                        <a href="#" className="combo-btn">Mua ngay →</a>
                    </div>
                    <div className="combo-deco">
                        <div className="deco-big-circle" />
                        <div className="deco-small-circle" />
                    </div>
                </div>

            </div>
            {/* ===== END PROMO ===== */}

            <Footer />

            <style jsx>{`
                /* ── Base (giữ nguyên gốc) ── */
                header { background:#fff; position:fixed; top:0; left:0; right:0; z-index:1000; transition:all 0.3s ease; }
                .content { text-align:center; width:100%; height:100%; position:relative; }
                video { width:100%; height:100%; object-fit:cover; }
                .event-content { position:absolute; top:50%; left:40%; transform:translate(-50%,-50%); color:#fff; text-align:start; width:55%; }
                .event-content h1 { font-size:50px; font-weight:600; }

                /* ── Promo section — theo phong cách CSS gốc ── */
                .promo-section {
                    width:100%;
                    padding:80px 50px;
                    background:#fff;
                   
                    color:#1a1a1a;
                }
                .slide {
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    margin: 10px 0px;
                }

                /* container trượt */
                .slide .into {
                    display: flex;
                    /* QUAN TRỌNG */
                    transition: transform 0.5s ease-in-out;
                }

                /* mỗi slide */
                .slide .into .cart_slide {
                    min-width: 100%;
                    /* mỗi slide chiếm 100% */
                    display: flex;
                    padding: 40px 15%;
                    gap: 30px;
                }

                .slide .into .cart_slide .content {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    gap: 10px;
                }

                /* ảnh */
                .slide .into img {
                    width: 500px;
                    height: 350px;
                    object-fit: cover;
                    border-radius: 5px;
                }

                /* nút */
                .slide .prev,
                .slide .next {
                    border: none;
                    background: none;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 30px;
                    cursor: pointer;
                }

                .slide .prev {
                    left: 10px;
                }

                .slide .next {
                    right: 10px;
                }

                /* Header */
                .promo-head { text-align:center; margin-bottom:50px; }
                .eyebrow-wrap { display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:20px; }
                .eyebrow-line { flex:1; max-width:60px; height:1px; background:#d2d2d7; }
                .eyebrow-text { font-size:11px; letter-spacing:3px; font-weight:600; color:#86868b; }
                .promo-title {
                    font-size:30px;
                    font-weight:600;
                    position:relative;
                    padding-bottom:10px;
                    margin:0 auto 10px;
                    display:inline-block;
                }
                .promo-title::after {
                    content:"";
                    position:absolute;
                    bottom:0; left:50%;
                    transform:translateX(-50%);
                    width:200px; height:1px;
                    background:#000;
                }
                .promo-sub { font-size:15px; color:#86868b; margin:16px 0 0; }

                /* Filter */
                .filter-row {
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    justify-content:center;
                    margin-bottom:50px;
                    list-style:none;
                    padding:0;
                }
                .filter-chip {
                    cursor:pointer;
                    position:relative;
                    padding-bottom:5px;
                    font-size:14px;
                    font-weight:500;
                    color:#666;
                    transition:color 0.3s ease;
                    padding:6px 18px;
                    border:1px solid rgba(0,0,0,0.1);
                    border-radius:20px;
                    transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                }
                .filter-chip:hover { color:#000; border-color:#000; }
                .filter-chip.active { background:#1a1a1a; color:#fff; border-color:#1a1a1a; font-weight:600; }

                /* Product list — giống .product-list gốc */
                .product-list {
                    display:grid;
                    grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
                    gap:30px;
                    margin-top:10px;
                    margin-bottom:20px;
                }

                /* Card — giống .product-card gốc + mở rộng */
                .product-card {
                    background:#fff;
                    border-radius:12px;
                    overflow:hidden;
                    transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
                    position:relative;
                    border:1px solid rgba(0,0,0,0.05);
                    animation: fadeUp 0.5s ease both;
                }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .product-card:hover { transform:translateY(-8px); box-shadow:0 15px 30px rgba(0,0,0,0.10); }

                .product-badge {
                    position:absolute; top:15px; left:15px;
                    background:#1a1a1a; color:#fff;
                    font-size:10px; font-weight:700;
                    padding:4px 10px; border-radius:20px;
                    letter-spacing:1px; z-index:10;
                }

                .wish-btn {
                    position:absolute; top:14px; right:14px; z-index:10;
                    background:rgba(255,255,255,0.9);
                    border:1px solid rgba(0,0,0,0.08);
                    border-radius:50%; width:34px; height:34px;
                    font-size:16px; cursor:pointer;
                    transition:all 0.2s; color:#86868b;
                    display:flex; align-items:center; justify-content:center;
                    padding:0;
                }
                .wish-btn:hover, .wish-btn.wished { color:#c0392b; border-color:#c0392b; }

                /* Image — giống .product-image-wrapper gốc */
                .product-image-wrapper {
                    position:relative;
                    padding-top:100%;
                    overflow:hidden;
                    background:#f5f5f7;
                }
                .product-image {
                    position:absolute; top:0; left:0;
                    width:100%; height:100%;
                    object-fit:cover;
                    transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);
                }
                .product-card:hover .product-image { transform:scale(1.08); }

                .discount-ribbon {
                    position:absolute; bottom:14px; left:14px;
                    background:#1a1a1a; color:#fff;
                    font-size:12px; font-weight:700;
                    padding:4px 10px; border-radius:20px;
                }

                /* Overlay — giống .product-actions-overlay gốc */
                .product-actions-overlay {
                    position:absolute;
                    bottom:20px; left:50%;
                    transform:translateX(-50%) translateY(20px);
                    display:flex; gap:10px;
                    opacity:0;
                    transition:all 0.3s ease;
                }
                .product-card:hover .product-actions-overlay {
                    opacity:1;
                    transform:translateX(-50%) translateY(0);
                }
                .view-more-btn {
                    background:#fff; color:#1a1a1a;
                    padding:12px 24px; border-radius:30px;
                    font-size:13px; font-weight:600;
                    box-shadow:0 10px 25px rgba(0,0,0,0.12);
                    transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                    border:none; cursor:pointer;
                    white-space:nowrap;
                    font-family:'Inter',sans-serif;
                }
                .view-more-btn:hover { background:#1a1a1a; color:#fff; transform:scale(1.05); }
                .view-more-btn.btn-added { background:#1a1a1a; color:#fff; }

                /* Product info — giống .product-info gốc */
                .product-info { padding:20px; text-align:left; }
                .product-category-link {
                    font-size:12px; text-transform:uppercase;
                    color:#86868b; font-weight:600;
                    letter-spacing:0.5px; margin-bottom:8px;
                    display:block;
                }
                .product-name {
                    font-size:16px; font-weight:500;
                    margin-bottom:10px;
                    white-space:nowrap; overflow:hidden;
                    text-overflow:ellipsis; color:#1d1d1f;
                }

                .p-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
                .p-tag {
                    font-size:11px; color:#86868b;
                    border:1px solid rgba(0,0,0,0.1);
                    border-radius:20px; padding:2px 9px;
                }
                .skin-tag { background:#f5f5f7; }

                .rating-row { display:flex; align-items:center; gap:6px; margin-bottom:10px; }
                .stars-row { display:flex; align-items:center; gap:2px; }
                .star { font-size:12px; color:#d2d2d7; }
                .star.filled { color:#1a1a1a; }
                .rating-num { font-size:12px; font-weight:700; color:#1a1a1a; margin-left:4px; }
                .review-count { font-size:12px; color:#86868b; }

                .sold-section { margin-bottom:10px; }
                .sold-bar-bg { height:3px; background:#f5f5f7; border-radius:10px; overflow:hidden; margin-bottom:5px; }
                .sold-bar-fill { height:100%; background:#1a1a1a; border-radius:10px; transition:width 0.6s ease; }
                .sold-label { font-size:12px; color:#86868b; }

                .stock-alert {
                    font-size:12px; color:#c0392b;
                    background:#fdf0f0; border-radius:6px;
                    padding:5px 10px; margin-bottom:10px;
                    display:inline-block;
                }

                /* Price — giống .product-price-row gốc */
                .product-price-row {
                    display:flex; justify-content:space-between;
                    align-items:flex-end; margin-top:12px;
                }
                .prices { display:flex; flex-direction:column; }
                .price-old { font-size:12px; color:#86868b; text-decoration:line-through; margin-bottom:2px; }
                .price-new { font-size:17px; font-weight:700; color:#1d1d1f; }
                .price-save {
                    font-size:11px; color:#1a1a1a;
                    background:#f5f5f7; border-radius:6px;
                    padding:3px 8px; font-weight:600;
                }

                /* View more link — giống gốc */
                .view-more-wrap { display:flex; justify-content:center; margin:50px 0; }
                .view-more-link {
                    text-decoration:none; text-align:center;
                    color:#1a1a1a; font-size:1rem;
                    font-weight:600;
                    transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                    position:relative; padding-bottom:4px;
                }
                .view-more-link::after {
                    content:""; position:absolute;
                    bottom:0; left:0; width:0; height:1px;
                    background:#000;
                    transition:width 0.3s ease-in-out;
                }
                .view-more-link:hover::after { width:100%; }

                /* Perks */
                .perks-grid {
                    display:grid;
                    grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
                    gap:24px;
                    padding:40px 0;
                    border-top:1px solid rgba(0,0,0,0.08);
                    border-bottom:1px solid rgba(0,0,0,0.08);
                    margin-bottom:60px;
                }
                .perk-item { display:flex; align-items:flex-start; gap:14px; }
                .perk-icon { font-size:20px; margin-top:2px; color:#86868b; }
                .perk-title { font-size:14px; font-weight:600; color:#1a1a1a; margin-bottom:3px; }
                .perk-sub { font-size:12px; color:#86868b; }

                /* Combo banner */
                .combo-banner {
                    background:#1a1a1a; border-radius:12px;
                    padding:60px;
                    display:flex; justify-content:space-between;
                    align-items:center; overflow:hidden;
                    position:relative;
                }
                .combo-inner { position:relative; z-index:2; }
                .combo-eyebrow {
                    font-size:10px; letter-spacing:3px;
                    color:#86868b; font-weight:600;
                    display:block; margin-bottom:12px;
                }
                .combo-title {
                    font-size:40px; font-weight:700;
                    color:#fff; margin:0 0 12px;
                    line-height:1.2;
                }
                .combo-desc { font-size:15px; color:#86868b; max-width:480px; margin:0 0 20px; line-height:1.7; }
                .combo-pills { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
                .cpill {
                    font-size:12px; color:#86868b;
                    border:1px solid #333; border-radius:20px;
                    padding:4px 12px;
                }
                .combo-btn {
                    display:inline-block;
                    background:#fff; color:#1a1a1a;
                    text-decoration:none;
                    font-size:14px; font-weight:600;
                    padding:13px 28px; border-radius:30px;
                    transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                }
                .combo-btn:hover { background:#f5f5f7; transform:translateY(-2px); box-shadow:0 10px 30px rgba(255,255,255,0.1); }
                .combo-deco { position:absolute; right:60px; top:50%; transform:translateY(-50%); }
                .deco-big-circle {
                    width:200px; height:200px; border-radius:50%;
                    border:1px solid rgba(255,255,255,0.08);
                    position:absolute; top:-80px; right:-40px;
                }
                .deco-small-circle {
                    width:120px; height:120px; border-radius:50%;
                    border:1px solid rgba(255,255,255,0.05);
                    position:absolute; top:-20px; right:20px;
                }
                
            `}</style>
        </div>
    );
}

export default Event;