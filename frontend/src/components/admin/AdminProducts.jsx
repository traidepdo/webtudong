import React, { useEffect, useState } from 'react';
import api from '../../api';

const AdminProducts = () => {
    const [showForm, setShowForm] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [checkbox, setCheckbox] = useState(false);
    const [variants, setVariants] = useState([
        { color: "", size: "", price: "", stock: "", image: null }
    ]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [prodRes, catRes, colorRes, sizeRes] = await Promise.all([
                    api.get('products/'),
                    api.get('categories/'),
                    api.get('colors/'),
                    api.get('sizes/'),
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
                setColors(colorRes.data);
                setSizes(sizeRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('products/');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('description', description);

            const formattedVariants = variants.map(v => ({
                color: v.color,
                size: v.size,
                price: v.price,
                stock_quantity: v.stock
            }));
            formData.append('variants', JSON.stringify(formattedVariants));

            const formattedImagesInfo = [];
            variants.forEach((v, index) => {
                if (v.image) {
                    formData.append('uploaded_images', v.image);
                    formattedImagesInfo.push({
                        color: v.color,
                        is_primary: index === 0 ? checkbox : false
                    });
                }
            });
            formData.append('images', JSON.stringify(formattedImagesInfo));

            await api.post('products/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Thêm sản phẩm thành công!");
            fetchProducts();
            setShowForm(false);
        } catch (err) {
            console.error("Error adding product", err);
            alert("Có lỗi khi thêm sản phẩm");
        }
    };

    const addNewVariant = () => {
        setVariants([...variants, { color: "", size: "", price: "", stock: "", image: null }]);
    };

    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...variants];
        updatedVariants[index][field] = value;
        setVariants(updatedVariants);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải danh sách sản phẩm...</p>
        </div>
    );

    return (
        <div className="admin-products">
            {!showForm ? (
                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <h2>Danh sách sản phẩm</h2>
                        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-lg"></i>
                            Thêm sản phẩm
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Ảnh</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Giá (từ)</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td>#{product.id}</td>
                                        <td>
                                            <img src={product.images[0]?.image} alt={product.name} className="table-img" />
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{product.name}</td>
                                        <td>
                                            <span className="status-badge processing">{product.category_name}</span>
                                        </td>
                                        <td style={{ fontWeight: '700', color: '#1e293b' }}>
                                            {Number(product.variants[0]?.price).toLocaleString()}đ
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" className="admin-btn admin-btn-edit">
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button type="button" className="admin-btn admin-btn-delete">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="admin-table-container" style={{ padding: '30px' }}>
                    <div className="admin-table-header" style={{ borderBottom: 'none', padding: '0 0 30px 0' }}>
                        <h2>Thêm sản phẩm mới</h2>
                        <button className="admin-btn admin-btn-edit" onClick={() => setShowForm(false)}>Hủy bỏ</button>
                    </div>

                    <div className="admin-form-group" style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tên sản phẩm</label>
                            <input
                                type="text"
                                className="form-control"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={name}
                                placeholder="Nhập tên sản phẩm..."
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Mô tả</label>
                            <textarea
                                className="form-control"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '120px' }}
                                value={description}
                                placeholder="Mô tả chi tiết sản phẩm..."
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Danh mục</label>
                            <select
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="variants-section" style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Biến thể sản phẩm</h3>
                            {variants.map((variant, index) => (
                                <div key={index} style={{ background: '#f8fafc', padding: '20px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <strong style={{ fontSize: '16px' }}>Biến thể #{index + 1}</strong>
                                        {variants.length > 1 && (
                                            <button type="button" onClick={() => removeVariant(index)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                                Xóa
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Màu sắc</label>
                                            <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)}>
                                                <option value="">Chọn màu</option>
                                                {colors.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Kích thước</label>
                                            <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)}>
                                                <option value="">Chọn size</option>
                                                {sizes.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Giá bán</label>
                                            <input type="number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Số lượng</label>
                                            <input type="number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Hình ảnh</label>
                                            <input type="file" onChange={(e) => handleVariantChange(index, 'image', e.target.files[0])} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="admin-btn admin-btn-edit" onClick={addNewVariant} style={{ width: '100%', justifyContent: 'center' }}>
                                <i className="bi bi-plus-circle"></i>
                                Thêm biến thể mới
                            </button>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', gap: '15px' }}>
                            <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddSubmit}>
                                <i className="bi bi-check-lg"></i>
                                Lưu sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;

