import React, { useState, useEffect, useRef } from "react";
import api from "../../api";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
    ],
};

const FONT_MAP = { georgia: "'Georgia', serif", inter: "'Inter', sans-serif", playfair: "'Playfair Display', serif", mono: "'Courier New', monospace" };

const BlogPreview = ({ form, categoryName }) => {
    const bg = form.banner_color || '#0d0d0d';
    const font = FONT_MAP[form.font_family] || FONT_MAP.georgia;
    return (
    <div style={{ background: bg, color: '#f0ebe0', minHeight: '100%', fontFamily: font, overflowY: 'auto' }}>
        <div style={{ background: 'rgba(13,13,13,0.95)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'sans-serif', fontSize: 15, color: '#D4AF37', fontWeight: 700 }}>BLUE SKY BLOG</span>
            <span style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', letterSpacing: 2, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>Xem trước</span>
        </div>
        <article style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
            {categoryName && <div style={{ marginBottom: 14 }}><span style={{ fontFamily: 'sans-serif', fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', color: '#D4AF37', borderBottom: '1px solid #D4AF37', paddingBottom: 2 }}>{categoryName}</span></div>}
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,44px)', fontWeight: 700, color: '#f0ebe0', lineHeight: 1.18, margin: '0 0 18px' }}>
                {form.title || <span style={{ opacity: 0.3 }}>Tiêu đề bài viết...</span>}
            </h1>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(212,175,55,0.12)', fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(240,235,224,0.4)' }}>
                <span>✍ Admin</span><span>·</span>
                <span>📅 {new Date().toLocaleDateString('vi-VN')}</span><span>·</span>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, background: form.status === 'published' ? 'rgba(22,163,74,0.15)' : 'rgba(245,158,11,0.15)', color: form.status === 'published' ? '#4ade80' : '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {form.status === 'published' ? 'Xuất bản' : 'Bản nháp'}
                </span>
            </div>
            {form.excerpt && <p style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(240,235,224,0.6)', lineHeight: 1.7, marginBottom: 24, paddingLeft: 14, borderLeft: '2px solid #D4AF37' }}>{form.excerpt}</p>}
            {form.content && form.content !== '<p><br></p>' ? (
                <div className="blog-preview-content" dangerouslySetInnerHTML={{ __html: form.content }} style={{ fontSize: 15.5, lineHeight: 1.85, color: 'rgba(240,235,224,0.8)' }} />
            ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(240,235,224,0.2)', fontFamily: 'sans-serif', fontSize: 14 }}>Nội dung sẽ hiển thị ở đây...</div>
            )}
        </article>
        <style>{`
            .blog-preview-content h1,.blog-preview-content h2,.blog-preview-content h3{font-family:'Playfair Display',Georgia,serif;color:#f0ebe0;margin:1.4em 0 .5em;}
            .blog-preview-content h2{font-size:1.5em;}.blog-preview-content h3{font-size:1.2em;}
            .blog-preview-content p{margin:0 0 1.2em;}
            .blog-preview-content a{color:#D4AF37;}
            .blog-preview-content blockquote{border-left:3px solid #D4AF37;padding-left:14px;margin:1.5em 0;color:rgba(240,235,224,.6);font-style:italic;}
            .blog-preview-content ul,.blog-preview-content ol{padding-left:1.5em;margin-bottom:1.2em;color:rgba(240,235,224,.8);}
            .blog-preview-content img{max-width:100%;border-radius:4px;margin:1.2em 0;}
            .blog-preview-content code{background:rgba(212,175,55,.1);color:#D4AF37;padding:2px 6px;border-radius:3px;font-size:.9em;}
        `}</style>
    </div>
    );
};

// ── Product picker modal ────────────────────────────────────────
const ProductPicker = ({ products, selected, onToggle, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 640, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Chọn sản phẩm liên quan</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {products.map(p => {
                    const img = p.images?.find(i => i.is_primary) || p.images?.[0];
                    const isSelected = selected.includes(p.id);
                    return (
                        <div key={p.id} onClick={() => onToggle(p.id)} style={{ border: `2px solid ${isSelected ? '#4f46e5' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'border .2s' }}>
                            <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#f3f4f6' }}>
                                {img && <img src={img.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ padding: '8px 10px' }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111' }}>{p.name}</p>
                                {isSelected && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4f46e5' }}>✓ Đã chọn</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button onClick={onClose} style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xong ({selected.length})</button>
            </div>
        </div>
    </div>
);

// ── Main component ──────────────────────────────────────────────
const EMPTY_FORM = { title: '', category: '', content: '', excerpt: '', status: 'draft', meta_title: '', meta_description: '', thumbnail: '', related_product_ids: [], banner_color: '', font_family: 'georgia' };

export default function AdminBlog() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
    const [editSlug, setEditSlug] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('content'); // 'content' | 'seo' | 'products'
    const [saving, setSaving] = useState(false);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const thumbnailRef = useRef();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [postRes, catRes, prodRes] = await Promise.all([
                api.get('/blog/posts/'),
                api.get('/blog/categories/'),
                api.get('/products/'),
            ]);
            setPosts(postRes.data?.results ?? postRes.data ?? []);
            setCategories(catRes.data?.results ?? catRes.data ?? []);
            setProducts(prodRes.data?.results ?? prodRes.data ?? []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const openCreate = () => { setForm(EMPTY_FORM); setEditSlug(null); setMode('create'); setActiveTab('content'); };

    const openEdit = async (slug) => {
        try {
            const r = await api.get(`/blog/posts/${slug}/`);
            const p = r.data;
            setForm({
                title: p.title || '', category: p.category?.id || '',
                content: p.content || '', excerpt: p.excerpt || '',
                status: p.status || 'draft', meta_title: p.meta_title || '',
                meta_description: p.meta_description || '',
                thumbnail: p.thumbnail || '',
                related_product_ids: p.related_products?.map(pr => pr.id) || [],
                banner_color: p.banner_color || '',
                font_family: p.font_family || 'georgia',
            });
            setEditSlug(slug);
            setMode('edit');
            setActiveTab('content');
            setThumbnailFile(null);
            setThumbnailPreview(p.thumbnail || '');
        } catch (e) { alert('Không tải được bài viết.'); }
    };

    const handleSave = async () => {
        if (!form.title.trim()) { alert('Nhập tiêu đề!'); return; }
        setSaving(true);
        try {
            // Use FormData to support file upload
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('content', form.content || '');
            fd.append('excerpt', form.excerpt || '');
            fd.append('status', form.status);
            fd.append('meta_title', form.meta_title || '');
            fd.append('meta_description', form.meta_description || '');
            fd.append('banner_color', form.banner_color || '');
            // Only send category_id if selected (avoid null rejection)
            if (form.category) fd.append('category_id', parseInt(form.category));
            // Related products
            form.related_product_ids.forEach(id => fd.append('related_product_ids', id));
            // Thumbnail: file upload OR url
            if (thumbnailFile) {
                fd.append('thumbnail', thumbnailFile);
            } else if (form.thumbnail) {
                fd.append('thumbnail', form.thumbnail);
            }
            const headers = { 'Content-Type': 'multipart/form-data' };
            if (mode === 'edit') {
                await api.patch(`/blog/posts/${editSlug}/`, fd, { headers });
            } else {
                await api.post('/blog/posts/', fd, { headers });
            }
            setMode('list'); setThumbnailFile(null); setThumbnailPreview(''); fetchAll();
            alert(mode === 'edit' ? 'Cập nhật thành công!' : 'Đăng bài thành công!');
        } catch (e) {
            const msg = e.response?.data ? JSON.stringify(e.response.data) : 'Lỗi khi lưu bài.';
            alert(msg);
        } finally { setSaving(false); }
    };

    const handleDelete = async (slug) => {
        if (!window.confirm('Xóa bài viết này?')) return;
        await api.delete(`/blog/posts/${slug}/`); fetchAll();
    };

    const toggleProduct = (id) => setForm(f => ({
        ...f, related_product_ids: f.related_product_ids.includes(id)
            ? f.related_product_ids.filter(x => x !== id)
            : [...f.related_product_ids, id]
    }));

    const getCategoryName = (id) => categories.find(c => String(c.id) === String(id))?.name || '';

    // ── EDITOR MODE ─────────────────────────────────────────────
    if (mode === 'create' || mode === 'edit') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {showProductPicker && (
                    <ProductPicker products={products} selected={form.related_product_ids} onToggle={toggleProduct} onClose={() => setShowProductPicker(false)} />
                )}

                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setMode('list')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{mode === 'edit' ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => setPreviewMode(p => !p)} style={{ padding: '7px 14px', border: '1px solid #4f46e5', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: previewMode ? '#4f46e5' : '#fff', color: previewMode ? '#fff' : '#4f46e5', fontWeight: 600 }}>
                            {previewMode ? '✏ Soạn thảo' : '👁 Xem trước'}
                        </button>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 12 }}>
                            <option value="draft">📄 Bản nháp</option>
                            <option value="published">🚀 Xuất bản</option>
                        </select>
                        <button onClick={handleSave} disabled={saving} style={{ padding: '7px 18px', background: saving ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                            {saving ? '⏳ Đang lưu...' : '✅ Lưu bài'}
                        </button>
                    </div>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0, paddingLeft: 18 }}>
                    {[['content', '✍ Nội dung'], ['seo', '🌐 SEO'], ['products', `🛔 Sản phẩm (${form.related_product_ids.length})`], ['appearance', '🎨 Giao diện']].map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '10px 16px', border: 'none', borderBottom: `2px solid ${activeTab === key ? '#4f46e5' : 'transparent'}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? '#4f46e5' : '#6b7280' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Editor pane */}
                    <div style={{ width: previewMode ? 0 : '50%', overflow: previewMode ? 'hidden' : 'auto', transition: 'width .3s', borderRight: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0 }}>
                        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* CONTENT TAB */}
                            {activeTab === 'content' && (<>
                                <div>
                                    <label style={L}>Tiêu đề *</label>
                                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nhập tiêu đề..." style={{ ...I, fontSize: 16, fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={L}>Danh mục</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={I}>
                                            <option value="">-- Chọn --</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={L}>Tóm tắt</label>
                                    <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Mô tả ngắn..." style={{ ...I, resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>
                                <div>
                                    <label style={L}>Nội dung *</label>
                                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                                        <ReactQuill theme="snow" value={form.content} onChange={val => setForm({ ...form, content: val })} modules={QUILL_MODULES} style={{ minHeight: 320 }} />
                                    </div>
                                </div>
                            </>)}

                            {/* SEO TAB */}
                            {activeTab === 'seo' && (<>
                                <div>
                                    <label style={L}>Meta Title <span style={{ color: '#9ca3af', fontSize: 11 }}>(để trống = dùng tiêu đề)</span></label>
                                    <input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} maxLength={70} placeholder="Tiêu đề hiển thị trên Google..." style={I} />
                                    <span style={{ fontSize: 11, color: form.meta_title.length > 60 ? '#f59e0b' : '#9ca3af' }}>{form.meta_title.length}/70</span>
                                </div>
                                <div>
                                    <label style={L}>Meta Description</label>
                                    <textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} maxLength={160} rows={3} placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..." style={{ ...I, resize: 'vertical', fontFamily: 'inherit' }} />
                                    <span style={{ fontSize: 11, color: form.meta_description.length > 140 ? '#f59e0b' : '#9ca3af' }}>{form.meta_description.length}/160</span>
                                </div>
                                {/* Google preview */}
                                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '16px 18px', border: '1px solid #e5e7eb' }}>
                                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Xem trước Google</p>
                                    <p style={{ color: '#1a0dab', fontSize: 17, margin: '0 0 2px', fontWeight: 500 }}>{form.meta_title || form.title || 'Tiêu đề bài viết'}</p>
                                    <p style={{ fontSize: 13, color: '#006621', margin: '0 0 4px' }}>yourdomain.com/blog/{form.title ? form.title.toLowerCase().replace(/\s+/g, '-') : '...'}</p>
                                    <p style={{ fontSize: 14, color: '#545454', margin: 0 }}>{form.meta_description || form.excerpt || 'Mô tả bài viết sẽ hiển thị ở đây...'}</p>
                                </div>
                            </>)}

                            {/* APPEARANCE TAB */}
                            {activeTab === 'appearance' && (<>
                                {/* Thumbnail upload */}
                                <div>
                                    <label style={L}>🖼️ Ảnh bìa bài viết</label>
                                    <div style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }}
                                        onClick={() => thumbnailRef.current?.click()}>
                                        {(thumbnailPreview || form.thumbnail) ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={thumbnailPreview || form.thumbnail} alt="thumb"
                                                    style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 6, objectFit: 'cover' }} />
                                                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Nhấn để đổi ảnh</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ fontSize: 36 }}>🖼️</div>
                                                <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Nhấn để upload ảnh bìa</p>
                                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>JPG, PNG, WEBP — khuyến nghị 1200×630px</p>
                                            </div>
                                        )}
                                        <input ref={thumbnailRef} type="file" accept="image/*" style={{ display: 'none' }}
                                            onChange={e => {
                                                const f = e.target.files[0];
                                                if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); }
                                            }} />
                                    </div>
                                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Hoặc dùng URL:</p>
                                    <input value={form.thumbnail} onChange={e => { setForm({ ...form, thumbnail: e.target.value }); if (!thumbnailFile) setThumbnailPreview(e.target.value); }}
                                        placeholder="https://..." style={I} />
                                </div>

                                {/* Banner color */}
                                <div>
                                    <label style={L}>🎨 Màu nền banner (hắt ảnh bìa)</label>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        {['#0d0d0d','#1a1a2e','#1e3a5f','#1a2e1a','#2e1a1a','#2a1a2e','#1a2e2e'].map(color => (
                                            <div key={color} onClick={() => setForm({ ...form, banner_color: color })}
                                                style={{ width: 36, height: 36, background: color, borderRadius: 6, cursor: 'pointer', border: form.banner_color === color ? '3px solid #4f46e5' : '2px solid transparent', transition: 'border .2s' }} />
                                        ))}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <label style={{ fontSize: 12, color: '#6b7280' }}>Tùy chỉnh:</label>
                                            <input type="color" value={form.banner_color || '#0d0d0d'}
                                                onChange={e => setForm({ ...form, banner_color: e.target.value })}
                                                style={{ width: 40, height: 36, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Màu hiện tại: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{form.banner_color || '#0d0d0d (mặc định)'}</code></p>
                                </div>

                                {/* Font choice */}
                                <div>
                                    <label style={L}>🔤 Font chữ nội dung</label>
                                    <select value={form.font_family || 'georgia'} onChange={e => setForm({ ...form, font_family: e.target.value })} style={I}>
                                        <option value="georgia">Georgia (Serif - Mặc định)</option>
                                        <option value="inter">Inter (Sans-serif - Hiện đại)</option>
                                        <option value="playfair">Playfair Display (Sang trọng)</option>
                                        <option value="mono">Monospace (Code / Kỹ thuật)</option>
                                    </select>
                                </div>

                                {/* Preview thumbnail in preview pane note */}
                                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 16px', border: '1px solid #bfdbfe' }}>
                                    <p style={{ margin: 0, fontSize: 13, color: '#2563eb' }}>💡 Mọi thay đổi giao diện được xem trước ngay ở khu vực bên phải.</p>
                                </div>
                            </>)}

                            {/* PRODUCTS TAB */}
                            {activeTab === 'products' && (<>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={L}>Sản phẩm liên quan trong bài viết</label>
                                    <button onClick={() => setShowProductPicker(true)} style={{ padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Chọn sản phẩm</button>
                                </div>
                                {form.related_product_ids.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>Chưa chọn sản phẩm nào</div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {products.filter(p => form.related_product_ids.includes(p.id)).map(p => {
                                            const img = p.images?.find(i => i.is_primary) || p.images?.[0];
                                            return (
                                                <div key={p.id} style={{ width: 100, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                                                    <div style={{ aspectRatio: '3/4', background: '#f3f4f6', overflow: 'hidden' }}>
                                                        {img && <img src={img.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                    <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#111' }}>{p.name.slice(0, 18)}</p>
                                                        <button onClick={() => toggleProduct(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>)}
                        </div>
                    </div>

                    {/* Preview pane */}
                    <div style={{ flex: 1, overflow: 'auto', background: '#0d0d0d' }}>
                        {!previewMode && (
                            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(212,175,55,0.12)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                                <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(240,235,224,0.3)', fontFamily: 'sans-serif', letterSpacing: 1 }}>Live Preview</span>
                            </div>
                        )}
                        <BlogPreview form={form} categoryName={getCategoryName(form.category)} />
                    </div>
                </div>
            </div>
        );
    }

    // ── LIST MODE ───────────────────────────────────────────────
    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Quản lý bài viết Blog</h2>
                <button onClick={openCreate} style={{ padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    ✏ Viết bài mới
                </button>
            </div>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Lượt xem</th><th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post.id}>
                            <td style={{ fontWeight: 600 }}>{post.title}</td>
                            <td>{post.category_name || '-'}</td>
                            <td><span className={`status-badge ${post.status === 'published' ? 'delivered' : 'pending'}`}>{post.status === 'published' ? 'Xuất bản' : 'Bản nháp'}</span></td>
                            <td>{post.views ?? 0}</td>
                            <td style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => openEdit(post.slug)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Sửa</button>
                                <button onClick={() => handleDelete(post.slug)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                    {posts.length === 0 && (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Chưa có bài viết nào</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

const L = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 };
const I = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#111' };
