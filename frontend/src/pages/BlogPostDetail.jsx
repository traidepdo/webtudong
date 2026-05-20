import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function BlogPostDetail() {
    const { slug } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        setLoading(true);
        api.get(`/blog/posts/${slug}/`)
            .then(r => {
                setPost(r.data);
                setComments(r.data.comments || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/blog/posts/${slug}/comments/`, { content: comment });
            setComments(prev => [res.data, ...prev]);
            setComment("");
        } catch (err) {
            alert("Lỗi khi đăng bình luận.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,235,224,0.3)" }}>
            Đang tải bài viết...
        </div>
    );

    if (!post) return (
        <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#f0ebe0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h2>Không tìm thấy bài viết</h2>
            <Link to="/blog" style={{ color: "#D4AF37", marginTop: 16 }}>← Quay lại Blog</Link>
        </div>
    );

    const publishedDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })
        : "";

    // JSON-LD Article schema
    const schemaJson = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.meta_description || post.excerpt || "",
        "image": post.thumbnail || "",
        "author": { "@type": "Person", "name": post.author_name || "Blue Sky Fashion" },
        "publisher": {
            "@type": "Organization",
            "name": "Blue Sky Fashion",
            "logo": { "@type": "ImageObject", "url": `${window.location.origin}/logo.png` }
        },
        "datePublished": post.published_at,
        "dateModified": post.updated_at,
        "mainEntityOfPage": { "@type": "WebPage", "@id": window.location.href }
    };

    // Breadcrumb schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": window.location.origin },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${window.location.origin}/blog` },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": window.location.href }
        ]
    };

    return (
        <>
            <Helmet>
                <title>{post.meta_title || post.title} | Blue Sky Fashion Blog</title>
                <meta name="description" content={post.meta_description || post.excerpt || ""} />
                <meta property="og:title" content={post.meta_title || post.title} />
                <meta property="og:description" content={post.meta_description || post.excerpt || ""} />
                <meta property="og:image" content={post.thumbnail || ""} />
                <meta property="og:type" content="article" />
                <meta property="article:published_time" content={post.published_at} />
                <meta property="article:modified_time" content={post.updated_at} />
                <link rel="canonical" href={window.location.href} />
                <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0ebe0", fontFamily: "Georgia, serif" }}>

                {/* Thumbnail hero */}
                {post.thumbnail && (
                    <div style={{ height: "50vh", overflow: "hidden", position: "relative" }}>
                        <img src={post.thumbnail} alt={post.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45)" }} />
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to top, #0d0d0d 0%, transparent 60%)"
                        }} />
                    </div>
                )}

                <article style={{ maxWidth: 780, margin: "0 auto", padding: post.thumbnail ? "0 24px 60px" : "80px 24px 60px" }}>

                    {/* Breadcrumb */}
                    <nav style={{ fontSize: 12, color: "rgba(240,235,224,0.35)", fontFamily: "sans-serif", marginBottom: 24, marginTop: post.thumbnail ? -32 : 0, position: "relative" }}>
                        <Link to="/" style={{ color: "rgba(240,235,224,0.35)", textDecoration: "none" }}>Trang chủ</Link>
                        <span style={{ margin: "0 8px" }}>›</span>
                        <Link to="/blog" style={{ color: "rgba(240,235,224,0.35)", textDecoration: "none" }}>Blog</Link>
                        {post.category && (
                            <>
                                <span style={{ margin: "0 8px" }}>›</span>
                                <Link to={`/blog?category=${post.category.slug}`} style={{ color: "#D4AF37", textDecoration: "none" }}>{post.category.name}</Link>
                            </>
                        )}
                    </nav>

                    {/* Title */}
                    <h1 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "clamp(28px, 4.5vw, 52px)",
                        fontWeight: 700, color: "#f0ebe0",
                        lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.01em"
                    }}>{post.title}</h1>

                    {/* Meta */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid rgba(212,175,55,0.15)", fontFamily: "sans-serif", fontSize: 13, color: "rgba(240,235,224,0.45)" }}>
                        <span>✍ {post.author_name || "Blue Sky Fashion"}</span>
                        {publishedDate && <span>📅 {publishedDate}</span>}
                        <span>👁 {post.views} lượt xem</span>
                        <span>💬 {comments.length} bình luận</span>
                    </div>

                    {/* Excerpt */}
                    {post.excerpt && (
                        <p style={{ fontSize: 17, fontStyle: "italic", color: "rgba(240,235,224,0.65)", lineHeight: 1.75, marginBottom: 32, paddingLeft: 16, borderLeft: "2px solid #D4AF37" }}>
                            {post.excerpt}
                        </p>
                    )}

                    {/* Content */}
                    <div className="blog-article-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        style={{ fontSize: 16.5, lineHeight: 1.9, color: "rgba(240,235,224,0.82)" }}
                    />

                    {/* Related products */}
                    {post.related_products?.length > 0 && (
                        <div style={{ marginTop: 48, padding: "28px 0", borderTop: "1px solid rgba(212,175,55,0.15)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                            <p style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 3, color: "#D4AF37", textTransform: "uppercase", marginBottom: 16 }}>
                                Sản phẩm trong bài
                            </p>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {post.related_products.map(p => {
                                    const img = p.images?.find(i => i.is_primary) || p.images?.[0];
                                    const price = p.variants?.reduce((min, v) => v.price < min ? v.price : min, Infinity);
                                    return (
                                        <Link key={p.id} to={`/${p.category_slug}/${p.slug}`} style={{ textDecoration: "none", width: 150 }}>
                                            <div style={{ border: "1px solid rgba(212,175,55,0.2)", borderRadius: 6, overflow: "hidden", transition: "border-color .3s" }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = "#D4AF37"}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"}
                                            >
                                                <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#1a1a1a" }}>
                                                    {img && <img src={img.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                                </div>
                                                <div style={{ padding: "10px 12px", background: "#161616" }}>
                                                    <p style={{ margin: 0, fontSize: 12, color: "#f0ebe0", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 }}>{p.name}</p>
                                                    <p style={{ margin: 0, fontSize: 11, color: "#D4AF37", fontFamily: "sans-serif" }}>
                                                        {price !== Infinity ? Number(price).toLocaleString("vi-VN") + "₫" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags / share */}
                    <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <Link to="/blog" style={{ color: "#D4AF37", fontFamily: "sans-serif", fontSize: 13, textDecoration: "none" }}>← Quay lại Blog</Link>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("Đã sao chép link!"))}
                                style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "sans-serif" }}>
                                🔗 Sao chép link
                            </button>
                        </div>
                    </div>

                    {/* Comments */}
                    <div style={{ marginTop: 56 }}>
                        <h2 style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 700, color: "#f0ebe0", marginBottom: 24 }}>
                            Bình luận ({comments.length})
                        </h2>

                        {user ? (
                            <form onSubmit={handleComment} style={{ marginBottom: 32 }}>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Chia sẻ suy nghĩ của bạn..."
                                    rows={4}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.2)", color: "#f0ebe0", fontSize: 14, borderRadius: 6, resize: "vertical", fontFamily: "Georgia, serif", outline: "none", marginBottom: 10 }}
                                />
                                <button type="submit" disabled={submitting}
                                    style={{ padding: "10px 24px", background: "#D4AF37", border: "none", color: "#0d0d0d", fontWeight: 700, borderRadius: 6, cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, fontFamily: "sans-serif" }}>
                                    {submitting ? "Đang gửi..." : "Đăng bình luận"}
                                </button>
                            </form>
                        ) : (
                            <div style={{ padding: "16px 20px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 6, marginBottom: 24, fontFamily: "sans-serif", fontSize: 14, color: "rgba(240,235,224,0.6)" }}>
                                <Link to="/login" style={{ color: "#D4AF37" }}>Đăng nhập</Link> để bình luận bài viết này.
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {comments.map(c => (
                                <div key={c.id} style={{ padding: "16px 20px", background: "#161616", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                        {c.avatar ? (
                                            <img src={c.avatar} alt={c.username} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d0d0d", fontWeight: 700, fontSize: 14, fontFamily: "sans-serif" }}>
                                                {c.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ margin: 0, fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: "#f0ebe0" }}>{c.username}</p>
                                            <p style={{ margin: 0, fontFamily: "sans-serif", fontSize: 11, color: "rgba(240,235,224,0.35)" }}>
                                                {new Date(c.created_at).toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: "rgba(240,235,224,0.75)", lineHeight: 1.7 }}>{c.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>

                {/* Global CSS for article content */}
                <style>{`
                    .blog-article-content h1,.blog-article-content h2,.blog-article-content h3 {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: #f0ebe0; margin: 1.6em 0 0.5em; line-height: 1.2;
                    }
                    .blog-article-content h2 { font-size: 1.6em; }
                    .blog-article-content h3 { font-size: 1.25em; }
                    .blog-article-content p { margin: 0 0 1.3em; }
                    .blog-article-content a { color: #D4AF37; }
                    .blog-article-content strong { color: #f0ebe0; }
                    .blog-article-content blockquote {
                        border-left: 3px solid #D4AF37; padding-left: 18px;
                        margin: 1.8em 0; color: rgba(240,235,224,0.6); font-style: italic;
                    }
                    .blog-article-content ul,.blog-article-content ol { padding-left: 1.6em; margin-bottom: 1.3em; color: rgba(240,235,224,0.8); }
                    .blog-article-content li { margin-bottom: 0.4em; }
                    .blog-article-content img { max-width:100%; border-radius:6px; margin:1.5em 0; }
                    .blog-article-content code { background: rgba(212,175,55,0.1); color:#D4AF37; padding:2px 6px; border-radius:3px; font-size:.9em; }
                    .blog-article-content pre { background:#161616; padding:18px; border-radius:8px; overflow-x:auto; border:1px solid rgba(212,175,55,0.15); margin:1.5em 0; }
                `}</style>
            </div>
        </>
    );
}
