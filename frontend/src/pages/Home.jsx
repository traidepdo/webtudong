import Header from "../components/Header";
import Footer from "../components/Footer";
import "../App.css"
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import Typewriter from 'typewriter-effect';
import AOS from "aos";
import "aos/dist/aos.css";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useRef } from "react";
import WebsiteSEO from "../components/WebsiteSEO";

function Home({ scrolled }) {
    const [listProduct, setListProduct] = useState("all");
    const [product, setProduct] = useState([]);
    const [filter, setFilter] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState([]);

    const [viewMore, setViewMore] = useState("all");

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/products/")
            .then(res => setProduct(res.data))
            .catch(error => console.log(error));

        axios.get("http://127.0.0.1:8000/api/products/?category=office")
            .then(res => setCategoryProducts(res.data.slice(0, 3)))
            .catch(error => console.log(error));
    }, [])
    useEffect(() => {
        if (listProduct === 'all') {
            setFilter(product);
        }
        else {
            setFilter(product.filter(item => item.category == listProduct));
        }
    }, [listProduct, product])

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            offset: 80,
            easing: 'ease-out-cubic',
        });
    }, []);


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

    const { scrollY } = useScroll();
    const videoYRaw = useTransform(scrollY, [0, 600], [0, 80]);
    const videoY = useSpring(videoYRaw, { stiffness: 80, damping: 25, mass: 0.6 });
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    // Section Refs
    const horizontalRef = useRef(null);
    const clipRef = useRef(null);

    // Horizontal Scroll Logic
    const { scrollYProgress: horizontalProgress } = useScroll({
        target: horizontalRef,
        offset: ["start start", "end end"]
    });
    const horizontalScrollRaw = useTransform(horizontalProgress, [0, 1], ["0%", "-55%"]);
    const horizontalScroll = useSpring(horizontalScrollRaw, { stiffness: 60, damping: 20, mass: 0.5 });
    const horizontalBgText = useTransform(horizontalProgress, [0, 1], ["0%", "-20%"]);

    // ── OFFICE SECTION scroll parallax ──────────────────────
    const { scrollYProgress: clipProgress } = useScroll({
        target: clipRef,
        offset: ["start end", "end start"]
    });

    // Background text parallax
    const bgTextX = useTransform(scrollY, [0, 2000], [0, -800]);

    return (
        <div>
            <Helmet>
                <title>Trang chủ | Routine - Thời trang hiện đại</title>
                <meta name="description" content="Khám phá bộ sưu tập thời trang công sở và dạo phố hiện đại, thanh lịch tại Routine. Tôn vinh vóc dáng người Á Đông với chất liệu bền vững." />
            </Helmet>
            <WebsiteSEO
                pageTitle="Trang chủ | Routine - Thời trang hiện đại"
                pageDescription="Khám phá bộ sưu tập thời trang công sở và dạo phố hiện đại, thanh lịch tại Routine. Tôn vinh vóc dáng người Á Đông với chất liệu bền vững."
                baseUrl={window.location.origin}
            />
            <Header scrolled={scrolled} />
            <main>
                {/* HERO SECTION: AVANT-GARDE SPLIT SCREEN */}
                <section className="hero-avant-garde">
                    <div className="hero-grid">
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                            className="hero-left"
                        >
                            <div className="tagline">SINCE 2026</div>
                            <h1>
                                <span className="outline">MODERN</span><br />
                                <span>REDEFINED</span>
                            </h1>
                            <p>Routine.vn - Nơi nghệ thuật và phong cách giao thoa trong từng sợi vải.</p>
                            <Link to="/products" className="cta-button-luxury">
                                EXPLORE COLLECTION
                                <span className="arrow">→</span>
                            </Link>
                        </motion.div>

                        <motion.div
                            style={{ y: videoY }}
                            className="hero-right"
                        >
                            <div className="video-container-avant">
                                <video autoPlay loop muted playsInline aria-label="Video giới thiệu bộ sưu tập thời trang Routine 2026">
                                    <source src="/9604240-uhd_4096_2160_25fps.mp4" type="video/mp4" />
                                </video>
                                <div className="video-overlay"></div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        style={{ opacity }}
                        className="floating-text"
                    >
                        STYLE / ELEGANCE / ROUTINE
                    </motion.div>
                </section>

                {/* BRAND STORY — alternating rows, nền sáng, chuẩn SEO */}
                <section className="brand-story-section" aria-label="Câu chuyện thương hiệu Routine">
                    <div className="brand-story-header">
                        <span className="bs-eyebrow">Về Routine.vn</span>
                        <h2 className="bs-title">Thời trang định hình<br /><em>phong cách sống</em></h2>
                    </div>

                    {[
                        {
                            img: "https://www.yellowbrick.co/wp-content/uploads/2023/08/fashion_blog_styling_blog_two-models-min-1024x683.jpg",
                            tag: "Triết lý thương hiệu",
                            heading: "Look Smart — Tinh giản, sắc    sảo, ứng dụng cao",
                            body: "Routine.vn không chỉ là nơi mua sắm — đây là không gian định nghĩa lại thời trang Việt Nam hiện đại. Chúng tôi theo đuổi triết lý Look Smart: mỗi thiết kế đều tinh giản, sắc sảo và tối ưu cho nhịp sống bận rộn của người đô thị.",
                            alt: "Thời trang hiện đại Routine.vn phong cách Look Smart",
                        },
                        {
                            img: "https://static.fibre2fashion.com//articleresources/images/23/2287/SS988ebe_Small.jpg",
                            tag: "Chất liệu bền vững",
                            heading: "Thời trang xanh — Vải sợi sinh thái thế hệ mới",
                            body: "Routine tiên phong ứng dụng chất liệu sinh thái: sợi bã cà phê kháng khuẩn tự nhiên, sợi tre bamboo mềm mại, vải tái chế Repreve từ chai nhựa. Mặc đẹp — sống xanh — không đánh đổi.",
                            alt: "Thời trang bền vững Routine chất liệu sinh thái sợi tre bamboo",
                        },
                        {
                            img: "https://mpics-cdn-acc.mgronline.com/pics/Images/569000002172201.JPEG.webp",
                            tag: "Tôn vinh người Á Đông",
                            heading: "Form dáng được cắt may riêng cho vóc dáng Việt",
                            body: "Mỗi sản phẩm tại Routine được nghiên cứu kỹ lưỡng để tôn lên vóc dáng người Á Đông — không rộng thùng thình, không bó cứng nhắc. Chuẩn form từ vai, eo đến chiều dài tay — mặc là vừa.",
                            alt: "Thời trang Routine thiết kế chuẩn form vóc dáng người Việt Á Đông",
                        },
                    ].map((item, idx) => (
                        <article key={idx} className={`bs-row ${idx % 2 === 1 ? "bs-row--reverse" : ""}`}>
                            <motion.div
                                className="bs-img-wrap"
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <img src={item.img} alt={item.alt} loading="lazy" />
                                <div className="bs-img-num" aria-hidden="true">0{idx + 1}</div>
                            </motion.div>

                            <motion.div
                                className="bs-text-wrap"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
                            >
                                <span className="bs-tag">{item.tag}</span>
                                <h3 className="bs-heading">{item.heading}</h3>
                                <div className="bs-rule" />
                                <p className="bs-body">{item.body}</p>
                            </motion.div>
                        </article>
                    ))}
                </section>

                {/* PPT MORPH: HORIZONTAL SCROLL LATEST DROPS */}
                <section ref={horizontalRef} className="ppt-horizontal-section">
                    <div className="sticky-horizontal-container">
                        <motion.h2
                            className="huge-bg-text"
                            style={{ x: horizontalBgText }}
                        >
                            LATEST DROPS / EDITION 2026
                        </motion.h2>

                        <motion.div
                            style={{ x: horizontalScroll }}
                            className="horizontal-track"
                        >
                            <div className="horizontal-intro">
                                <div className="intro-badge">01 // NEW ARRIVALS</div>
                                <h3>The<br />New<br />Standard.</h3>
                                <p>Sự kết hợp hoàn hảo giữa thiết kế đương đại và chất liệu bền vững. Cuộn để khám phá sự chuyển mình của thời trang.</p>
                                <img src="https://i.pinimg.com/736x/8f/c9/77/8fc977a41d063717fc8a504a500b4119.jpg" alt="Editorial Fashion" className="intro-image" />
                            </div>

                            {product.slice(0, 4).map((item, idx) => (
                                <motion.article
                                    key={item.id}
                                    className="horizontal-card-wrapper"
                                    whileHover={{ scale: 1.05, rotateY: -5, zIndex: 10 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <ProductCard product={item} />
                                </motion.article>
                            ))}

                            <div className="horizontal-outro">
                                <h3>View<br />More<br />Collection <span className="arrow">→</span></h3>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* OFFICE COLLECTION — nền sáng, chuẩn SEO, scroll reveal */}
                <section
                    ref={clipRef}
                    className="office-section"
                    aria-label="Bộ sưu tập thời trang công sở Routine SS 2026"
                >
                    <div className="office-sticky">

                        {/* Label + heading reveal khi scroll vào */}
                        <div className="office-intro">
                            <motion.span
                                className="office-eyebrow"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.7 }}
                            >
                                Bộ sưu tập SS 2026
                            </motion.span>
                            <div className="office-title-mask">
                                <motion.h2
                                    className="office-title"
                                    style={{ y: useTransform(clipProgress, [0, 0.25], [80, 0]), opacity: useTransform(clipProgress, [0, 0.2], [0, 1]) }}
                                >
                                    Thời trang<br /><em>công sở</em>
                                </motion.h2>
                            </div>
                            <motion.p
                                className="office-seo-lead"
                                style={{ y: useTransform(clipProgress, [0.1, 0.3], [40, 0]), opacity: useTransform(clipProgress, [0.1, 0.28], [0, 1]) }}
                            >
                                Bộ sưu tập thời trang công sở Routine SS 2026 được thiết kế dành riêng
                                cho người Việt hiện đại — chuyên nghiệp, năng động và tự tin trong
                                mọi không gian làm việc.
                            </motion.p>
                        </div>

                        {/* Split: ảnh trái + danh sách đặc điểm phải */}
                        <div className="office-split">

                            {/* Ảnh với parallax nhẹ */}
                            <motion.div
                                className="office-img-col"
                                style={{ y: useTransform(clipProgress, [0.2, 0.9], [0, -60]) }}
                            >
                                <img
                                    src="https://img.vuahanghieu.com/unsafe/0x0/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/news/content/2025/05/shop-mua-do-cong-so-nu-tai-ha-noi-16-jpg-1747722219-20052025132339.jpg"
                                    alt="Bộ sưu tập thời trang công sở Routine SS 2026 — áo len mỏng thanh lịch"
                                    loading="lazy"
                                />
                                <motion.div
                                    className="office-img-badge"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <span className="oib-num">240<sup>+</sup></span>
                                    <span className="oib-label">Mẫu thiết kế<br />mỗi mùa</span>
                                </motion.div>
                            </motion.div>

                            {/* Nội dung đặc điểm sản phẩm */}
                            <div className="office-info-col">
                                <motion.p
                                    className="office-desc"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    Mỗi thiết kế trong bộ sưu tập công sở của Routine đều được nghiên cứu
                                    từ nhu cầu thực tế: form dáng tôn vóc, chất liệu cao cấp chịu được
                                    môi trường văn phòng cả ngày dài.
                                </motion.p>

                                {/* Feature list — chuẩn SEO với ul/li thật */}
                                <ul className="office-features" aria-label="Đặc điểm nổi bật bộ sưu tập công sở">
                                    {[
                                        { icon: "✦", title: "Chống nhăn vĩnh cửu", desc: "Công nghệ xử lý nhiệt giúp vải luôn phẳng mịn suốt 8 tiếng văn phòng." },
                                        { icon: "✦", title: "Thoáng khí 4 chiều", desc: "Sợi vải thoát ẩm nhanh, giữ cơ thể khô thoáng trong không gian điều hòa." },
                                        { icon: "✦", title: "Form chuẩn vóc Á Đông", desc: "Được đo cắt riêng theo tỷ lệ cơ thể người Việt — vai, eo, chiều dài chuẩn." },
                                        { icon: "✦", title: "Bền màu 50+ lần giặt", desc: "Màu sắc giữ nguyên sau nhiều lần giặt nhờ thuốc nhuộm sinh thái cao cấp." },
                                    ].map((feat, i) => (
                                        <motion.li
                                            key={i}
                                            className="office-feat-item"
                                            initial={{ opacity: 0, x: 30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, amount: 0.4 }}
                                            transition={{ duration: 0.6, delay: i * 0.12 }}
                                        >
                                            <span className="ofi-icon" aria-hidden="true">{feat.icon}</span>
                                            <div>
                                                <strong className="ofi-title">{feat.title}</strong>
                                                <p className="ofi-desc">{feat.desc}</p>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, delay: 0.5 }}
                                >
                                    <Link to="/products?category=officee" className="office-cta">
                                        Xem toàn bộ bộ sưu tập công sở
                                        <span className="office-cta-arrow">→</span>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* PPT MORPH: MAGIC LAYOUT COLLECTIONS */}
                <section className="ppt-collections-section">
                    <div className="collections-editorial">
                        <img
                            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
                            alt="Collection Lookbook"
                            className="editorial-cover"
                        />
                        <div className="editorial-text-box">
                            <h2>DISCOVER<br />THE CORE.</h2>
                            <p>Khám phá toàn bộ hệ sinh thái sản phẩm của Routine. Từ những chiếc áo sơ mi basic đến những bộ suit cắt may tỉ mỉ.</p>
                        </div>
                    </div>

                    <div className="collections-main-grid">
                        <div className="ppt-header">
                            <div aria-label="Bộ lọc sản phẩm" className="semantic-nav">
                                <ul className="fluid-filter">
                                    {["all", "shirt", "pants", 1, "accessories"].map((cat) => (
                                        <li key={cat}>
                                            <button
                                                onClick={() => {
                                                    const val = cat === 1 ? 1 : cat;
                                                    setListProduct(val);
                                                    setViewMore(cat === 1 ? "dress" : cat);
                                                }}
                                                className={listProduct === (cat === 1 ? 1 : cat) ? "active" : ""}
                                            >
                                                {listProduct === (cat === 1 ? 1 : cat) && (
                                                    <motion.div
                                                        layoutId="activeFilterBg"
                                                        className="filter-bg-pill"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className="filter-text">
                                                    {cat === "all" ? "Tất cả" :
                                                        cat === "shirt" ? "Áo sơ mi" :
                                                            cat === "pants" ? "Quần" :
                                                                cat === 1 ? "Váy" : "Phụ kiện"}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <motion.div layout className="ppt-grid">
                            <AnimatePresence mode="popLayout">
                                {filter.slice(0, 8).map((item) => (
                                    <motion.article
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                        transition={{ type: "spring", stiffness: 150, damping: 22, mass: 0.8 }}
                                        className="ppt-item"
                                    >
                                        <ProductCard product={item} />
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </motion.div>


                        {filter.length > 8 && (
                            <div className="view-more-bento">
                                <Link to={`/products?category=${viewMore}`} className="cta-button-luxury">
                                    XEM TOÀN BỘ SẢN PHẨM
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Home;