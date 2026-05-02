import { useState, useEffect, useMemo } from "react";
import api from "../../api";
import { useParams } from "react-router-dom";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import "../../App.css";

const newVariantTemplate = () => ({
    id: null,
    color: "",
    size: "",
    price: "",
    stock_quantity: "",
    _tempId: Date.now() + Math.random(),
});

function EditProduct() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);

    const [imageFiles, setImageFiles] = useState({}); s
    const [imagePreviews, setImagePreviews] = useState({});
    const [newVariants, setNewVariants] = useState([]);

    // IDs ảnh cần xóa khi submit
    const [deleteImageIds, setDeleteImageIds] = useState([]);

    useEffect(() => {
        api.get(`/products/${slug}/`)
            .then(res => setProduct(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        Promise.all([api.get("/categories/"), api.get("/sizes/"), api.get("/colors/")])
            .then(([c, s, col]) => {
                setCategories(c.data);
                setSizes(s.data);
                setColors(col.data);
            });
    }, []);

    const imageMapByColor = useMemo(() => {
        if (!product) return {};
        const map = {};
        product.images?.forEach(img => {
            // Chỉ hiện ảnh chưa bị đánh dấu xóa
            if (!deleteImageIds.includes(img.id)) {
                map[img.color] = { id: img.id, url: img.image };
            }
        });
        return map;
    }, [product, deleteImageIds]);

    const allUniqueColors = useMemo(() => {
        const seen = new Set();
        const result = [];
        const addColor = (colorId, colorName) => {
            if (!colorId || seen.has(colorId)) return;
            seen.add(colorId);
            result.push({ colorId: Number(colorId), colorName });
        };
        product?.variants?.forEach(v => addColor(v.color, v.color_name));
        newVariants.forEach(v => {
            if (!v.color) return;
            const colorObj = colors.find(c => c.id === Number(v.color));
            addColor(Number(v.color), colorObj?.name || `Màu #${v.color}`);
        });
        return result;
    }, [product, newVariants, colors]);

    // ---- Handlers variant cũ ----
    const handleVariantChange = (id, field, value) => {
        setProduct(prev => ({
            ...prev,
            variants: prev.variants.map(v =>
                v.id === id ? { ...v, [field]: value } : v
            )
        }));
    };

    // Xóa variant cũ (đánh dấu xóa khỏi state, backend sẽ xóa khi submit)
    const handleDeleteVariant = (variantId) => {
        if (!window.confirm("Xóa biến thể này?")) return;
        setProduct(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v.id !== variantId)
        }));
    };

    // ---- Handlers variant mới ----
    const handleNewVariantChange = (tempId, field, value) => {
        setNewVariants(prev =>
            prev.map(v => v._tempId === tempId ? { ...v, [field]: value } : v)
        );
    };

    const addNewVariant = () => setNewVariants(prev => [...prev, newVariantTemplate()]);

    const removeNewVariant = (tempId) => {
        setNewVariants(prev => prev.filter(v => v._tempId !== tempId));
    };

    // ---- Handlers ảnh ----
    const handleImageChange = (colorId, file) => {
        if (!file) return;
        setImageFiles(prev => ({ ...prev, [colorId]: file }));
        const reader = new FileReader();
        reader.onload = e => setImagePreviews(prev => ({ ...prev, [colorId]: e.target.result }));
        reader.readAsDataURL(file);
    };

    // Đánh dấu xóa ảnh (chưa thật sự xóa, chờ submit)
    const handleDeleteImage = (imageId, colorId) => {
        if (!window.confirm("Xóa ảnh này?")) return;
        setDeleteImageIds(prev => [...prev, imageId]);
        // Xóa preview nếu có
        setImageFiles(prev => { const n = { ...prev }; delete n[colorId]; return n; });
        setImagePreviews(prev => { const n = { ...prev }; delete n[colorId]; return n; });
    };

    // ---- Submit ----
    const handleSubmit = async () => {
        for (const v of newVariants) {
            if (!v.color || !v.size || !v.price) {
                alert("Vui lòng điền đầy đủ Màu, Size, Giá cho biến thể mới!");
                return;
            }
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", product.name);
            formData.append("category", product.category);

            const allVariants = [
                ...product.variants.map(v => ({
                    id: v.id,
                    color: v.color,
                    size: v.size,
                    price: v.price,
                    stock_quantity: v.stock_quantity,
                })),
                ...newVariants.map(v => ({
                    color: v.color,
                    size: v.size,
                    price: v.price,
                    stock_quantity: v.stock_quantity || 0,
                })),
            ];
            formData.append("variants", JSON.stringify(allVariants));

            // Gửi danh sách image IDs cần xóa
            formData.append("delete_image_ids", JSON.stringify(deleteImageIds));

            // Gửi ảnh mới
            const imagesInfo = [];
            Object.entries(imageFiles).forEach(([colorId, file]) => {
                const fileKey = `image_color_${colorId}`;
                formData.append(fileKey, file);
                imagesInfo.push({ color: colorId, file_key: fileKey, is_primary: false });
            });
            formData.append("images", JSON.stringify(imagesInfo));

            await api.put(`/products/${slug}/`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Cập nhật thành công!");
            const res = await api.get(`/products/${slug}/`);
            setProduct(res.data);
            setNewVariants([]);
            setImageFiles({});
            setImagePreviews({});
            setDeleteImageIds([]);
        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        } finally {
            setSaving(false);
        }
    };

    const fieldBlock = (label, children) => (
        <div>
            <label style={{ fontSize: 12, color: "#666" }}>{label}</label>
            <div style={{ marginTop: 4 }}>{children}</div>
        </div>
    );

    const variantRowStyle = (isNew = false) => ({
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
        gap: 10,
        alignItems: "end",
        marginBottom: 10,
        padding: 14,
        border: isNew ? "1px dashed #4f46e5" : "1px solid #ddd",
        background: isNew ? "#f9f8ff" : "#fff",
        borderRadius: 8,
    });

    const btnDelete = (onClick) => (
        <button onClick={onClick} title="Xóa" style={{
            padding: "6px 10px", background: "#fee2e2", color: "#dc2626",
            border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 18, lineHeight: 1, alignSelf: "end"
        }}>✕</button>
    );

    return (
        <div className="container-homeadmin">
            <Headeradmin />
            <div className="content" style={{ display: "flex", height: "calc(100vh - 100px)", overflow: "hidden" }}>
                <NavAdmin />
                <div className="main" style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                    {loading ? <h1>Loading...</h1> : !product ? <h2>Không tìm thấy sản phẩm.</h2> : (
                        <div className="edit-product" style={{ maxWidth: 900 }}>
                            <h2 style={{ marginBottom: 24 }}>Chỉnh sửa sản phẩm</h2>

                            {/* Tên */}
                            <div style={{ marginBottom: 16 }}>
                                <label>Tên sản phẩm</label>
                                <input type="text" value={product.name}
                                    onChange={e => setProduct({ ...product, name: e.target.value })}
                                    style={{ display: "block", width: "100%", marginTop: 4 }} />
                            </div>

                            {/* Danh mục */}
                            <div style={{ marginBottom: 28 }}>
                                <label>Danh mục</label>
                                <select value={product.category || ""}
                                    onChange={e => setProduct({ ...product, category: Number(e.target.value) })}
                                    style={{ display: "block", marginTop: 4 }}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ===== VARIANTS CŨ ===== */}
                            <h3 style={{ marginBottom: 12 }}>Biến thể hiện tại</h3>
                            {product.variants?.length === 0 && (
                                <p style={{ color: "#aaa", fontStyle: "italic", marginBottom: 12 }}>
                                    Chưa có biến thể nào.
                                </p>
                            )}
                            {product.variants?.map(variant => (
                                <div key={variant.id} style={variantRowStyle(false)}>
                                    {fieldBlock("Size",
                                        <select value={variant.size}
                                            onChange={e => handleVariantChange(variant.id, "size", Number(e.target.value))}
                                            style={{ width: "100%" }}>
                                            {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    )}
                                    {fieldBlock("Màu sắc",
                                        <select value={variant.color}
                                            onChange={e => handleVariantChange(variant.id, "color", Number(e.target.value))}
                                            style={{ width: "100%" }}>
                                            {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                    {fieldBlock("Giá",
                                        <input type="number" value={variant.price}
                                            onChange={e => handleVariantChange(variant.id, "price", e.target.value)}
                                            style={{ width: "100%" }} />
                                    )}
                                    {fieldBlock("Tồn kho",
                                        <input type="number" value={variant.stock_quantity}
                                            onChange={e => handleVariantChange(variant.id, "stock_quantity", Number(e.target.value))}
                                            style={{ width: "100%" }} />
                                    )}
                                    {btnDelete(() => handleDeleteVariant(variant.id))}
                                </div>
                            ))}

                            {/* ===== VARIANTS MỚI ===== */}
                            {newVariants.length > 0 && (
                                <>
                                    <h3 style={{ marginTop: 24, marginBottom: 12, color: "#4f46e5" }}>
                                        Biến thể mới
                                    </h3>
                                    {newVariants.map(v => (
                                        <div key={v._tempId} style={variantRowStyle(true)}>
                                            {fieldBlock("Size",
                                                <select value={v.size}
                                                    onChange={e => handleNewVariantChange(v._tempId, "size", e.target.value)}
                                                    style={{ width: "100%" }}>
                                                    <option value="">-- Size --</option>
                                                    {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            )}
                                            {fieldBlock("Màu sắc",
                                                <select value={v.color}
                                                    onChange={e => handleNewVariantChange(v._tempId, "color", e.target.value)}
                                                    style={{ width: "100%" }}>
                                                    <option value="">-- Màu --</option>
                                                    {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            )}
                                            {fieldBlock("Giá",
                                                <input type="number" placeholder="0" value={v.price}
                                                    onChange={e => handleNewVariantChange(v._tempId, "price", e.target.value)}
                                                    style={{ width: "100%" }} />
                                            )}
                                            {fieldBlock("Tồn kho",
                                                <input type="number" placeholder="0" value={v.stock_quantity}
                                                    onChange={e => handleNewVariantChange(v._tempId, "stock_quantity", e.target.value)}
                                                    style={{ width: "100%" }} />
                                            )}
                                            {btnDelete(() => removeNewVariant(v._tempId))}
                                        </div>
                                    ))}
                                </>
                            )}

                            <button onClick={addNewVariant} style={{
                                marginTop: 8, padding: "8px 18px",
                                background: "#ede9fe", color: "#4f46e5",
                                border: "1px dashed #4f46e5", borderRadius: 6,
                                cursor: "pointer", fontSize: 14
                            }}>
                                + Thêm biến thể mới
                            </button>

                            {/* ===== ẢNH THEO MÀU ===== */}
                            {allUniqueColors.length > 0 && (
                                <>
                                    <h3 style={{ marginTop: 28, marginBottom: 12 }}>Ảnh sản phẩm theo màu</h3>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                                        {allUniqueColors.map(({ colorId, colorName }) => {
                                            const existing = imageMapByColor[colorId];
                                            const preview = imagePreviews[colorId];
                                            const isNew = !product?.images?.find(img => img.color === colorId);
                                            return (
                                                <div key={colorId} style={{
                                                    border: isNew ? "1px dashed #4f46e5" : "1px solid #ddd",
                                                    borderRadius: 8, padding: 12, minWidth: 150,
                                                    textAlign: "center",
                                                    background: isNew ? "#f9f8ff" : "#fff"
                                                }}>
                                                    <p style={{ margin: "0 0 8px", fontWeight: 500, fontSize: 13 }}>
                                                        {colorName}
                                                        {isNew && (
                                                            <span style={{
                                                                marginLeft: 6, fontSize: 10,
                                                                background: "#ede9fe", color: "#4f46e5",
                                                                padding: "2px 6px", borderRadius: 4
                                                            }}>Mới</span>
                                                        )}
                                                    </p>

                                                    {/* Ảnh hiện tại hoặc preview */}
                                                    {(preview || existing?.url) ? (
                                                        <div style={{ position: "relative", display: "inline-block" }}>
                                                            <img
                                                                src={preview || existing?.url}
                                                                alt={colorName}
                                                                style={{
                                                                    width: 80, height: 80, objectFit: "cover",
                                                                    borderRadius: 6, border: "1px solid #eee",
                                                                    display: "block", margin: "0 auto 4px"
                                                                }}
                                                            />
                                                            {/* Nút xóa ảnh — chỉ hiện nếu ảnh đã lưu trong DB */}
                                                            {existing?.id && !preview && (
                                                                <button
                                                                    onClick={() => handleDeleteImage(existing.id, colorId)}
                                                                    title="Xóa ảnh"
                                                                    style={{
                                                                        position: "absolute", top: -6, right: -6,
                                                                        width: 20, height: 20, borderRadius: "50%",
                                                                        background: "#dc2626", color: "#fff",
                                                                        border: "none", cursor: "pointer",
                                                                        fontSize: 11, lineHeight: "20px",
                                                                        display: "flex", alignItems: "center",
                                                                        justifyContent: "center", padding: 0
                                                                    }}>
                                                                    ✕
                                                                </button>
                                                            )}
                                                            {/* Nút hủy preview mới */}
                                                            {preview && (
                                                                <button
                                                                    onClick={() => {
                                                                        setImageFiles(prev => { const n = { ...prev }; delete n[colorId]; return n; });
                                                                        setImagePreviews(prev => { const n = { ...prev }; delete n[colorId]; return n; });
                                                                    }}
                                                                    title="Hủy ảnh mới"
                                                                    style={{
                                                                        position: "absolute", top: -6, right: -6,
                                                                        width: 20, height: 20, borderRadius: "50%",
                                                                        background: "#f59e0b", color: "#fff",
                                                                        border: "none", cursor: "pointer",
                                                                        fontSize: 11, lineHeight: "20px",
                                                                        display: "flex", alignItems: "center",
                                                                        justifyContent: "center", padding: 0
                                                                    }}>
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            width: 80, height: 80, borderRadius: 6,
                                                            background: "#f3f4f6", display: "flex",
                                                            alignItems: "center", justifyContent: "center",
                                                            margin: "0 auto 8px", fontSize: 24, color: "#ccc"
                                                        }}>📷</div>
                                                    )}

                                                    {preview && (
                                                        <p style={{ fontSize: 11, color: "#f59e0b", margin: "4px 0" }}>
                                                            Chưa lưu
                                                        </p>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ fontSize: 11, width: "100%", marginTop: 6 }}
                                                        onChange={e => handleImageChange(colorId, e.target.files[0])}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: 8 }}>
                                <button onClick={handleSubmit} disabled={saving} style={{
                                    padding: "10px 32px",
                                    background: saving ? "#aaa" : "#4f46e5",
                                    color: "#fff", border: "none", borderRadius: 6,
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontSize: 15, fontWeight: 500
                                }}>
                                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditProduct;