import Headeradmin from "../../components/admin/Header";
// import { Link } from 'react-router-dom';
import NavAdmin from "../../components/admin/Nav";
import "../../App.css";
import api from "../../api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
function ProductAdmin() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);


    const fetchProduct = () => {
        // setLoading(true);
        api.get("/products/")
            .then(res => {
                console.log("Dữ liệu trả về từ API:", res.data);
                setProducts(res.data);
            })
            .catch(err => {
                console.error("Lỗi khi fetch sản phẩm:", err);
            })
            .finally(() => {
                setLoading(false);
            })
    }
    useEffect(() => {
        setLoading(true);
        fetchProduct();
    }, [])
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    }
    const price = (product) => {
        // console.log(product);
        const variant_id = product.images.find(image => image.is_primary)?.variant
        const price = product.variants.find(variant => variant.id === variant_id)?.price
        // console.log(price);
        return formatPrice(price);
    }
    const delectProduct = (slug) => {
        api.delete(`/products/${slug}/`)
            .then(res => {
                console.log(res.data);
                alert("Xóa sản phẩm thành công");
                fetchProduct();
            })
            .catch(err => {
                console.error("Lỗi khi xóa sản phẩm:", err);
            })
    }
    return (
        <div className="container-homeadmin">
            <Headeradmin />

            <div className="content" style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
                {/* Sidebar */}
                <NavAdmin />

                {/* Main content */}
                <div className="main" style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (<h1>Loading...</h1>) : (
                        <table className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Images</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Price</th>
                                    <th scope="col">Category</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td scope="row">{product.id}</td>
                                        <td scope="row">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                    src={product.images.find(image => image.is_primary)?.image || product.images[0].image}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div style={{ width: '100px', height: '100px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                                    No Image
                                                </div>
                                            )}
                                        </td>
                                        <td scope="row">{product.name}</td>
                                        <td scope="row">{price(product)}</td>
                                        <td scope="row">{product.category_name}</td>
                                        <td scope="row" className="">
                                            <button className="button-delete" type="button" onClick={() => delectProduct(product.slug)}><i className="fa-solid fa-trash-can"></i>Delete</button>
                                            <Link to={`/admin/product/${product.slug}`}>
                                                <button className="button-edit" type="button"><i className="fa-regular fa-pen-to-square"></i>Edit</button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    )}
                    <Link to="/admin/product/create" className="btn btn-success" style={{ color: "white", textDecoration: "none" }}>Tạo thêm sản phẩm</Link>

                </div>
            </div>
        </div>
    );
}

export default ProductAdmin;