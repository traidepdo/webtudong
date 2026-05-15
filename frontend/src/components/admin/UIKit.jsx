// components/admin/UIKit.jsx
import { useState, useCallback } from "react";

/* ─────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────── */
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((message, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const toast = {
        success: msg => add(msg, "success"),
        error: msg => add(msg, "error"),
        info: msg => add(msg, "info"),
        warning: msg => add(msg, "warning"),
    };
    return { toasts, toast };
}

const toastColors = {
    success: { bg: "#ecfdf5", border: "#10b981", icon: "✓", color: "#065f46" },
    error: { bg: "#fef2f2", border: "#ef4444", icon: "✕", color: "#991b1b" },
    info: { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ", color: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#f59e0b", icon: "⚠", color: "#92400e" },
};

export function ToastContainer({ toasts }) {
    return (
        <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 9999,
            display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none"
        }}>
            {toasts.map(t => {
                const c = toastColors[t.type] || toastColors.success;
                return (
                    <div key={t.id} style={{
                        background: c.bg, border: `1px solid ${c.border}`,
                        borderLeft: `4px solid ${c.border}`, borderRadius: 8,
                        padding: "12px 18px", minWidth: 260, maxWidth: 360,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        display: "flex", alignItems: "center", gap: 10,
                        animation: "slideIn 0.3s ease",
                        pointerEvents: "all",
                        color: c.color, fontWeight: 500, fontSize: 14
                    }}>
                        <span style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: c.border, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, flexShrink: 0
                        }}>{c.icon}</span>
                        {t.message}
                    </div>
                );
            })}
            <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
        </div>
    );
}

/* ─────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────── */
export function useConfirm() {
    const [dialog, setDialog] = useState(null);
    const confirm = useCallback((message, onConfirm, options = {}) => {
        setDialog({ message, onConfirm, ...options });
    }, []);
    const close = () => setDialog(null);

    const ConfirmDialog = () => !dialog ? null : (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{
                background: "#fff", borderRadius: 12, padding: "28px 32px",
                maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                animation: "popIn 0.2s ease"
            }}>
                <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>
                    {dialog.icon || "🗑️"}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, textAlign: "center", color: "#111" }}>
                    {dialog.title || "Xác nhận"}
                </h3>
                <p style={{ margin: "0 0 24px", textAlign: "center", color: "#555", fontSize: 14 }}>
                    {dialog.message}
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={close} style={{
                        padding: "9px 24px", borderRadius: 8, border: "1px solid #ddd",
                        background: "#f5f5f5", color: "#444", cursor: "pointer", fontWeight: 500, fontSize: 14
                    }}>Hủy</button>
                    <button onClick={() => { dialog.onConfirm(); close(); }} style={{
                        padding: "9px 24px", borderRadius: 8, border: "none",
                        background: dialog.danger ? "#ef4444" : "#4f46e5",
                        color: "#fff", cursor: "pointer", fontWeight: 500, fontSize: 14
                    }}>{dialog.confirmText || "Xác nhận"}</button>
                </div>
            </div>
            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
    );

    return { confirm, ConfirmDialog };
}

/* ─────────────────────────────────────────
   PAGINATION
───────────────────────────────────────── */
export function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
            <button onClick={() => onChange(page - 1)} disabled={page === 1} style={pBtn(page === 1)}>‹</button>
            {pages.map(p => (
                <button key={p} onClick={() => onChange(p)} style={pBtn(false, p === page)}>{p}</button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={pBtn(page === totalPages)}>›</button>
        </div>
    );
}
const pBtn = (disabled, active = false) => ({
    width: 34, height: 34, borderRadius: 8, border: active ? "none" : "1px solid #e2e8f0",
    background: active ? "#4f46e5" : disabled ? "#f5f5f5" : "#fff",
    color: active ? "#fff" : disabled ? "#bbb" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: active ? 700 : 400, fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center"
});

/* ─────────────────────────────────────────
   SEARCH BAR
───────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = "Tìm kiếm..." }) {
    return (
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <span style={{
                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                color: "#9ca3af", fontSize: 15
            }}>🔍</span>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", padding: "8px 12px 8px 34px",
                    borderRadius: 8, border: "1px solid #e2e8f0",
                    fontSize: 14, outline: "none", background: "#f9fafb",
                    boxSizing: "border-box"
                }}
            />
        </div>
    );
}

/* ─────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────── */
const badgeMap = {
    pending: { label: "Chờ xác nhận", bg: "#fef3c7", color: "#92400e" },
    confirmed: { label: "Đã xác nhận", bg: "#dbeafe", color: "#1e40af" },
    shipping: { label: "Đang giao", bg: "#e0e7ff", color: "#3730a3" },
    delivered: { label: "Đã giao", bg: "#dcfce7", color: "#166534" },
    cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#991b1b" },
};
export function StatusBadge({ status }) {
    const s = badgeMap[status] || { label: status, bg: "#f3f4f6", color: "#374151" };
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 12,
            background: s.bg, color: s.color, fontWeight: 600
        }}>{s.label}</span>
    );
}