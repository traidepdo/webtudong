// pages/admin/CreateProduct.jsx
import { useState, useEffect, useRef } from "react";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "../../App.css";

export default function CreateProduct() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [brands, setBrands] = useState([]);

    const [form, setForm] = useState({
        name: "", category: "", description: "",
        brand: "", meta_title: "", meta_description: "",
    });

    const [variants, setVariants] = useState([]);
    const [variantForm, setVariantForm] = useState({ color: "", size: "", price: "", stock_quantity: "", sku: "" });
    const [variantError, setVariantError] = useState("");

    const [images, setImages] = useState([]);
    const fileRef = useRef();

    // ── Load lookup data ─────────────────────────────────────
    useEffect(() => {
        api.get("/categories/").then(r => setCategories(r.data?.results ?? r.data ?? [])).catch(() => { });
        api.get("/colors/").then(r => setColors(r.data?.results ?? r.data ?? [])).catch(() => { });
        api.get("/sizes/").then(r => setSizes(r.data?.results ?? r.data ?? [])).catch(() => { });
        api.get("/brands/").then(r => setBrands(r.data?.results ?? r.data ?? [])).catch(() => { });
    }, []);

    // ── Form helpers ─────────────────────────────────────────
    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // ── Variant helpers ──────────────────────────────────────
    const addVariant = () => {
        const { color, size, price, stock_quantity } = variantForm;
        if (!color || !size || !price) {
            setVariantError("Vui lòng chọn màu, size và nhập giá.");
            return;
        }
        const dup = variants.find(v => v.color === color && v.size === size);
        if (dup) { setVariantError("Biến thể màu + size này đã tồn tại."); return; }
        setVariants(vs => [...vs, { ...variantForm, _id: Date.now() }]);
        setVariantForm({ color: "", size: "", price: "", stock_quantity: "", sku: "" });
        setVariantError("");
    };

    const removeVariant = (_id) => setVariants(vs => vs.filter(v => v._id !== _id));

    const colorName = (id) => colors.find(c => String(c.id) === String(id))?.name ?? id;
    const sizeName = (id) => sizes.find(s => String(s.id) === String(id))?.name ?? id;

    // ── Image helpers ────────────────────────────────────────
    const handleFiles = (files) => {
        const newImgs = Array.from(files).map(file => ({
            _id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file),
            color: "",
            is_primary: false,
        }));
        setImages(imgs => [...imgs, ...newImgs]);
    };

    const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
    const removeImage = (_id) => setImages(imgs => imgs.filter(i => i._id !== _id));
    const updateImage = (_id, key, val) => setImages(imgs => imgs.map(i => i._id === _id ? { ...i, [key]: val } : i));

    // ── Validation ───────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Tên sản phẩm không được để trống";
        if (!form.category) e.category = "Vui lòng chọn danh mục";
        if (form.meta_title.length > 70) e.meta_title = "Tối đa 70 ký tự";
        if (form.meta_description.length > 160) e.meta_description = "Tối đa 160 ký tự";
        return e;
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); setStep(1); return; }

        setSaving(true);
        try {
            const fd = new FormData();

            // Basic product fields
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));

            // Variants — serializer expects JSON string
            fd.append("variants", JSON.stringify(
                variants.map(v => ({
                    color: v.color,
                    size: v.size,
                    price: v.price,
                    stock_quantity: v.stock_quantity || 0,
                    sku: v.sku || "",
                }))
            ));

            // Images meta — serializer expects JSON string + files list
            fd.append("images", JSON.stringify(
                images.map(img => ({
                    color: img.color || null,
                    is_primary: img.is_primary,
                }))
            ));
            images.forEach(img => fd.append("uploaded_images", img.file));

            await api.post("/products/", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            navigate("/admin/products", {
                state: { toast: "Tạo sản phẩm thành công!" }
            });
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") {
                setErrors(data);
            } else {
                setErrors({ general: "Lỗi kết nối máy chủ. Vui lòng thử lại." });
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Step config ──────────────────────────────────────────
    const steps = [
        { n: 1, label: "Thông tin cơ bản" },
        { n: 2, label: "Biến thể" },
        { n: 3, label: "Hình ảnh" },
        { n: 4, label: "SEO" },
    ];

    return (
        <div className="container-homeadmin">
            <Headeradmin />

            <div className="content" style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>
                <NavAdmin />

                <div className="main" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

                    {/* ── Page header ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                        <button
                            onClick={() => navigate("/admin/products")}
                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 14, color: "#374151" }}
                        >
                            ← Quay lại
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111" }}>Tạo sản phẩm mới</h2>
                        </div>
                    </div>

                    {/* ── Step tabs ── */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#f9fafb", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb" }}>
                        {steps.map(s => (
                            <button
                                key={s.n}
                                onClick={() => setStep(s.n)}
                                style={{
                                    flex: 1, padding: "9px 12px", border: "none", borderRadius: 7,
                                    cursor: "pointer", fontSize: 13, fontWeight: step === s.n ? 600 : 400,
                                    background: step === s.n ? "#fff" : "transparent",
                                    color: step === s.n ? "#4f46e5" : "#6b7280",
                                    boxShadow: step === s.n ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                                    transition: "all .2s"
                                }}
                            >
                                <span style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: 20, height: 20, borderRadius: "50%", marginRight: 6, fontSize: 11,
                                    background: step === s.n ? "#4f46e5" : "#e5e7eb",
                                    color: step === s.n ? "#fff" : "#9ca3af", fontWeight: 700
                                }}>{s.n}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: "100%", margin: "0 auto" }}>

                        {/* ──────────────── STEP 1: Basic info ──────────────── */}
                        {step === 1 && (
                            <Card title="📝 Thông tin cơ bản">
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    <Field label="Tên sản phẩm *" error={errors.name}>
                                        <input
                                            value={form.name}
                                            onChange={e => setField("name", e.target.value)}
                                            placeholder="VD: Áo Thun Basic Unisex"
                                            style={inputStyle(!!errors.name)}
                                        />
                                    </Field>

                                    <Field label="Danh mục *" error={errors.category}>
                                        <select
                                            value={form.category}
                                            onChange={e => setField("category", e.target.value)}
                                            style={inputStyle(!!errors.category)}
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Thương hiệu">
                                        <select
                                            value={form.brand}
                                            onChange={e => setField("brand", e.target.value)}
                                            style={inputStyle()}
                                        >
                                            <option value="">-- Chọn thương hiệu --</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Mô tả">
                                        <textarea
                                            value={form.description}
                                            onChange={e => setField("description", e.target.value)}
                                            placeholder="Mô tả chi tiết sản phẩm..."
                                            rows={5}
                                            style={{ ...inputStyle(), resize: "vertical", fontFamily: "inherit" }}
                                        />
                                    </Field>
                                </div>
                            </Card>
                        )}

                        {/* ──────────────── STEP 2: Variants ──────────────── */}
                        {step === 2 && (
                            <Card title="🎨 Biến thể sản phẩm">
                                {/* Add form */}
                                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "16px", marginBottom: 20, border: "1px solid #e5e7eb" }}>
                                    <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Thêm biến thể</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                                        <div>
                                            <label style={labelStyle}>Màu sắc *</label>
                                            <select value={variantForm.color} onChange={e => setVariantForm(f => ({ ...f, color: e.target.value }))} style={inputStyle()}>
                                                <option value="">-- Chọn màu --</option>
                                                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Size *</label>
                                            <select value={variantForm.size} onChange={e => setVariantForm(f => ({ ...f, size: e.target.value }))} style={inputStyle()}>
                                                <option value="">-- Chọn size --</option>
                                                {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Giá (VNĐ) *</label>
                                            <input
                                                type="number" min="0"
                                                value={variantForm.price}
                                                onChange={e => setVariantForm(f => ({ ...f, price: e.target.value }))}
                                                placeholder="199000"
                                                style={inputStyle()}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Tồn kho</label>
                                            <input
                                                type="number" min="0"
                                                value={variantForm.stock_quantity}
                                                onChange={e => setVariantForm(f => ({ ...f, stock_quantity: e.target.value }))}
                                                placeholder="0"
                                                style={inputStyle()}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={labelStyle}>SKU (để trống = tự tạo)</label>
                                        <input
                                            value={variantForm.sku}
                                            onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))}
                                            placeholder="VD: PRD-WHITE-M-001"
                                            style={inputStyle()}
                                        />
                                    </div>
                                    {variantError && (
                                        <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 10px" }}>⚠ {variantError}</p>
                                    )}
                                    <button
                                        onClick={addVariant}
                                        style={{ padding: "9px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                                    >
                                        + Thêm biến thể
                                    </button>
                                </div>

                                {/* Variants table */}
                                {variants.length > 0 ? (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ background: "#f3f4f6" }}>
                                                {["Màu", "Size", "SKU", "Giá", "Tồn kho", ""].map(h => (
                                                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((v, i) => (
                                                <tr key={v._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                                    <td style={{ padding: "10px 12px" }}>{colorName(v.color)}</td>
                                                    <td style={{ padding: "10px 12px" }}>{sizeName(v.size)}</td>
                                                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{v.sku || <span style={{ color: "#9ca3af" }}>Tự tạo</span>}</td>
                                                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{Number(v.price).toLocaleString("vi-VN")}₫</td>
                                                    <td style={{ padding: "10px 12px" }}>{v.stock_quantity || 0}</td>
                                                    <td style={{ padding: "10px 12px" }}>
                                                        <button
                                                            onClick={() => removeVariant(v._id)}
                                                            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                        <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
                                        <p style={{ fontSize: 14 }}>Chưa có biến thể nào. Thêm ít nhất một biến thể.</p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* ──────────────── STEP 3: Images ──────────────── */}
                        {step === 3 && (
                            <Card title="🖼 Hình ảnh sản phẩm">
                                {/* Drop zone */}
                                <div
                                    onDrop={onDrop}
                                    onDragOver={e => e.preventDefault()}
                                    onClick={() => fileRef.current?.click()}
                                    style={{
                                        border: "2px dashed #c7d2fe", borderRadius: 10,
                                        padding: "36px 24px", textAlign: "center",
                                        cursor: "pointer", marginBottom: 20,
                                        background: "#f5f3ff", transition: "background .2s"
                                    }}
                                >
                                    <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#4f46e5" }}>Kéo thả ảnh vào đây</p>
                                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>hoặc bấm để chọn file • PNG, JPG, WEBP — tối đa 5MB mỗi file</p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: "none" }}
                                        onChange={e => handleFiles(e.target.files)}
                                    />
                                </div>

                                {images.length > 0 && (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
                                        {images.map(img => (
                                            <div key={img._id} style={{
                                                border: img.is_primary ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                                                borderRadius: 10, overflow: "hidden", background: "#fff"
                                            }}>
                                                <div style={{ position: "relative", aspectRatio: "1", background: "#f3f4f6" }}>
                                                    <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <button
                                                        onClick={() => removeImage(img._id)}
                                                        style={{
                                                            position: "absolute", top: 6, right: 6,
                                                            background: "rgba(0,0,0,.5)", border: "none",
                                                            borderRadius: "50%", width: 26, height: 26,
                                                            color: "#fff", cursor: "pointer", fontSize: 13,
                                                            display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}
                                                    >✕</button>
                                                    {img.is_primary && (
                                                        <span style={{
                                                            position: "absolute", top: 6, left: 6,
                                                            background: "#4f46e5", color: "#fff",
                                                            fontSize: 11, padding: "2px 8px",
                                                            borderRadius: 999, fontWeight: 600
                                                        }}>Ảnh chính</span>
                                                    )}
                                                </div>
                                                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                                    <select
                                                        value={img.color}
                                                        onChange={e => updateImage(img._id, "color", e.target.value)}
                                                        style={{ ...inputStyle(), fontSize: 13 }}
                                                    >
                                                        <option value="">-- Gắn màu --</option>
                                                        {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", cursor: "pointer" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={img.is_primary}
                                                            onChange={e => updateImage(img._id, "is_primary", e.target.checked)}
                                                        />
                                                        Đặt làm ảnh chính
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* ──────────────── STEP 4: SEO ──────────────── */}
                        {step === 4 && (
                            <Card title="🌐 Thông tin SEO (tùy chọn)">
                                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>
                                    Để trống — hệ thống sẽ tự dùng tên sản phẩm làm fallback.
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                    <Field label="Meta Title" error={errors.meta_title}>
                                        <input
                                            value={form.meta_title}
                                            onChange={e => setField("meta_title", e.target.value)}
                                            maxLength={70}
                                            placeholder="Tiêu đề hiển thị trên Google..."
                                            style={inputStyle(!!errors.meta_title)}
                                        />
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                                            <span style={{ fontSize: 12, color: form.meta_title.length > 60 ? "#f59e0b" : "#9ca3af" }}>
                                                {form.meta_title.length}/70
                                            </span>
                                        </div>
                                    </Field>

                                    <Field label="Meta Description" error={errors.meta_description}>
                                        <textarea
                                            value={form.meta_description}
                                            onChange={e => setField("meta_description", e.target.value)}
                                            maxLength={160}
                                            placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..."
                                            rows={3}
                                            style={{ ...inputStyle(!!errors.meta_description), resize: "vertical", fontFamily: "inherit" }}
                                        />
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                                            <span style={{ fontSize: 12, color: form.meta_description.length > 140 ? "#f59e0b" : "#9ca3af" }}>
                                                {form.meta_description.length}/160
                                            </span>
                                        </div>
                                    </Field>

                                    {/* Google preview */}
                                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "16px 18px", border: "1px solid #e5e7eb" }}>
                                        <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                                            Xem trước Google
                                        </p>
                                        <p style={{ color: "#1a0dab", fontSize: 17, margin: "0 0 2px", fontWeight: 500 }}>
                                            {form.meta_title || form.name || "Tên sản phẩm"}
                                        </p>
                                        <p style={{ fontSize: 13, color: "#006621", margin: "0 0 4px" }}>
                                            yourdomain.com/products/...
                                        </p>
                                        <p style={{ fontSize: 14, color: "#545454", margin: 0, lineHeight: 1.5 }}>
                                            {form.meta_description || form.description?.slice(0, 160) || "Mô tả sản phẩm sẽ hiển thị ở đây..."}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* ── General error ── */}
                        {errors.general && (
                            <div style={{
                                background: "#fee2e2", border: "1px solid #fca5a5",
                                borderRadius: 8, padding: "12px 16px",
                                color: "#dc2626", fontSize: 14, marginTop: 12,
                                display: "flex", gap: 8, alignItems: "center"
                            }}>
                                ⚠ {errors.general}
                            </div>
                        )}

                        {/* ── Navigation ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                            <button
                                onClick={() => setStep(s => Math.max(1, s - 1))}
                                style={{
                                    visibility: step === 1 ? "hidden" : "visible",
                                    padding: "10px 20px", border: "1px solid #e5e7eb",
                                    background: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14
                                }}
                            >
                                ← Quay lại
                            </button>

                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    style={{ padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                                >
                                    Tiếp theo →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    style={{
                                        padding: "10px 28px", background: saving ? "#9ca3af" : "#16a34a",
                                        color: "#fff", border: "none", borderRadius: 8,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontSize: 14, fontWeight: 600
                                    }}
                                >
                                    {saving ? "⏳ Đang lưu..." : "✅ Tạo sản phẩm"}
                                </button>
                            )}
                        </div>

                        {/* ── Progress dots ── */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                            {steps.map(s => (
                                <div
                                    key={s.n}
                                    onClick={() => setStep(s.n)}
                                    style={{
                                        width: step === s.n ? 24 : 8, height: 8, borderRadius: 999,
                                        background: step === s.n ? "#4f46e5" : step > s.n ? "#a5b4fc" : "#e5e7eb",
                                        cursor: "pointer", transition: "all .2s"
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────
function Card({ title, children }) {
    return (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 14, marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            {children}
            {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>⚠ {error}</p>}
        </div>
    );
}

// ── Style constants ───────────────────────────────────────────
const labelStyle = {
    display: "block", fontSize: 13,
    color: "#374151", marginBottom: 6, fontWeight: 500
};

const inputStyle = (hasError = false) => ({
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px",
    border: `1px solid ${hasError ? "#f87171" : "#e5e7eb"}`,
    borderRadius: 8, fontSize: 14, outline: "none",
    background: "#fff", color: "#111"
});