import ProductCard from "./ProductCard";
import { useEffect, useState } from "react";
import api from "../api";
import AOS from "aos";
import "aos/dist/aos.css";

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
        <section style={{ maxWidth: "1400px", margin: "60px auto", padding: "0 5%" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
                Có thể bạn sẽ thích
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px",
            }}>
                {products.map(item => (
                    <ProductCard key={item.id} product={item} />
                ))}
            </div>
        </section>
    );
};

export default ListProduct;