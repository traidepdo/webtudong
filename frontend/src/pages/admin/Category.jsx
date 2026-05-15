// pages/admin/Category.jsx
import "../../App.css";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import api from "../../api";
import { useState, useEffect, useMemo } from "react";
import {
    useToast, ToastContainer,
    useConfirm,
    Pagination, SearchBar
} from "../../components/admin/UIKit";

const PAGE_SIZE = 10;

function CategoryAdmin() {
    const { toasts, toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [checkEdit, setCheckEdit] = useState(false);
    const [categories, setCategories] = useState([]);
    const [nameCategory, setNameCategory] = useState("");
    const [idCategory, setIdCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const getCategory = () => {
        setLoading(true);
        api.get("categories/")
            .then(res => setCategories(res.data))
            .catch(() => toast.error("Không thể tải danh mục!"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { getCategory(); }, []);

    const filtered = useMemo(() =>
        categories.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase())
        ), [categories, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDelete = (id, name) => {
        confirm(
            `Bạn có chắc muốn xóa danh mục "${name}"?`,
            () => {
                api.delete(`categories/${id}`)
                    .then(() => { toast.success("Xóa danh mục thành công!"); getCategory(); })
                    .catch(() => toast.error("Xóa thất bại!"));
            },
            { title: "Xóa danh mục", danger: true, confirmText: "Xóa", icon: "🗑️" }
        );
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!nameCategory.trim()) { toast.warning("Vui lòng nhập tên danh mục!"); return; }

        const isEdit = !!idCategory;
        try {
            if (isEdit) {
                await api.put(`categories/${idCategory}/`, { name: nameCategory });
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await api.post("categories/", { name: nameCategory });
                toast.success("Thêm danh mục thành công!");
            }
            getCategory();
            setCheckEdit(false);
            setIdCategory("");
            setNameCategory("");
        } catch {
            toast.error(isEdit ? "Cập nhật thất bại!" : "Thêm thất bại!");
        }
    };

    const cancelForm = () => {
        setCheckEdit(false);
        setIdCategory("");
        setNameCategory("");
    };

    return (
        <div className="container-homeadmin">
            <ToastContainer toasts={toasts} />
            <ConfirmDialog />
            <Headeradmin />

            <div className="content">
                <NavAdmin />

                <div className="main" style={{ padding: "24px 28px" }}>
                    {/* ── Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>Danh mục sản phẩm</h2>
                            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                                Tổng: <b>{categories.length}</b> danh mục
                            </p>
                        </div>
                        {!checkEdit && (
                            <button onClick={() => setCheckEdit(true)} style={btnStyle("#4f46e5")}>
                                + Thêm danh mục
                            </button>
                        )}
                    </div>

                    {/* ── Add / Edit Form ── */}
                    {checkEdit && (
                        <div style={{
                            background: "#f8f9ff", border: "1px solid #e0e7ff",
                            borderRadius: 10, padding: 24, marginBottom: 24,
                            boxShadow: "0 2px 8px rgba(79,70,229,0.07)"
                        }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 17, color: "#4f46e5" }}>
                                {idCategory ? "✏️ Chỉnh sửa danh mục" : "➕ Thêm danh mục mới"}
                            </h3>
                            <form onSubmit={handleEdit} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>
                                        Tên danh mục <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nameCategory}
                                        onChange={e => setNameCategory(e.target.value)}
                                        placeholder="VD: Áo thun, Quần jean..."
                                        autoFocus
                                        style={{
                                            width: "100%", padding: "9px 12px", borderRadius: 8,
                                            border: "1px solid #c7d2fe", fontSize: 14,
                                            outline: "none", boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button type="submit" style={btnStyle("#4f46e5")}>
                                        {idCategory ? "Lưu thay đổi" : "Thêm"}
                                    </button>
                                    <button type="button" onClick={cancelForm} style={btnStyle("#6b7280")}>
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            {/* ── Search bar ── */}
                            <div style={{ marginBottom: 16 }}>
                                <SearchBar
                                    value={search}
                                    onChange={v => { setSearch(v); setPage(1); }}
                                    placeholder="Tìm kiếm danh mục..."
                                />
                            </div>

                            {/* ── Table ── */}
                            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                                            <th style={th}>ID</th>
                                            <th style={th}>Tên danh mục</th>
                                            <th style={{ ...th, textAlign: "right" }}>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                                                    Không tìm thấy danh mục nào
                                                </td>
                                            </tr>
                                        ) : paginated.map((cate, idx) => (
                                            <tr key={cate.id} style={{
                                                borderBottom: "1px solid #f3f4f6",
                                                background: idx % 2 === 0 ? "#fff" : "#fafafa",
                                                transition: "background 0.15s"
                                            }}>
                                                <td style={{ ...td, color: "#9ca3af", fontSize: 13 }}>#{cate.id}</td>
                                                <td style={{ ...td, fontWeight: 500 }}>{cate.name}</td>
                                                <td style={{ ...td, textAlign: "right" }}>
                                                    <button
                                                        onClick={() => { setIdCategory(cate.id); setNameCategory(cate.name); setCheckEdit(true); }}
                                                        style={smallBtn("#f0fdf4", "#16a34a")}
                                                    >✏️ Sửa</button>
                                                    <button
                                                        onClick={() => handleDelete(cate.id, cate.name)}
                                                        style={smallBtn("#fef2f2", "#dc2626")}
                                                    >🗑️ Xóa</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination page={page} totalPages={totalPages} onChange={setPage} />

                            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 12 }}>
                                Hiển thị {paginated.length} / {filtered.length} danh mục
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                    height: 48, borderRadius: 8, background: "#f3f4f6",
                    animation: "pulse 1.5s infinite"
                }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>
    );
}

const th = { padding: "13px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" };
const td = { padding: "13px 16px", fontSize: 14, color: "#111" };
const btnStyle = (bg) => ({
    padding: "9px 18px", borderRadius: 8, border: "none",
    background: bg, color: "#fff", cursor: "pointer",
    fontWeight: 600, fontSize: 14
});
const smallBtn = (bg, color) => ({
    padding: "5px 12px", borderRadius: 6, border: `1px solid ${color}22`,
    background: bg, color, cursor: "pointer", fontSize: 13,
    fontWeight: 500, marginLeft: 6
});

export default CategoryAdmin;