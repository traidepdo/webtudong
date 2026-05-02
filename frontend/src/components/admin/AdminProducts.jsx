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

    // ✅ FIX: Gộp 4 useEffect thành 1, dùng Promise.all để fetch song song
    // Tránh setLoading() bị gọi chồng chéo nhiều lần gây re-render không cần thiết
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

    if (loading) return <div>Đang tải sản phẩm...</div>;

    return (
        // ✅ FIX: Cấu trúc HTML đúng - table nằm NGOÀI admin-header
        <div className="admin-products">
            <div className="admin-header">
                <h2>Quản lý sản phẩm</h2>
                {!showForm && (
                    <button type="button" className="add-btn" onClick={() => setShowForm(true)}>
                        Thêm sản phẩm
                    </button>
                )}
            </div>

            {showForm && (
                <div className="add-product">
                    <label htmlFor="name">Tên sản phẩm</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        placeholder="Tên sản phẩm"
                        onChange={(e) => setName(e.target.value)}
                    />
                    <textarea
                        value={description}
                        placeholder="Mô tả sản phẩm"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <label>Danh mục</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Chọn danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <div className="all-variants-wrapper">
                        {variants.map((variant, index) => (
                            <div key={index} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>Biến thể #{index + 1}</strong>
                                    {variants.length > 1 && (
                                        <button type="button" onClick={() => removeVariant(index)} style={{ color: 'red' }}>
                                            Xóa bộ này
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <div>
                                        <label>Màu sắc</label>
                                        <select value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)}>
                                            <option value="">Chọn màu sắc</option>
                                            {colors.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Kích thước</label>
                                        <select value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)}>
                                            <option value="">Chọn kích thước</option>
                                            {sizes.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Giá</label>
                                        <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} />
                                    </div>
                                    <div>
                                        <label>Kho hàng</label>
                                        <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label>Ảnh</label>
                                        <input type="file" onChange={(e) => handleVariantChange(index, 'image', e.target.files[0])} />
                                    </div>
                                    <div>
                                        <label htmlFor={`is_primary_${index}`}>Ảnh đại diện</label>
                                        <input
                                            type="checkbox"
                                            id={`is_primary_${index}`}
                                            checked={checkbox}
                                            onChange={(e) => setCheckbox(e.target.checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" className="add-more-btn" onClick={addNewVariant} style={{ marginBottom: '20px' }}>
                            + Thêm màu sắc/kích thước khác
                        </button>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                        <button type="button" className="add-btn" onClick={handleAddSubmit}>Lưu tất cả</button>
                        <button type="button" className="delete-btn" onClick={() => setShowForm(false)}>Hủy bỏ</button>
                    </div>
                </div>
            )}

            {!showForm && (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>
                                    <img src={product.images[0]?.image} alt={product.name} width="50" />
                                </td>
                                <td>{product.name}</td>
                                <td>{product.category_name}</td>
                                <td>{product.variants[0]?.price}đ</td>
                                <td>
                                    <button type="button" className="edit-btn">Sửa</button>
                                    <button type="button" className="delete-btn">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <style>{`
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .add-btn {
                    padding: 10px 20px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .add-product {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 800px;
                }
                .admin-table {
                    width: 100%;
                    background: white;
                    border-radius: 8px;
                    border-collapse: collapse;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .admin-table th, .admin-table td {
                    padding: 15px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                .admin-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #333;
                }
                .edit-btn {
                    padding: 5px 10px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    margin-right: 5px;
                    cursor: pointer;
                }
                .delete-btn {
                    padding: 5px 10px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default AdminProducts;