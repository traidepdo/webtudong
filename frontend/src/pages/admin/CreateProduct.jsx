import { useState, useEffect } from "react";
import api from "../../api";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import "../../App.css";

const newSizeTemplate = () => ({
    _tempId: Date.now() + Math.random(),
    sizeId: "",
    price: "",
    stock: "",
});

const newColorGroupTemplate = () => ({
    _tempId: Date.now() + Math.random(),
    colorId: "",
    sizes: [newSizeTemplate()],
});

function CreateProduct() {
    const [name, setName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [saving, setSaving] = useState(false);

    // Nhóm theo màu
    const [colorGroups, setColorGroups] = useState([newColorGroupTemplate()]);
    // primaryGroupTempId: _tempId của nhóm màu được chọn làm ảnh chính
    const [primaryGroupTempId, setPrimaryGroupTempId] = useState(null);
    // imageFiles[groupTempId] = File, imagePreviews[groupTempId] = base64
    const [imageFiles, setImageFiles] = useState({});
    const [imagePreviews, setImagePreviews] = useState({});

    useEffect(() => {
        Promise.all([api.get("/colors/"), api.get("/sizes/"), api.get("/categories/")])
            .then(([c, s, cat]) => {
                setColors(c.data);
                setSizes(s.data);
                setCategories(cat.data);
            })
            .catch(err => console.error(err));
    }, []);

    // Auto set primary khi thêm nhóm đầu tiên
    useEffect(() => {
        if (colorGroups.length > 0 && !primaryGroupTempId) {
            setPrimaryGroupTempId(colorGroups[0]._tempId);
        }
    }, [colorGroups]);

    // ===== ColorGroup handlers =====
    const addColorGroup = () => {
        const g = newColorGroupTemplate();
        setColorGroups(prev => [...prev, g]);
    };

    const removeColorGroup = (tempId) => {
        if (colorGroups.length === 1) {
            alert("Phải có ít nhất 1 màu!");
            return;
        }
        setColorGroups(prev => {
            const updated = prev.filter(g => g._tempId !== tempId);
            if (primaryGroupTempId === tempId) {
                setPrimaryGroupTempId(updated[0]._tempId);
            }
            return updated;
        });
        setImageFiles(prev => { const n = { ...prev }; delete n[tempId]; return n; });
        setImagePreviews(prev => { const n = { ...prev }; delete n[tempId]; return n; });
    };

    const handleColorChange = (groupTempId, colorId) => {
        setColorGroups(prev =>
            prev.map(g => g._tempId === groupTempId ? { ...g, colorId } : g)
        );
    };

    // ===== Size handlers =====
    const addSizeToGroup = (groupTempId) => {
        setColorGroups(prev =>
            prev.map(g => g._tempId === groupTempId
                ? { ...g, sizes: [...g.sizes, newSizeTemplate()] }
                : g
            )
        );
    };

    const removeSizeFromGroup = (groupTempId, sizeTempId) => {
        setColorGroups(prev =>
            prev.map(g => {
                if (g._tempId !== groupTempId) return g;
                if (g.sizes.length === 1) return g; // tối thiểu 1 size
                return { ...g, sizes: g.sizes.filter(s => s._tempId !== sizeTempId) };
            })
        );
    };

    const handleSizeChange = (groupTempId, sizeTempId, field, value) => {
        setColorGroups(prev =>
            prev.map(g => g._tempId !== groupTempId ? g : {
                ...g,
                sizes: g.sizes.map(s =>
                    s._tempId === sizeTempId ? { ...s, [field]: value } : s
                )
            })
        );
    };

    // ===== Image handlers =====
    const handleImageChange = (groupTempId, file) => {
        if (!file) return;
        setImageFiles(prev => ({ ...prev, [groupTempId]: file }));
        const reader = new FileReader();
        reader.onload = e => setImagePreviews(prev => ({ ...prev, [groupTempId]: e.target.result }));
        reader.readAsDataURL(file);
    };

    const removeImagePreview = (groupTempId) => {
        setImageFiles(prev => { const n = { ...prev }; delete n[groupTempId]; return n; });
        setImagePreviews(prev => { const n = { ...prev }; delete n[groupTempId]; return n; });
    };

    // ===== Validate =====
    const validate = () => {
        if (!name.trim()) { alert("Vui lòng nhập tên sản phẩm!"); return false; }
        if (!selectedCategory) { alert("Vui lòng chọn danh mục!"); return false; }
        for (const g of colorGroups) {
            if (!g.colorId) { alert("Vui lòng chọn màu cho tất cả nhóm!"); return false; }
            for (const s of g.sizes) {
                if (!s.sizeId || !s.price) {
                    alert("Vui lòng điền đầy đủ Size và Giá!"); return false;
                }
            }
        }
        return true;
    };

    // ===== Submit =====
    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("category", selectedCategory);
            formData.append("description", description.trim());

            // Flatten colorGroups → variants[]
            const variantsPayload = [];
            colorGroups.forEach(g => {
                g.sizes.forEach(s => {
                    variantsPayload.push({
                        color: g.colorId,
                        size: s.sizeId,
                        price: s.price,
                        stock_quantity: s.stock || 0,
                    });
                });
            });
            formData.append("variants", JSON.stringify(variantsPayload));

            // Ảnh — thứ tự file phải khớp với imagesInfo (backend dùng zip)
            const imagesInfo = [];
            colorGroups.forEach(g => {
                const file = imageFiles[g._tempId];
                if (!file) return;
                formData.append("uploaded_images", file);
                imagesInfo.push({
                    color: g.colorId,
                    is_primary: g._tempId === primaryGroupTempId,
                });
            });
            formData.append("images", JSON.stringify(imagesInfo));

            await api.post("/products/", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Tạo sản phẩm thành công!");
            setName(""); setSelectedCategory(""); setDescription("");
            const first = newColorGroupTemplate();
            setColorGroups([first]);
            setPrimaryGroupTempId(first._tempId);
            setImageFiles({}); setImagePreviews({});
        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-homeadmin">
            <Headeradmin />
            <div className="content" style={{ display: "flex", height: "calc(100vh - 100px)", overflow: "hidden" }}>
                <NavAdmin />
                <main className="main" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                    <div style={{ maxWidth: 860 }}>
                        <h2 style={{ marginBottom: 24 }}>Tạo sản phẩm mới</h2>

                        {/* Tên */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Tên sản phẩm <span style={{ color: "red" }}>*</span></label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Nhập tên sản phẩm"
                                style={{ display: "block", width: "100%", marginTop: 4 }} />
                        </div>

                        {/* Danh mục */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Danh mục <span style={{ color: "red" }}>*</span></label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                                style={{ display: "block", marginTop: 4 }}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Mô tả */}
                        <div style={{ marginBottom: 28 }}>
                            <label>Mô tả</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Nhập mô tả sản phẩm" rows={3}
                                style={{ display: "block", width: "100%", marginTop: 4 }} />
                        </div>

                        {/* ===== NHÓM THEO MÀU ===== */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Biến thể sản phẩm</h3>
                            <button onClick={addColorGroup} style={{
                                padding: "7px 16px", background: "#ede9fe", color: "#4f46e5",
                                border: "1px dashed #4f46e5", borderRadius: 6,
                                cursor: "pointer", fontSize: 13
                            }}>+ Thêm màu</button>
                        </div>

                        {colorGroups.map((group, gIdx) => {
                            const isPrimary = group._tempId === primaryGroupTempId;
                            const preview = imagePreviews[group._tempId];
                            const colorName = colors.find(c => String(c.id) === String(group.colorId))?.name;

                            return (
                                <div key={group._tempId} style={{
                                    border: isPrimary ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                                    borderRadius: 10, padding: 16, marginBottom: 16,
                                    background: isPrimary ? "#faf9ff" : "#fff"
                                }}>
                                    {/* Header nhóm */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                                            Nhóm màu {gIdx + 1}
                                            {colorName && <span style={{ color: "#4f46e5", marginLeft: 6 }}>— {colorName}</span>}
                                            {isPrimary && (
                                                <span style={{
                                                    marginLeft: 8, fontSize: 11,
                                                    background: "#4f46e5", color: "#fff",
                                                    padding: "2px 8px", borderRadius: 4
                                                }}>⭐ Ảnh chính</span>
                                            )}
                                        </span>
                                        <button onClick={() => removeColorGroup(group._tempId)} style={{
                                            padding: "4px 10px", background: "#fee2e2", color: "#dc2626",
                                            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12
                                        }}>✕ Xóa nhóm</button>
                                    </div>

                                    {/* Chọn màu + Upload ảnh */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                                        <div>
                                            <label style={{ fontSize: 12, color: "#555" }}>
                                                Màu sắc <span style={{ color: "red" }}>*</span>
                                            </label>
                                            <select value={group.colorId}
                                                onChange={e => handleColorChange(group._tempId, e.target.value)}
                                                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" }}>
                                                <option value="">-- Chọn màu --</option>
                                                {colors.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: 12, color: "#555" }}>Ảnh đại diện màu</label>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                                                {preview ? (
                                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                                        <img src={preview} alt="" style={{
                                                            width: 52, height: 52, objectFit: "cover",
                                                            borderRadius: 6, border: "1px solid #eee"
                                                        }} />
                                                        <button onClick={() => removeImagePreview(group._tempId)} style={{
                                                            position: "absolute", top: -6, right: -6,
                                                            width: 18, height: 18, borderRadius: "50%",
                                                            background: "#f59e0b", color: "#fff", border: "none",
                                                            cursor: "pointer", fontSize: 10,
                                                            display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: 52, height: 52, borderRadius: 6, flexShrink: 0,
                                                        background: "#f3f4f6", display: "flex",
                                                        alignItems: "center", justifyContent: "center",
                                                        fontSize: 20, color: "#ccc"
                                                    }}>📷</div>
                                                )}
                                                <input type="file" accept="image/*" style={{ fontSize: 12 }}
                                                    onChange={e => handleImageChange(group._tempId, e.target.files[0])} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Radio ảnh chính */}
                                    <label style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        fontSize: 12, cursor: "pointer", marginBottom: 14,
                                        color: isPrimary ? "#4f46e5" : "#666",
                                        fontWeight: isPrimary ? 600 : 400
                                    }}>
                                        <input type="radio" name="primary_image"
                                            checked={isPrimary}
                                            onChange={() => setPrimaryGroupTempId(group._tempId)} />
                                        Đặt làm ảnh chính (thumbnail sản phẩm)
                                    </label>

                                    {/* ===== SIZES ===== */}
                                    <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                                                Kích thước & Giá
                                            </span>
                                            <button onClick={() => addSizeToGroup(group._tempId)} style={{
                                                padding: "4px 12px", background: "#dbeafe", color: "#1d4ed8",
                                                border: "1px dashed #1d4ed8", borderRadius: 6,
                                                cursor: "pointer", fontSize: 12
                                            }}>+ Thêm size</button>
                                        </div>

                                        {/* Header cột */}
                                        <div style={{
                                            display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 32px",
                                            gap: 8, marginBottom: 6, padding: "0 2px"
                                        }}>
                                            {["Size *", "Giá (VNĐ) *", "Tồn kho", ""].map((h, i) => (
                                                <span key={i} style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{h}</span>
                                            ))}
                                        </div>

                                        {group.sizes.map(s => (
                                            <div key={s._tempId} style={{
                                                display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 32px",
                                                gap: 8, marginBottom: 8, alignItems: "center"
                                            }}>
                                                <select value={s.sizeId}
                                                    onChange={e => handleSizeChange(group._tempId, s._tempId, "sizeId", e.target.value)}
                                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", width: "100%" }}>
                                                    <option value="">-- Size --</option>
                                                    {sizes.map(sz => (
                                                        <option key={sz.id} value={sz.id}>{sz.name}</option>
                                                    ))}
                                                </select>
                                                <input type="number" placeholder="VD: 299000" value={s.price}
                                                    onChange={e => handleSizeChange(group._tempId, s._tempId, "price", e.target.value)}
                                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", width: "100%" }} />
                                                <input type="number" placeholder="0" value={s.stock}
                                                    onChange={e => handleSizeChange(group._tempId, s._tempId, "stock", e.target.value)}
                                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", width: "100%" }} />
                                                <button onClick={() => removeSizeFromGroup(group._tempId, s._tempId)}
                                                    disabled={group.sizes.length === 1}
                                                    title={group.sizes.length === 1 ? "Phải có ít nhất 1 size" : "Xóa size này"}
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 6,
                                                        background: group.sizes.length === 1 ? "#f5f5f5" : "#fee2e2",
                                                        color: group.sizes.length === 1 ? "#d1d5db" : "#dc2626",
                                                        border: "none", cursor: group.sizes.length === 1 ? "not-allowed" : "pointer",
                                                        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center"
                                                    }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Nút tạo */}
                        <button onClick={handleSubmit} disabled={saving} style={{
                            marginTop: 8, padding: "10px 32px",
                            background: saving ? "#aaa" : "#4f46e5",
                            color: "#fff", border: "none", borderRadius: 6,
                            cursor: saving ? "not-allowed" : "pointer",
                            fontSize: 15, fontWeight: 500
                        }}>
                            {saving ? "Đang tạo..." : "Tạo sản phẩm"}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CreateProduct;