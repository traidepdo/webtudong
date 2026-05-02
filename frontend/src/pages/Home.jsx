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
import { motion } from "framer-motion";

function Home({ scrolled }) {
    const [listProduct, setListProduct] = useState("all");
    const [product, setProduct] = useState([]);
    const [filter, setFilter] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState([]);

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
            setFilter(product.filter(item => item.category_name === listProduct));
        }
    }, [listProduct, product])
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            offset: 200,
            mirror: true
        });
    }, []);


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
    function nextSlides() {
        setIndex((index + 1) % slides.length)
    }
    function prevSlides() {
        setIndex((index - 1 + slides.length) % slides.length)
    }
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlides();
        }, 5000);
        return () => clearInterval(interval);
    }, [index])

    return (
        <div>
            <Header scrolled={scrolled} />
            <main>

                <section>
                    <div class="banner-main">
                        <div class="banner-content">
                            <video autoPlay loop muted>
                                <source src="/9604240-uhd_4096_2160_25fps.mp4" type="video/mp4" />
                            </video>
                            <div class="content-banner">
                                <h1><Typewriter
                                    onInit={(typewriter) => {
                                        typewriter.typeString('Đừng để tủ đồ của bạn đơn điệu, hãy làm nó rực rỡ như chính con người bạn.')
                                            .start();
                                    }}
                                    options={{
                                        delay: 50, // Tốc độ gõ
                                    }}
                                /></h1>
                                <p>Khám phá bộ sưu tập mới nhất của chúng tôi và tìm thấy phong cách hoàn hảo cho bạn.</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="slide" style={{ overflow: 'hidden' }}>
                    <div className="into">
                        {/* key={index} giúp React xóa thẻ cũ, tạo thẻ mới để AOS chạy lại từ đầu */}
                        <div className="cart_slide" key={index}>

                            <img
                                data-aos="fade-up"
                                data-aos-duration="1000" // Chạy trong 1 giây cho mượt
                                data-aos-easing="ease-in-out"
                                src={slides[index].img}
                                alt={slides[index].title}
                            />

                            <div className="content">
                                <h1
                                    data-aos="fade-left"
                                    data-aos-duration="1000"
                                    data-aos-delay="200" // Trễ 0.2s so với cái ảnh
                                    data-aos-easing="ease-in-out"
                                >
                                    {slides[index].title}
                                </h1>

                                <span
                                    data-aos="fade-left"
                                    data-aos-duration="1000"
                                    data-aos-delay="400" // Trễ 0.4s (bay ra cuối cùng)
                                    data-aos-easing="ease-in-out"
                                    style={{ display: 'inline-block' }}
                                >
                                    {slides[index].content}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="prev" onClick={prevSlides}>❮</button>
                    <button className="next" onClick={nextSlides}>❯</button>
                </section>

                <section class="new-product">
                    <div class="new-product-content">
                        <div class="new-product-title">
                            <h1 style={{ fontWeight: 600 }}>Sản phẩm mới</h1>
                        </div>
                        <div className="new-product-list">
                            {product.map(item => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                        <div class="view-more">
                            <a href="/products">Xem thêm</a>
                        </div>
                    </div>
                </section>
                <section class="product-category" data-aos="fade-up">
                    <div class="banner">
                        <div class="content">
                            <h1 data-aos="fade-right">Thời trang công sở</h1>

                            <span data-aos="fade-left">
                                Trang phục công sở không chỉ đơn thuần là quần áo mặc đi làm mỗi ngày, mà còn là "ngôn ngữ
                                không lời" thể hiện sự chuyên nghiệp và phong cách cá nhân của bạn. Vượt ra khỏi những khuôn
                                mẫu gò bó cứng nhắc, thời trang công sở hiện đại đề cao sự giao thoa hoàn hảo giữa tính
                                thanh lịch, lịch sự và sự thoải mái. Dù là một chiếc áo sơ mi chỉn chu, quần âu đứng dáng
                                hay một chiếc váy liền tinh tế, việc lựa chọn một bộ đồ phù hợp không chỉ giúp bạn ghi điểm
                                trong mắt đồng nghiệp, đối tác mà còn tiếp thêm sự tự tin để chinh phục mọi thử thách trong
                                công việc.</span>
                        </div>
                        <img src="https://i1-giaitri.vnecdn.net/2025/02/19/ao-len-mong-1739953825.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=AzRPw-TuoecVqdID3sR4QA" alt="" />
                    </div>

                    <div className="product-list">
                        {categoryProducts.map(item => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </section>
                <section class="main-product">
                    <div class="content">
                        <div class="title">
                            <h1>Tất cả sản phẩm</h1>
                        </div>
                        <ul>
                            <li>
                                <span
                                    onClick={() => setListProduct("all")}
                                    className={listProduct === "all" ? "active" : ""}
                                >
                                    Tất cả
                                </span>
                            </li>

                            <li>
                                <span
                                    onClick={() => setListProduct("shirt")}
                                    className={listProduct === "shirt" ? "active" : ""}
                                >
                                    Áo sơ mi
                                </span>
                            </li>

                            <li>
                                <span
                                    onClick={() => setListProduct("pants")}
                                    className={listProduct === "pants" ? "active" : ""}
                                >
                                    Quần
                                </span>
                            </li>

                            <li>
                                <span
                                    onClick={() => setListProduct("dress")}
                                    className={listProduct === "dress" ? "active" : ""}
                                >
                                    Váy
                                </span>
                            </li>

                            <li>
                                <span
                                    onClick={() => setListProduct("accessories")}
                                    className={listProduct === "accessories" ? "active" : ""}
                                >
                                    Phụ kiện
                                </span>
                            </li>
                        </ul>

                    </div>

                    <div className="product-list">
                        {filter.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div >
    );
}
export default Home;