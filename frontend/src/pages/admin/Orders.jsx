// pages/admin/Orders.jsx
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import "../../App.css";
import api from "../../api";
import { useState, useEffect, useMemo } from "react";
import {
    useToast, ToastContainer,
    useConfirm,
    Pagination, SearchBar, StatusBadge
} from "../../components/admin/UIKit";

const PAGE_SIZE = 10;

// Khớp với STATUS_CHOICES trong models.py
const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "processing", label: "Đang chuẩn bị hàng" },
    { value: "shipped", label: "Đang giao" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã hủy" },
];

// Luồng chuyển trạng thái khớp với backend
const STATUS_TRANSITIONS = {
    pending: [
        { value: "processing", label: "✅ Xác nhận đơn", bg: "#4f46e5" },
        { value: "cancelled", label: "❌ Hủy đơn", bg: "#dc2626" },
    ],
    processing: [
        { value: "shipped", label: "🚚 Giao hàng", bg: "#0891b2" },
        { value: "cancelled", label: "❌ Hủy đơn", bg: "#dc2626" },
    ],
    shipped: [
        { value: "delivered", label: "📦 Đã giao", bg: "#16a34a" },
    ],
    delivered: [],
    cancelled: [],
};

function OrdersAdmin() {
    const { toasts, toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);

    const fetchOrders = async () => {
        try {
            const res = await api.get("/orders/");
            const data = res.data;

            // Trường hợp 1: Backend trả về array thẳng
            if (Array.isArray(data)) {
                setOrders(data);
                return;
            }

            // Trường hợp 2: Backend có phân trang DRF { count, next, results, ... }
            if (data.results) {
                let allOrders = [...data.results];
                let nextUrl = data.next;

                // Fetch hết tất cả các trang tiếp theo
                while (nextUrl) {
                    const nextRes = await api.get(nextUrl);
                    allOrders = [...allOrders, ...nextRes.data.results];
                    nextUrl = nextRes.data.next;
                }

                setOrders(allOrders);
                return;
            }

            // Fallback
            setOrders([]);
        } catch {
            toast.error("Không thể tải đơn hàng!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setLoading(true); fetchOrders(); }, []);

    const filtered = useMemo(() => orders.filter(o => {
        const matchSearch =
            String(o.id).includes(search) ||
            // Backend trả về full_name (không phải customer_name)
            (o.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
            // Backend trả về email từ user (Django User model)
            (o.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
            // Hỗ trợ thêm order_code ("ORD123")
            (o.order_code || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus ? o.status === filterStatus : true;
        return matchSearch && matchStatus;
    }), [orders, search, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    // Nếu page hiện tại vượt quá totalPages (do filter/search thu hẹp kết quả) → reset về trang 1
    const safePage = page > totalPages ? 1 : page;
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Count by status
    const counts = useMemo(() => {
        const c = {};
        orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
        return c;
    }, [orders]);

    const handleStatusChange = (order, newStatus) => {
        const labels = {
            processing: "xác nhận",
            shipped: "giao hàng",
            delivered: "hoàn thành",
            cancelled: "hủy"
        };
        confirm(
            `Bạn có chắc muốn ${labels[newStatus] || newStatus} đơn #${order.id}?`,
            () => {
                api.patch(`/orders/${order.id}/`, { status: newStatus })
                    .then(() => { toast.success(`Cập nhật đơn hàng thành công!`); fetchOrders(); })
                    .catch(() => toast.error("Cập nhật thất bại!"));
            },
            {
                title: "Cập nhật trạng thái",
                danger: newStatus === "cancelled",
                confirmText: "Xác nhận",
                icon: newStatus === "cancelled" ? "⚠️" : "✅"
            }
        );
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

    const formatDate = (dt) =>
        dt ? new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

    return (
        <div className="container-homeadmin">
            <ToastContainer toasts={toasts} />
            <ConfirmDialog />
            <Headeradmin />

            <div className="content" style={{ display: "flex", height: "calc(100vh - 100px)", overflow: "hidden" }}>
                <NavAdmin />

                <div className="main" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

                    {/* ── Header ── */}
                    <div style={{ marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>Quản lý đơn hàng</h2>
                        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
                            Tổng: <b>{orders.length}</b> đơn hàng
                        </p>
                    </div>

                    {/* ── Status Quick Stats ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.slice(1).map(s => (
                            <button key={s.value} onClick={() => { setFilterStatus(s.value); setPage(1); }}
                                style={{
                                    padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                                    border: filterStatus === s.value ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                                    background: filterStatus === s.value ? "#ede9fe" : "#fff",
                                    color: filterStatus === s.value ? "#4f46e5" : "#374151",
                                    fontWeight: filterStatus === s.value ? 700 : 400,
                                    fontSize: 13
                                }}>
                                {s.label} {counts[s.value] ? <b>({counts[s.value]})</b> : "(0)"}
                            </button>
                        ))}
                    </div>

                    {/* ── Search + Filter ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                        <SearchBar
                            value={search}
                            onChange={v => { setSearch(v); setPage(1); }}
                            placeholder="Tìm mã đơn, tên, email khách..."
                        />
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            style={{
                                padding: "8px 12px", borderRadius: 8,
                                border: "1px solid #e2e8f0", fontSize: 14,
                                background: "#f9fafb", minWidth: 170
                            }}
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? <LoadingSkeleton /> : (
                        <>
                            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                                            {["Mã đơn", "Khách hàng", "Tổng tiền", "Ngày đặt", "Trạng thái", "Thao tác"].map(h => (
                                                <th key={h} style={th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                                                    <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                                                    Không có đơn hàng nào
                                                </td>
                                            </tr>
                                        ) : paginated.map((order, idx) => (
                                            <>
                                                <tr key={order.id} style={{
                                                    borderBottom: expandedId === order.id ? "none" : "1px solid #f3f4f6",
                                                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                                                    cursor: "pointer"
                                                }}>
                                                    <td style={{ ...td, fontWeight: 700, color: "#4f46e5" }}
                                                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                                                        {/* Dùng order_code từ serializer (VD: "ORD5"), fallback về #id */}
                                                        {order.order_code || `#${order.id}`}
                                                    </td>
                                                    <td style={td}>
                                                        {/* Backend dùng full_name và phone_number */}
                                                        <div style={{ fontWeight: 500 }}>{order.full_name || "Khách vãng lai"}</div>
                                                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{order.phone_number || "—"}</div>
                                                    </td>
                                                    <td style={{ ...td, fontWeight: 600, color: "#111" }}>
                                                        {/* Backend dùng total_amount (không phải total_price) */}
                                                        {formatPrice(order.total_amount || 0)}
                                                    </td>
                                                    <td style={{ ...td, fontSize: 13, color: "#6b7280" }}>
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td style={td}><StatusBadge status={order.status} /></td>
                                                    <td style={td}>
                                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                            {(STATUS_TRANSITIONS[order.status] || []).map(action => (
                                                                <button key={action.value}
                                                                    onClick={() => handleStatusChange(order, action.value)}
                                                                    style={{
                                                                        padding: "5px 11px", borderRadius: 6, border: "none",
                                                                        background: action.bg, color: "#fff",
                                                                        cursor: "pointer", fontSize: 12, fontWeight: 500
                                                                    }}>
                                                                    {action.label}
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                                                style={{
                                                                    padding: "5px 11px", borderRadius: 6,
                                                                    border: "1px solid #e5e7eb", background: "#f9fafb",
                                                                    cursor: "pointer", fontSize: 12, color: "#374151"
                                                                }}>
                                                                {expandedId === order.id ? "▲ Ẩn" : "▼ Chi tiết"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Order detail row ── */}
                                                {expandedId === order.id && (
                                                    <tr key={`detail-${order.id}`}>
                                                        <td colSpan={6} style={{
                                                            padding: "0 16px 16px 16px",
                                                            background: "#f8f9ff",
                                                            borderBottom: "1px solid #e0e7ff"
                                                        }}>
                                                            <OrderDetail order={order} formatPrice={formatPrice} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
                                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                                    Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} đơn hàng
                                </p>
                                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderDetail({ order, formatPrice }) {
    // Backend: items là related_name='items' trong OrderItem → OrderSerializer trả về 'items'
    const items = order.items || [];
    return (
        <div style={{ padding: "16px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Thông tin khách</p>
                    {/* Backend: full_name, phone_number */}
                    <p style={{ margin: "0 0 2px", fontSize: 14 }}><b>{order.full_name || "—"}</b></p>
                    <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{order.phone_number || "—"}</p>
                </div>
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Địa chỉ giao hàng</p>
                    {/* Backend: shipping_address */}
                    <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{order.shipping_address || "—"}</p>
                </div>
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Thanh toán</p>
                    {/* Backend: payment object từ SerializerMethodField */}
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: "#555" }}>
                        Phương thức: <b>{order.payment?.method?.toUpperCase() || "—"}</b>
                    </p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                        Trạng thái:{" "}
                        <span style={{
                            color: order.is_paid ? "#16a34a" : "#d97706",
                            fontWeight: 600
                        }}>
                            {order.is_paid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
                        </span>
                    </p>
                </div>
            </div>

            {items.length > 0 && (
                <>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Sản phẩm</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.map((item, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: "#fff", borderRadius: 8, padding: "10px 14px",
                                border: "1px solid #e5e7eb"
                            }}>
                                {item.image && (
                                    <img src={item.image} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    {/* Backend OrderItemSerializer: product_name, color, size */}
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{item.product_name || "—"}</p>
                                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                                        {[item.color, item.size].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ margin: 0, fontSize: 13, color: "#555" }}>x{item.quantity}</p>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#4f46e5" }}>
                                        {formatPrice(item.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div style={{ marginTop: 14, textAlign: "right", fontSize: 15, fontWeight: 700 }}>
                {/* Backend: total_amount */}
                Tổng cộng: <span style={{ color: "#4f46e5" }}>{formatPrice(order.total_amount || 0)}</span>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                    height: 60, borderRadius: 8, background: "#f3f4f6",
                    animation: "pulse 1.5s infinite", animationDelay: `${i * 0.1}s`
                }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>
    );
}

const th = { padding: "13px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151" };
const td = { padding: "13px 16px", fontSize: 14, color: "#111", verticalAlign: "middle" };

export default OrdersAdmin;