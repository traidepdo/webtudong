import ProductCard from "./ProductCard";
import { useEffect, useState } from "react";
import api from "../api";
import AOS from "aos";
import "aos/dist/aos.css";
import "../App.css";

const ListProduct = ({ slugged }) => {  // ← nhận đúng prop slugged
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    useEffect(() => {
        if (!slugged) return;
        setLoading(true);
        api.get(`/products/${slugged}/related/`)
            .then(res => setProducts(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [slugged]);

    if (loading || products.length === 0) return null;

    return (
        <section className="related-products-section">
            <h2 className="related-products-title">
                Có thể bạn sẽ thích
            </h2>
            <div className="related-products-grid">
                {products.map(item => (
                    <ProductCard key={item.id} product={item} />
                ))}
            </div>
        </section>
    );
};

export default ListProduct;