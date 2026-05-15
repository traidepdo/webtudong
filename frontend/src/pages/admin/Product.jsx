// pages/admin/Product.jsx
import { useState, useEffect, useMemo } from "react";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "../../App.css";

const PAGE_SIZE = 12;

const fmt = (n) =>
    n != null
        ? Number(n).toLocaleString("vi-VN") + "₫"
        : "—";

const COLOR_HEX = {
    Trắng: "#f5f5f5", Đen: "#1a1a1a", "Xanh Navy": "#1e3a5f",
    Đỏ: "#e53e3e", "Xanh Lá": "#38a169", Vàng: "#d69e2e",
};

export default function ProductsAdmin() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null); // { msg, type }

    // ── Fetch ───────────────────────────────────────────────
    const fetchProducts = () => {
        setLoading(true);
        api.get("/products/")
            .then(r => setProducts(r.data?.results ?? r.data ?? []))
            .catch(() => setError("Không thể tải danh sách sản phẩm."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProducts();
        api.get("/categories/")
            .then(r => setCategories(r.data?.results ?? r.data ?? []))
            .catch(() => { });
    }, []);

    // ── Toast helper ────────────────────────────────────────
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Delete ──────────────────────────────────────────────
    const handleDelete = () => {
        if (!deleteId) return;
        setDeleting(true);
        api.delete(`/products/${deleteId}/`)
            .then(() => {
                showToast("Đã xóa sản phẩm.");
                setDeleteId(null);
                fetchProducts();
            })
            .catch(() => showToast("Xóa thất bại!", "error"))
            .finally(() => setDeleting(false));
    };

    // ── Filter + Paginate ───────────────────────────────────
    const filtered = useMemo(() => {
        return products.filter(p => {
            const q = search.toLowerCase();
            const matchSearch =
                p.name.toLowerCase().includes(q) ||
                (p.slug || "").toLowerCase().includes(q);
            const matchCat = filterCategory
                ? String(p.category) === filterCategory
                : true;
            return matchSearch && matchCat;
        });
    }, [products, search, filterCategory]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ── Helpers ─────────────────────────────────────────────
    const totalStock = (p) =>
        (p.variants || []).reduce((s, v) => s + (v.stock_quantity ?? 0), 0);

    const priceRange = (p) => {
        const prices = (p.variants || []).map(v => Number(v.price)).filter(Boolean);
        if (!prices.length) return "—";
        const mn = Math.min(...prices);
        const mx = Math.max(...prices);
        return mn === mx ? fmt(mn) : `${fmt(mn)} – ${fmt(mx)}`;
    };

    return (
        <div className="container-homeadmin">
            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: "fixed", top: 20, right: 20, zIndex: 9999,
                    padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                    background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
                    color: toast.type === "error" ? "#dc2626" : "#16a34a",
                    border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,.1)"
                }}>
                    {toast.type === "error" ? "❌ " : "✅ "}{toast.msg}
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteId && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 12, padding: "28px 32px",
                        maxWidth: 380, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,.18)"
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⚠️</div>
                        <p style={{ fontWeight: 700, fontSize: 16, textAlign: "center", margin: "0 0 8px" }}>Xác nhận xóa sản phẩm</p>
                        <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
                            Toàn bộ biến thể và ảnh sẽ bị xóa vĩnh viễn. Không thể hoàn tác.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 14, opacity: deleting ? 0.7 : 1 }}
                            >
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Headeradmin />

            <div className="content" style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>
                <NavAdmin />

                <div className="main" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

                    {/* ── Header ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>Quản lý sản phẩm</h2>
                            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                                Tổng: <b>{products.length}</b> sản phẩm
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/admin/products/create")}
                            style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "10px 18px", background: "#4f46e5", color: "#fff",
                                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            ＋ Thêm sản phẩm
                        </button>
                    </div>

                    {/* ── Filters ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="🔍 Tìm tên, slug sản phẩm..."
                            style={{
                                flex: 1, minWidth: 220, padding: "9px 14px",
                                border: "1px solid #e2e8f0", borderRadius: 8,
                                fontSize: 14, outline: "none"
                            }}
                        />
                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
                            style={{
                                padding: "9px 12px", border: "1px solid #e2e8f0",
                                borderRadius: 8, fontSize: 14, minWidth: 180,
                                background: "#f9fafb"
                            }}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(c => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Content ── */}
                    {error ? (
                        <div style={{ textAlign: "center", padding: 60, color: "#dc2626" }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
                            <p>{error}</p>
                            <button onClick={fetchProducts} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }}>
                                Thử lại
                            </button>
                        </div>
                    ) : loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            {filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 64, color: "#9ca3af" }}>
                                    <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                                    <p style={{ fontSize: 15 }}>Không tìm thấy sản phẩm nào</p>
                                </div>
                            ) : (
                                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                                                {["Sản phẩm", "Danh mục", "Giá", "Tồn kho", "Biến thể", "Thao tác"].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map((p, idx) => {
                                                const stock = totalStock(p);
                                                const colors = [...new Set((p.variants || []).map(v => v.color_name).filter(Boolean))];
                                                const primaryImg = (p.images || []).find(i => i.is_primary) ?? (p.images || [])[0];

                                                return (
                                                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                                                        {/* Product cell */}
                                                        <td style={tdStyle}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                                <div style={{
                                                                    width: 48, height: 48, borderRadius: 8,
                                                                    background: "#f3f4f6", flexShrink: 0,
                                                                    overflow: "hidden", display: "flex",
                                                                    alignItems: "center", justifyContent: "center"
                                                                }}>
                                                                    {primaryImg?.image
                                                                        ? <img src={primaryImg.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                        : <span style={{ fontSize: 22 }}>📷</span>}
                                                                </div>
                                                                <div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111" }}>{p.name}</p>
                                                                        {p.brand && (
                                                                            <span style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "1px 6px", borderRadius: 4, border: "1px solid #e5e7eb" }}>
                                                                                {p.brand}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{p.slug}</p>
                                                                    {colors.length > 0 && (
                                                                        <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                                                                            {colors.slice(0, 5).map(c => (
                                                                                <span key={c} title={c} style={{
                                                                                    width: 14, height: 14, borderRadius: "50%",
                                                                                    background: COLOR_HEX[c] ?? "#ccc",
                                                                                    border: "1px solid #d1d5db", display: "inline-block"
                                                                                }} />
                                                                            ))}
                                                                            {colors.length > 5 && <span style={{ fontSize: 11, color: "#9ca3af" }}>+{colors.length - 5}</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Category */}
                                                        <td style={tdStyle}>
                                                            <span style={{ fontSize: 13, padding: "3px 10px", background: "#f3f4f6", borderRadius: 20, color: "#374151" }}>
                                                                {p.category_name || "—"}
                                                            </span>
                                                        </td>

                                                        {/* Price */}
                                                        <td style={{ ...tdStyle, fontWeight: 600, color: "#111", fontSize: 13 }}>
                                                            {priceRange(p)}
                                                        </td>

                                                        {/* Stock */}
                                                        <td style={tdStyle}>
                                                            <span style={{
                                                                fontSize: 13, padding: "3px 10px", borderRadius: 20,
                                                                background: stock > 0 ? "#dcfce7" : "#fee2e2",
                                                                color: stock > 0 ? "#16a34a" : "#dc2626"
                                                            }}>
                                                                {stock > 0 ? `${stock.toLocaleString("vi-VN")} cái` : "Hết hàng"}
                                                            </span>
                                                        </td>

                                                        {/* Variants count */}
                                                        <td style={{ ...tdStyle, fontSize: 13, color: "#6b7280" }}>
                                                            {(p.variants || []).length} biến thể
                                                        </td>

                                                        {/* Actions */}
                                                        <td style={tdStyle}>
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <button
                                                                    onClick={() => navigate(`/${p.category_slug}/${p.slug}`)}
                                                                    title="Xem chi tiết"
                                                                    style={btnStyle("#ede9fe", "#4f46e5")}
                                                                >
                                                                    👁 Xem
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/admin/products/${p.slug}/edit`)}
                                                                    title="Chỉnh sửa"
                                                                    style={btnStyle("#fef9c3", "#92400e")}
                                                                >
                                                                    ✏️ Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteId(p.slug)}
                                                                    title="Xóa sản phẩm"
                                                                    style={btnStyle("#fee2e2", "#dc2626")}
                                                                >
                                                                    🗑 Xóa
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ── Pagination ── */}
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
                                    <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                                        Hiển thị {paginated.length} / {filtered.length} sản phẩm
                                    </p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            style={pageBtn(page !== 1)}
                                        >
                                            ‹ Trước
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                style={{ ...pageBtn(true), background: page === n ? "#4f46e5" : "#fff", color: page === n ? "#fff" : "#374151" }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            style={pageBtn(page !== totalPages)}
                                        >
                                            Sau ›
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                    height: 64, borderRadius: 8,
                    background: `linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)`,
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.5s infinite ${i * 0.08}s`
                }} />
            ))}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
    );
}

// ── Style helpers ─────────────────────────────────────────────
const thStyle = {
    padding: "13px 16px", textAlign: "left",
    fontSize: 13, fontWeight: 600, color: "#374151"
};
const tdStyle = {
    padding: "13px 16px", fontSize: 14,
    color: "#111", verticalAlign: "middle"
};
const btnStyle = (bg, color) => ({
    padding: "5px 11px", borderRadius: 6, border: "none",
    background: bg, color, cursor: "pointer",
    fontSize: 12, fontWeight: 500
});
const pageBtn = (active) => ({
    padding: "6px 12px", borderRadius: 6,
    border: "1px solid #e5e7eb",
    background: "#fff", color: "#374151",
    cursor: active ? "pointer" : "not-allowed",
    opacity: active ? 1 : 0.4, fontSize: 13
});