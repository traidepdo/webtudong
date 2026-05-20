import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import api from "../api";

export default function BlogList() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        Promise.all([
            api.get("/blog/posts/"),
            api.get("/blog/categories/")
        ]).then(([postRes, catRes]) => {
            setPosts(postRes.data?.results ?? postRes.data ?? []);
            setCategories(catRes.data?.results ?? catRes.data ?? []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeCategory) params.set("category", activeCategory);
        if (search) params.set("search", search);
        api.get(`/blog/posts/?${params}`).then(r => {
            setPosts(r.data?.results ?? r.data ?? []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [activeCategory, search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const schemaJson = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Blue Sky Fashion Blog",
        "description": "Xu hướng thời trang, phong cách sống và mẹo phối đồ",
        "url": `${window.location.origin}/blog`,
        "blogPost": posts.map(p => ({
            "@type": "BlogPosting",
            "headline": p.title,
            "url": `${window.location.origin}/blog/${p.slug}`,
            "datePublished": p.published_at,
            "image": p.thumbnail,
        }))
    };

    return (
        <>
            <Helmet>
                <title>Blog Thời Trang | Blue Sky Fashion</title>
                <meta name="description" content="Xu hướng thời trang, tips phối đồ và phong cách sống từ Blue Sky Fashion." />
                <meta property="og:title" content="Blog Thời Trang | Blue Sky Fashion" />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify(schemaJson)}</script>
            </Helmet>

            <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0ebe0", fontFamily: "Georgia, serif" }}>

                {/* Hero */}
                <div style={{
                    background: "linear-gradient(135deg, #0d0d0d 0%, #1a1400 100%)",
                    padding: "80px 5% 60px",
                    borderBottom: "1px solid rgba(212,175,55,0.15)",
                    textAlign: "center"
                }}>
                    <p style={{ fontFamily: "sans-serif", fontSize: 11, letterSpacing: 4, color: "#D4AF37", textTransform: "uppercase", marginBottom: 16 }}>
                        Blue Sky Fashion
                    </p>
                    <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px,5vw,70px)", fontWeight: 700, color: "#f0ebe0", margin: "0 0 16px", lineHeight: 1.1 }}>
                        Nhật Ký Thời Trang
                    </h1>
                    <p style={{ color: "rgba(240,235,224,0.55)", fontSize: 15, maxWidth: 500, margin: "0 auto 32px" }}>
                        Xu hướng · Tips phối đồ · Phong cách sống
                    </p>

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ display: "flex", maxWidth: 440, margin: "0 auto", gap: 0 }}>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Tìm bài viết..."
                            style={{
                                flex: 1, padding: "12px 16px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(212,175,55,0.3)", borderRight: "none",
                                color: "#f0ebe0", fontSize: 14, outline: "none",
                                borderRadius: "4px 0 0 4px"
                            }}
                        />
                        <button type="submit" style={{
                            padding: "12px 20px", background: "#D4AF37",
                            border: "none", color: "#0d0d0d", fontWeight: 700,
                            cursor: "pointer", fontSize: 13, borderRadius: "0 4px 4px 0"
                        }}>Tìm</button>
                    </form>
                </div>

                {/* Category tabs */}
                <div style={{ padding: "20px 5%", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                        onClick={() => setActiveCategory("")}
                        style={{
                            padding: "6px 16px", borderRadius: 20, border: "1px solid",
                            fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
                            borderColor: !activeCategory ? "#D4AF37" : "rgba(212,175,55,0.3)",
                            background: !activeCategory ? "#D4AF37" : "transparent",
                            color: !activeCategory ? "#0d0d0d" : "rgba(240,235,224,0.6)"
                        }}
                    >Tất cả</button>
                    {categories.map(c => (
                        <button key={c.id}
                            onClick={() => setActiveCategory(c.slug)}
                            style={{
                                padding: "6px 16px", borderRadius: 20, border: "1px solid",
                                fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
                                borderColor: activeCategory === c.slug ? "#D4AF37" : "rgba(212,175,55,0.3)",
                                background: activeCategory === c.slug ? "#D4AF37" : "transparent",
                                color: activeCategory === c.slug ? "#0d0d0d" : "rgba(240,235,224,0.6)"
                            }}
                        >{c.name} ({c.post_count})</button>
                    ))}
                </div>

                {/* Posts grid */}
                <div style={{ padding: "40px 5%", maxWidth: 1200, margin: "0 auto" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(240,235,224,0.3)" }}>
                            Đang tải bài viết...
                        </div>
                    ) : posts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(240,235,224,0.3)" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                            <p>Chưa có bài viết nào.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
                            {posts.map((post, i) => (
                                <PostCard key={post.id} post={post} featured={i === 0} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function PostCard({ post, featured }) {
    const date = post.published_at
        ? new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })
        : "Chưa xuất bản";

    return (
        <Link to={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <article style={{
                background: "#161616",
                border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 8, overflow: "hidden",
                transition: "transform .3s, border-color .3s",
            }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.12)"; }}
            >
                {/* Thumbnail */}
                <div style={{ aspectRatio: featured ? "16/7" : "16/9", overflow: "hidden", background: "#1a1a1a", position: "relative" }}>
                    {post.thumbnail ? (
                        <img src={post.thumbnail} alt={post.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)", transition: "transform .4s" }}
                            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                            onMouseLeave={e => e.target.style.transform = "scale(1)"}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📰</div>
                    )}
                    {post.category_name && (
                        <span style={{
                            position: "absolute", top: 12, left: 12,
                            background: "#D4AF37", color: "#0d0d0d",
                            fontSize: 10, fontWeight: 700, letterSpacing: 1,
                            padding: "3px 10px", borderRadius: 2, fontFamily: "sans-serif", textTransform: "uppercase"
                        }}>{post.category_name}</span>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: "20px 22px 24px" }}>
                    <h2 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: featured ? 24 : 18, fontWeight: 700,
                        color: "#f0ebe0", margin: "0 0 10px", lineHeight: 1.3
                    }}>{post.title}</h2>

                    <p style={{ color: "rgba(240,235,224,0.5)", fontSize: 13, lineHeight: 1.7, margin: "0 0 16px", fontFamily: "sans-serif" }}>
                        {post.excerpt?.slice(0, 130)}{post.excerpt?.length > 130 ? "..." : ""}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "rgba(240,235,224,0.35)", fontFamily: "sans-serif" }}>
                            <span>✍ {post.author_name || "Admin"}</span>
                            <span>📅 {date}</span>
                            <span>👁 {post.views ?? 0}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#D4AF37", fontFamily: "sans-serif" }}>Đọc tiếp →</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
