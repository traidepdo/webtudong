import React, { useRef, useEffect, useState, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    useMotionValue,
    AnimatePresence,
} from "framer-motion";
import ArticleSEO from "../components/ArticleSEO";

/* ══════════════════════════════════════════════════════════════
   FONTS
══════════════════════════════════════════════════════════════ */
const FontLoader = () => {
    useEffect(() => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href =
            "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Bebas+Neue&family=Tenor+Sans&family=Syne:wght@400;700;800&display=swap";
        document.head.appendChild(l);
    }, []);
    return null;
};

/* ══════════════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════════════ */
const T = {
    black: "#080808",
    dark: "#111111",
    card: "#161616",
    border: "rgba(212,175,55,0.18)",
    gold: "#D4AF37",
    goldL: "#F0D060",
    goldD: "#A07820",
    white: "#F8F4EC",
    muted: "rgba(248,244,236,0.38)",
    dim: "rgba(248,244,236,0.10)",
};

const F = {
    display: "'Playfair Display', serif",
    brutal: "'Bebas Neue', sans-serif",
    clean: "'Tenor Sans', serif",
    syne: "'Syne', sans-serif",
};

/* ══════════════════════════════════════════════════════════════
   CURSOR
══════════════════════════════════════════════════════════════ */
const Cursor = () => {
    const mx = useMotionValue(-200);
    const my = useMotionValue(-200);
    const sx = useSpring(mx, { stiffness: 180, damping: 22 });
    const sy = useSpring(my, { stiffness: 180, damping: 22 });
    const [big, setBig] = useState(false);

    useEffect(() => {
        const mv = (e) => { mx.set(e.clientX); my.set(e.clientY); };
        const on = (e) => { if (e.target.closest("[data-cur]")) setBig(true); };
        const off = () => setBig(false);
        window.addEventListener("mousemove", mv);
        window.addEventListener("mouseover", on);
        window.addEventListener("mouseout", off);
        return () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseover", on);
            window.removeEventListener("mouseout", off);
        };
    }, [mx, my]);

    return (
        <>
            <motion.div style={{
                position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none",
                width: 6, height: 6, borderRadius: "50%", background: T.gold,
                x: mx, y: my, translateX: "-50%", translateY: "-50%",
            }} />
            <motion.div style={{
                position: "fixed", top: 0, left: 0, zIndex: 9998, pointerEvents: "none",
                width: big ? 56 : 32, height: big ? 56 : 32,
                borderRadius: "50%", border: `1px solid ${T.gold}`,
                x: sx, y: sy, translateX: "-50%", translateY: "-50%",
                transition: "width .35s,height .35s",
                mixBlendMode: "exclusion",
            }} />
        </>
    );
};

/* ══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════════════════════════════ */
const ScrollBar = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
    return (
        <motion.div style={{
            position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 999,
            background: `linear-gradient(90deg,${T.goldD},${T.gold},${T.goldL})`,
            transformOrigin: "0%", scaleX,
        }} />
    );
};

/* ══════════════════════════════════════════════════════════════
   STACKED PAGE WRAPPER (Book Flip Effect)
══════════════════════════════════════════════════════════════ */
const StackedPage = ({ children, zIndex, height = "120vh" }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
    const brightness = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
    const rotateX = useTransform(scrollYProgress, [0, 1], [0, -8]);
    const shadow = useTransform(scrollYProgress, [0, 1], [
        "0 0 0 rgba(0,0,0,0)",
        "0 40px 100px rgba(0,0,0,0.8)"
    ]);

    return (
        <div ref={ref} style={{ height, position: "relative", zIndex }}>
            <motion.div style={{
                position: "sticky", top: 0, height: "100vh",
                width: "100%", scale, opacity, filter: `brightness(${brightness})`,
                rotateX, boxShadow: shadow, transformOrigin: "top center",
                overflow: "hidden", background: T.black,
            }}>
                {children}
            </motion.div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════ */
const Navbar = () => {
    const [solid, setSolid] = useState(false);
    useEffect(() => {
        const fn = () => setSolid(window.scrollY > 80);
        window.addEventListener("scroll", fn);
        return () => window.removeEventListener("scroll", fn);
    }, []);

    return (
        <motion.nav
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
                padding: "20px 5%",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: solid ? "rgba(8,8,8,0.92)" : "transparent",
                backdropFilter: solid ? "blur(16px)" : "none",
                borderBottom: solid ? `1px solid ${T.border}` : "none",
                transition: "all 0.5s ease",
            }}
        >
            <span style={{ fontFamily: F.brutal, fontSize: 26, color: T.gold, letterSpacing: 4 }}>
                MAISON<span style={{ color: T.white }}>·V</span>
            </span>

            <div style={{ display: "flex", gap: 40 }}>
                {["BỘ SƯU TẬP", "PHONG CÁCH", "NHẬT KÝ", "CỬA HÀNG"].map(n => (
                    <a key={n} data-cur href="#" style={{
                        fontFamily: F.syne, fontSize: 10, fontWeight: 700,
                        letterSpacing: 3, color: T.muted, textDecoration: "none",
                        textTransform: "uppercase", transition: "color 0.3s",
                    }}
                        onMouseEnter={e => e.target.style.color = T.gold}
                        onMouseLeave={e => e.target.style.color = T.muted}
                    >{n}</a>
                ))}
            </div>

            <span style={{
                fontFamily: F.syne, fontSize: 10, letterSpacing: 3,
                color: T.gold, fontWeight: 700, cursor: "pointer",
            }}>GIỎ (0)</span>
        </motion.nav>
    );
};

/* ══════════════════════════════════════════════════════════════
   §1  HERO — BRUTALIST OVERSIZED TYPE
   Phong cách: Chữ khổng lồ, stagger từng ký tự, ảnh parallax
══════════════════════════════════════════════════════════════ */
const Hero = () => {
    const { scrollYProgress } = useScroll();
    const imgY = useTransform(scrollYProgress, [0, 0.5], [0, 130]);
    const textY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
    const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    const line1 = "MAISON".split("");
    const line2 = "·V·".split("");

    return (
        <section style={{
            height: "100vh", background: T.black,
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <motion.div style={{ position: "absolute", inset: 0, y: imgY }}>
                <img
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop"
                    alt="Maison·V hero"
                    style={{ width: "100%", height: "120%", objectFit: "cover", objectPosition: "center top" }}
                />
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom,rgba(8,8,8,0.5) 0%,rgba(8,8,8,0.25) 40%,rgba(8,8,8,0.88) 100%)",
                }} />
            </motion.div>

            <motion.div style={{
                position: "relative", zIndex: 2, textAlign: "center", width: "100%",
                y: textY, opacity,
            }}>
                {/* Line 1 */}
                <div style={{ display: "flex", justifyContent: "center", overflow: "hidden", lineHeight: 0.82 }}>
                    {line1.map((c, i) => (
                        <motion.span key={i}
                            initial={{ y: "110%" }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: "block",
                                fontFamily: F.brutal,
                                fontSize: "clamp(80px,16vw,220px)",
                                color: T.white, letterSpacing: "0.02em",
                            }}
                        >{c}</motion.span>
                    ))}
                </div>

                {/* Line 2 gold */}
                <div style={{ display: "flex", justifyContent: "center", overflow: "hidden", lineHeight: 0.82 }}>
                    {line2.map((c, i) => (
                        <motion.span key={i}
                            initial={{ y: "110%" }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.5 + 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: "block",
                                fontFamily: F.brutal,
                                fontSize: "clamp(80px,16vw,220px)",
                                color: T.gold, letterSpacing: "0.06em",
                            }}
                        >{c}</motion.span>
                    ))}
                </div>

                <motion.p
                    initial={{ opacity: 0, letterSpacing: "0.1em" }}
                    animate={{ opacity: 1, letterSpacing: "0.55em" }}
                    transition={{ delay: 1.3, duration: 1.1 }}
                    style={{
                        fontFamily: F.clean, fontSize: 11, color: T.gold,
                        textTransform: "uppercase", marginTop: 30,
                    }}
                >Thời Trang Nữ Cao Cấp · Bộ Sưu Tập 2025</motion.p>

                <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 1.8, duration: 0.7 }}
                    style={{ width: 72, height: 1.5, background: T.gold, margin: "24px auto 0", transformOrigin: "center" }}
                />

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 2.1 }}
                    style={{ fontFamily: F.syne, fontSize: 9, letterSpacing: 5, color: T.muted, marginTop: 18 }}
                >↓  SCROLL TO EXPLORE  ↓</motion.p>
            </motion.div>

            {/* Corner labels */}
            {[["bottom", "left", "5%", "SAIGON · 2025"], ["bottom", "right", "5%", "SS25 · LIMITED"]].map(([v, h, pct, txt]) => (
                <motion.div key={txt}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    style={{
                        position: "absolute", [v]: 32, [h]: pct, zIndex: 3,
                        fontFamily: F.syne, fontSize: 9, letterSpacing: 3, color: T.muted,
                    }}
                >{txt}</motion.div>
            ))}
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   TICKER
══════════════════════════════════════════════════════════════ */
const Ticker = ({ words, reverse = false, dark = true }) => (
    <div style={{
        overflow: "hidden", padding: "13px 0",
        background: dark ? T.gold : T.black,
        borderTop: `1px solid ${dark ? T.goldD : T.border}`,
        borderBottom: `1px solid ${dark ? T.goldD : T.border}`,
    }}>
        <motion.div
            animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            style={{ display: "flex", gap: 56, whiteSpace: "nowrap" }}
        >
            {[...Array(10)].map((_, i) => (
                <span key={i} style={{
                    fontFamily: F.brutal, fontSize: 20, letterSpacing: 6,
                    color: dark ? T.black : T.gold,
                    textTransform: "uppercase",
                }}>{words.join("  ✦  ")}</span>
            ))}
        </motion.div>
    </div>
);

/* ══════════════════════════════════════════════════════════════
   §2  CINEMATIC SECTION — STICKY CLIP REVEAL
   Phong cách: Clip-path mở ra như màn hình chiếu phim
══════════════════════════════════════════════════════════════ */
const CinemaSection = ({ img, label, headline, sub, align = "left", isStacked = false }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const clip = useTransform(scrollYProgress,
        [0, 0.22, 0.78, 1],
        ["inset(48% 6% 48% 6% round 2px)",
            "inset(0% 0% 0% 0% round 0px)",
            "inset(0% 0% 0% 0% round 0px)",
            "inset(48% 0% 48% 0% round 0px)"]
    );
    const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.14, 1, 1.14]);
    const tyY = useTransform(scrollYProgress, [0.2, 0.8], [40, -40]);
    const inView = useInView(ref, { once: true, margin: "-20%" });

    const content = (
        <div ref={ref} style={{ height: isStacked ? "100%" : "190vh", position: "relative" }}>
            <motion.div style={{
                position: isStacked ? "relative" : "sticky", top: 0, height: "100vh",
                clipPath: clip, overflow: "hidden", zIndex: 5,
            }}>
                <motion.img src={img} alt={headline}
                    style={{
                        width: "100%", height: "118%", objectFit: "cover",
                        objectPosition: "center", scale: imgScale, filter: "brightness(0.5)",
                    }}
                />
                <motion.div style={{
                    position: "absolute", inset: 0, y: tyY,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end",
                    padding: "6% 7%",
                    alignItems: align === "right" ? "flex-end" : "flex-start",
                    textAlign: align === "right" ? "right" : "left",
                    background: "linear-gradient(to top,rgba(8,8,8,0.85) 0%,transparent 58%)",
                }}>
                    <motion.span
                        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.25 }}
                        style={{
                            fontFamily: F.syne, fontSize: 10, letterSpacing: 5,
                            color: T.gold, textTransform: "uppercase", marginBottom: 14,
                        }}
                    >{label}</motion.span>

                    <div style={{ overflow: "hidden" }}>
                        <motion.h2
                            initial={{ y: "100%" }} animate={inView ? { y: 0 } : {}}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                fontFamily: F.display,
                                fontSize: "clamp(44px,6.5vw,96px)",
                                fontWeight: 700, lineHeight: 0.9, margin: 0,
                                color: T.white, letterSpacing: "-0.02em",
                                whiteSpace: "pre-line",
                            }}
                        >{headline}</motion.h2>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.45, duration: 0.8 }}
                        style={{
                            fontFamily: F.clean, fontSize: 15, color: "rgba(248,244,236,0.62)",
                            lineHeight: 1.78, maxWidth: 400, marginTop: 18,
                        }}
                    >{sub}</motion.p>

                    <motion.button data-cur
                        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.65 }}
                        whileHover={{ background: T.gold, color: T.black, borderColor: T.gold }}
                        style={{
                            marginTop: 30, padding: "13px 34px",
                            border: `1px solid rgba(212,175,55,0.55)`, background: "transparent",
                            color: T.gold, fontFamily: F.syne, fontSize: 10, fontWeight: 700,
                            letterSpacing: 4, textTransform: "uppercase", cursor: "pointer",
                            transition: "all 0.4s",
                        }}
                    >Khám Phá →</motion.button>
                </motion.div>
            </motion.div>
        </div>
    );

    return isStacked ? content : content;
};

/* ══════════════════════════════════════════════════════════════
   §3  MANIFESTO — TYPOGRAPHIC STATEMENT
   Phong cách: Brutalist type mix, chữ xen kẽ italic serif + brutal
══════════════════════════════════════════════════════════════ */
const Manifesto = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-15%" });

    const lines = [
        { text: "Một bộ trang phục", italic: false, size: "clamp(28px,4.5vw,62px)" },
        { text: "không chỉ là vải vóc —", italic: true, size: "clamp(28px,4.5vw,62px)" },
        { text: "đó là ngôn ngữ", italic: false, size: "clamp(32px,5.5vw,76px)" },
        { text: "của người phụ nữ", italic: true, size: "clamp(32px,5.5vw,76px)" },
        { text: "tự kể câu chuyện mình.", italic: false, size: "clamp(26px,4vw,56px)" },
    ];

    return (
        <section ref={ref} style={{
            background: T.black, padding: "16vh 8%",
            position: "relative", overflow: "hidden",
        }}>
            {/* Giant watermark */}
            <div style={{
                position: "absolute", right: "-3%", top: "50%",
                transform: "translateY(-50%)",
                fontFamily: F.brutal, fontSize: "52vw",
                color: "transparent",
                WebkitTextStroke: `1px rgba(212,175,55,0.042)`,
                userSelect: "none", pointerEvents: "none",
                lineHeight: 1, zIndex: 0,
            }}>V</div>

            <div style={{ position: "relative", zIndex: 2 }}>
                <motion.div
                    initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8 }}
                    style={{ width: 48, height: 2, background: T.gold, marginBottom: 40, transformOrigin: "left" }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lines.map((l, i) => (
                        <div key={i} style={{ overflow: "hidden" }}>
                            <motion.p
                                initial={{ y: "115%" }}
                                animate={inView ? { y: 0 } : {}}
                                transition={{ duration: 0.85, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    fontFamily: l.italic ? F.display : F.brutal,

                                    fontStyle: l.italic ? "italic" : "normal",

                                    fontWeight: l.italic ? 400 : 700,

                                    fontSize: l.size,

                                    color: i % 2 === 0 ? T.white : T.gold,

                                    lineHeight: 1,

                                    letterSpacing: l.italic ? "0em" : "0.05em",

                                    textTransform: l.italic ? "none" : "uppercase",

                                    margin: 0,
                                }}
                            >{l.text}</motion.p>
                        </div>
                    ))}
                </div>

                <motion.p
                    initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.95 }}
                    style={{ fontFamily: F.clean, fontSize: 12, color: T.muted, marginTop: 44, letterSpacing: 2 }}
                >— MAISON·V Studio, Sài Gòn</motion.p>
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   §4  PRODUCTS — DARK LUXURY ASYMMETRIC GRID
   Phong cách: Lưới bất đối xứng, hover reveal, gold badge
══════════════════════════════════════════════════════════════ */
const ProductCard = ({ p, idx, tall = false, hovered, setHovered }) => {
    const isHov = hovered === idx;
    return (
        <motion.div data-cur
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ delay: idx * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onHoverStart={() => setHovered(idx)}
            onHoverEnd={() => setHovered(null)}
            style={{
                position: "relative", overflow: "hidden", cursor: "pointer",
                aspectRatio: tall ? "3/4.5" : "4/3",
                background: T.card,
            }}
        >
            <motion.img src={p.img} alt={p.name}
                animate={{ scale: isHov ? 1.08 : 1 }}
                transition={{ duration: 0.65 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top,rgba(8,8,8,0.92) 0%,rgba(8,8,8,0.05) 55%)",
            }} />
            {/* Badge */}
            <div style={{
                position: "absolute", top: 14, left: 14,
                background: T.gold, color: T.black,
                fontFamily: F.syne, fontSize: 9, fontWeight: 700,
                letterSpacing: 2, padding: "5px 13px", textTransform: "uppercase",
            }}>{p.badge}</div>
            {/* Info */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 20px 22px" }}>
                <h3 style={{
                    fontFamily: F.display, fontWeight: 700,
                    fontSize: "clamp(15px,1.6vw,22px)",
                    color: T.white, margin: "0 0 6px", letterSpacing: "-0.01em",
                }}>{p.name}</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.syne, fontSize: 13, color: T.gold, fontWeight: 700 }}>{p.price}</span>
                    <AnimatePresence>
                        {isHov && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                style={{
                                    fontFamily: F.syne, fontSize: 9, letterSpacing: 2,
                                    color: T.black, background: T.gold, padding: "5px 13px", textTransform: "uppercase",
                                }}
                            >+ Giỏ Hàng</motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

const Products = () => {
    const [hovered, setHovered] = useState(null);
    const items = [
        {
            name: "Váy Dạ Hội Noir", price: "4.200.000₫", badge: "Bestseller",
            img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800"
        },
        {
            name: "Blazer Ánh Kim Vàng", price: "3.600.000₫", badge: "New",
            img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800"
        },
        {
            name: "Đầm Xẻ Đen Thanh Lịch", price: "2.900.000₫", badge: "Limited",
            img: "https://images.unsplash.com/photo-1539108136881-3be0616acf4b?q=80&w=800"
        },
        {
            name: "Áo Corset Vàng Ánh", price: "1.850.000₫", badge: "Hot",
            img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=800"
        },
    ];

    return (
        <section style={{ background: T.dark, padding: "10vh 5%" }}>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                marginBottom: "5vh",
                borderBottom: `1px solid ${T.border}`, paddingBottom: "4vh",
            }}>
                <div>
                    <p style={{ fontFamily: F.syne, fontSize: 10, letterSpacing: 5, color: T.gold, textTransform: "uppercase", marginBottom: 12 }}>
                        Được Yêu Thích Nhất
                    </p>
                    <h2 style={{
                        fontFamily: F.brutal, fontSize: "clamp(44px,6vw,84px)",
                        color: T.white, margin: 0, letterSpacing: 3,
                    }}>SELECTED<span style={{ color: T.gold }}> PIECES</span></h2>
                </div>
                <a href="#" data-cur style={{
                    fontFamily: F.syne, fontSize: 10, letterSpacing: 3,
                    color: T.gold, textDecoration: "none",
                    borderBottom: `1px solid ${T.gold}`, paddingBottom: 3,
                }}>Xem Tất Cả →</a>
            </div>

            {/* Asymmetric 3-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <ProductCard p={items[1]} idx={1} hovered={hovered} setHovered={setHovered} />
                    <ProductCard p={items[2]} idx={2} hovered={hovered} setHovered={setHovered} />
                </div>
                <ProductCard p={items[0]} idx={0} tall hovered={hovered} setHovered={setHovered} />
                <ProductCard p={items[3]} idx={3} tall hovered={hovered} setHovered={setHovered} />
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   §5  BRAND DNA — HORIZONTAL SCROLL (fixed)
   Phong cách: Dark gallery dọc, scroll dọc → trượt ngang
══════════════════════════════════════════════════════════════ */
const BrandDNA = () => {
    const outerRef = useRef(null);
    const trackRef = useRef(null);
    const [slideW, setSlideW] = useState(0);

    useEffect(() => {
        const calc = () => {
            if (trackRef.current) {
                setSlideW(trackRef.current.scrollWidth - window.innerWidth);
            }
        };
        // Initial calc + slightly longer delay for layout stability
        calc();
        const timer = setTimeout(calc, 500);
        window.addEventListener("resize", calc);
        return () => {
            window.removeEventListener("resize", calc);
            clearTimeout(timer);
        };
    }, []);

    const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
    const xRaw = useTransform(scrollYProgress, [0, 1], [0, -slideW]);
    const x = useSpring(xRaw, { stiffness: 55, damping: 22, mass: 0.85 });

    const bgNum = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

    const dna = [
        {
            num: "01", label: "CRAFT",
            title: "Nghề\nThủ Công",
            body: "Mỗi sản phẩm qua tay 14 thợ may lành nghề. Không dây chuyền, không hàng loạt — chỉ có sự tỉ mỉ và tình yêu.",
            img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=700"
        },
        {
            num: "02", label: "MATERIAL",
            title: "Vải\nCao Cấp",
            body: "Lụa Mulberry, cashmere Mông Cổ, ren Chantilly nhập khẩu. Cảm giác xa xỉ ngay từ lần đầu chạm tay.",
            img: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=700"
        },
        {
            num: "03", label: "DESIGN",
            title: "Thiết Kế\nBất Tử",
            body: "Không theo mùa, không theo xu hướng. Chúng tôi thiết kế cho người phụ nữ của mọi thời đại.",
            img: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=700"
        },
        {
            num: "04", label: "FIT",
            title: "Đường Khớp\nHoàn Hảo",
            body: "Size XS đến 3XL. Chỉnh sửa miễn phí. Vì mỗi thân hình đều xứng đáng được tôn vinh.",
            img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=700"
        },
    ];

    // height = (cards + title panel) × 100vh
    const scrollH = `${(dna.length + 1) * 100}vh`;

    return (
        <section ref={outerRef} style={{ height: scrollH, position: "relative", background: T.black }}>
            <div style={{
                position: "sticky",
                top: 0,
                height: "100vh",
                width: "100%",
                overflow: "hidden",
                background: T.black,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
            }}>
                {/* Watermark */}
                <motion.div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    fontFamily: F.brutal, fontSize: "58vw", color: "transparent",
                    WebkitTextStroke: `1px rgba(212,175,55,0.038)`,
                    userSelect: "none", pointerEvents: "none", zIndex: 0, lineHeight: 1,
                    x: bgNum,
                }}>DNA</motion.div>

                <motion.div
                    ref={trackRef}
                    style={{
                        x, display: "flex", height: "100%",
                        width: "max-content", position: "relative", zIndex: 1,
                    }}
                >
                    {/* Title panel */}
                    <div style={{
                        width: "42vw", flexShrink: 0,
                        display: "flex", flexDirection: "column", justifyContent: "center",
                        padding: "0 4vw 0 7vw",
                    }}>
                        <div style={{ width: 1, height: 60, background: `linear-gradient(to bottom,transparent,${T.gold})`, marginBottom: 28 }} />
                        <p style={{ fontFamily: F.syne, fontSize: 10, letterSpacing: 5, color: T.gold, textTransform: "uppercase", marginBottom: 18 }}>
                            Giá Trị Cốt Lõi
                        </p>
                        <h2 style={{
                            fontFamily: F.brutal,
                            fontSize: "clamp(56px,7.5vw,108px)",
                            color: T.white, margin: "0 0 22px",
                            lineHeight: 0.86, letterSpacing: 2,
                        }}>BRAND<br /><span style={{ color: T.gold }}>DNA</span></h2>
                        <p style={{
                            fontFamily: F.clean, fontSize: 15,
                            color: T.muted, lineHeight: 1.85, maxWidth: 270,
                        }}>Bốn nguyên tắc định hình nên mỗi sản phẩm chúng tôi tạo ra.</p>
                        <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 1, background: `linear-gradient(to right,${T.gold},transparent)` }} />
                            <span style={{ fontFamily: F.syne, fontSize: 9, letterSpacing: 3, color: T.muted, textTransform: "uppercase" }}>Cuộn xuống →</span>
                        </div>
                    </div>

                    {/* Cards */}
                    {dna.map((d, i) => (
                        <div key={i} style={{
                            width: "35vw", flexShrink: 0, height: "100%",
                            display: "flex", flexDirection: "column",
                            borderLeft: `1px solid ${T.border}`,
                        }}>
                            {/* Image 62% */}
                            <div style={{ flex: "0 0 62%", overflow: "hidden", position: "relative" }}>
                                <img src={d.img} alt={d.title}
                                    style={{ width: "100%", height: "118%", objectFit: "cover", filter: "brightness(0.48) saturate(0.75)" }} />
                                <div style={{
                                    position: "absolute", top: 24, left: 24,
                                    fontFamily: F.brutal, fontSize: 11, letterSpacing: 4, color: T.gold,
                                }}>{d.num}</div>
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0,
                                    padding: "36px 24px 18px",
                                    background: "linear-gradient(to top,rgba(8,8,8,1) 0%,transparent 100%)",
                                }}>
                                    <span style={{ fontFamily: F.syne, fontSize: 9, letterSpacing: 4, color: T.gold, textTransform: "uppercase" }}>
                                        {d.label}
                                    </span>
                                </div>
                            </div>
                            {/* Text 38% */}
                            <div style={{
                                flex: 1, padding: "26px 26px 30px",
                                display: "flex", flexDirection: "column", justifyContent: "center",
                                borderTop: `2px solid ${T.gold}`,
                            }}>
                                <h3 style={{
                                    fontFamily: F.display, fontSize: "clamp(22px,2.4vw,34px)",
                                    color: T.white, fontWeight: 700, lineHeight: 1.12,
                                    margin: "0 0 14px", whiteSpace: "pre-line", letterSpacing: "-0.01em",
                                }}>{d.title}</h3>
                                <p style={{
                                    fontFamily: F.clean, fontSize: 13.5, color: T.muted,
                                    lineHeight: 1.82, margin: 0,
                                }}>{d.body}</p>
                            </div>
                        </div>
                    ))}

                    <div style={{ width: "6vw", flexShrink: 0 }} />
                </motion.div>
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   §6  LOOKBOOK — DARK MOSAIC
   Phong cách: Mosaic ảnh tối, viền vàng xuất hiện khi hover
══════════════════════════════════════════════════════════════ */
const Lookbook = () => {
    const shots = [
        { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800", r: "span 2", c: "span 1", lbl: "Look 01" },
        { img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800", r: "span 1", c: "span 1", lbl: "Look 02" },
        { img: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=800", r: "span 1", c: "span 1", lbl: "Look 03" },
        { img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4c0a?q=80&w=800", r: "span 1", c: "span 2", lbl: "Look 04" },
    ];

    return (
        <section style={{ background: T.black, padding: "10vh 5%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "5vh" }}>
                <div>
                    <p style={{ fontFamily: F.syne, fontSize: 10, letterSpacing: 5, color: T.gold, textTransform: "uppercase", marginBottom: 10 }}>
                        Bộ Ảnh
                    </p>
                    <h2 style={{
                        fontFamily: F.display, fontStyle: "italic",
                        fontSize: "clamp(36px,5vw,72px)",
                        color: T.white, fontWeight: 700, margin: 0,
                    }}>Lookbook <span style={{ color: T.gold, fontStyle: "normal" }}>2025</span></h2>
                </div>
                <div style={{
                    fontFamily: F.syne, fontSize: 9, color: T.muted,
                    letterSpacing: 3, textTransform: "uppercase",
                    display: "flex", alignItems: "center", gap: 12,
                }}>
                    <div style={{ width: 30, height: 1, background: T.goldD }} />
                    Photographed in Saigon
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridAutoRows: "280px", gap: 10 }}>
                {shots.map((s, i) => (
                    <motion.div key={i} data-cur
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, margin: "-5%" }}
                        transition={{ delay: i * 0.1 }}
                        style={{ gridRow: s.r, gridColumn: s.c, position: "relative", overflow: "hidden", cursor: "pointer" }}
                    >
                        <motion.img
                            whileHover={{ scale: 1.07 }}
                            transition={{ duration: 0.6 }}
                            src={s.img} alt={s.lbl}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.7)" }}
                        />
                        <motion.div
                            initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{ position: "absolute", inset: 8, border: `1px solid ${T.gold}`, pointerEvents: "none" }}
                        />
                        <div style={{
                            position: "absolute", bottom: 14, left: 14,
                            fontFamily: F.syne, fontSize: 9, letterSpacing: 3, color: T.gold, textTransform: "uppercase",
                        }}>SS25 — {s.lbl}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   §7  NEWSLETTER — GOLD SPOTLIGHT MINIMAL
   Phong cách: Spotlight theo chuột, input sang trọng, cực tối
══════════════════════════════════════════════════════════════ */
const Newsletter = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-20%" });
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const spotX = useTransform(mx, v => v - 300);
    const spotY = useTransform(my, v => v - 300);

    const onMove = useCallback((e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
    }, [mx, my]);

    return (
        <section ref={ref} onMouseMove={onMove}
            style={{
                background: T.dark, padding: "16vh 5%",
                position: "relative", overflow: "hidden",
                borderTop: `1px solid ${T.border}`,
            }}
        >
            <motion.div style={{
                position: "absolute", width: 600, height: 600,
                borderRadius: "50%", pointerEvents: "none",
                background: `radial-gradient(circle,rgba(212,175,55,0.065) 0%,transparent 70%)`,
                x: spotX, y: spotY,
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
                <motion.div
                    initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8 }}
                    style={{ width: 48, height: 1.5, background: T.gold, margin: "0 auto 26px", transformOrigin: "center" }}
                />

                <motion.p
                    initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.2 }}
                    style={{ fontFamily: F.syne, fontSize: 10, letterSpacing: 5, color: T.gold, textTransform: "uppercase", marginBottom: 16 }}
                >Đặc Quyền Thành Viên</motion.p>

                <div style={{ overflow: "hidden", marginBottom: 14 }}>
                    <motion.h2
                        initial={{ y: "100%" }} animate={inView ? { y: 0 } : {}}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        style={{
                            fontFamily: F.brutal,
                            fontSize: "clamp(40px,6vw,82px)",
                            color: T.white, margin: 0, letterSpacing: 3,
                        }}
                    >NHẬN ƯU ĐÃI <span style={{ color: T.gold }}>10%</span></motion.h2>
                </div>

                <motion.p
                    initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 }}
                    style={{ fontFamily: F.clean, fontSize: 15, color: T.muted, lineHeight: 1.82, marginBottom: 42 }}
                >
                    Đăng ký để xem trước bộ sưu tập mới, nhận voucher 10% và bí quyết phối đồ từ stylist MAISON·V.
                </motion.p>

                <AnimatePresence mode="wait">
                    {!done ? (
                        <motion.div key="form"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ display: "flex", gap: 0, maxWidth: 490, margin: "0 auto" }}
                        >
                            <input
                                type="email" placeholder="email của bạn..."
                                value={email} onChange={e => setEmail(e.target.value)}
                                style={{
                                    flex: 1, padding: "17px 20px",
                                    background: "rgba(248,244,236,0.04)",
                                    border: `1px solid ${T.border}`, borderRight: "none",
                                    outline: "none", color: T.white,
                                    fontFamily: F.clean, fontSize: 15,
                                }}
                            />
                            <motion.button data-cur
                                whileHover={{ background: T.goldD }}
                                onClick={() => email && setDone(true)}
                                style={{
                                    padding: "17px 28px", background: T.gold,
                                    border: "none", color: T.black,
                                    fontFamily: F.syne, fontSize: 10, fontWeight: 700,
                                    letterSpacing: 3, textTransform: "uppercase", cursor: "pointer",
                                    transition: "background 0.3s",
                                }}
                            >Đăng Ký</motion.button>
                        </motion.div>
                    ) : (
                        <motion.div key="ok"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ fontFamily: F.display, fontSize: 22, fontStyle: "italic", color: T.gold, letterSpacing: 1 }}
                        >Cảm ơn! Hẹn gặp bạn trong hộp thư ✦</motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════ */
const Footer = () => (
    <footer style={{ background: T.black, padding: "10vh 5% 5vh", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "5vw", marginBottom: "8vh" }}>
            <div>
                <h2 style={{ fontFamily: F.brutal, fontSize: 32, letterSpacing: 4, color: T.gold, margin: "0 0 18px" }}>
                    MAISON<span style={{ color: T.white }}>·V</span>
                </h2>
                <p style={{ fontFamily: F.clean, fontSize: 14, color: T.muted, lineHeight: 1.9, maxWidth: 250 }}>
                    Thương hiệu thời trang nữ cao cấp. Nơi sự sang trọng gặp bản sắc cá nhân.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
                    {["IG", "FB", "TK", "PT"].map(s => (
                        <div key={s} data-cur style={{
                            width: 33, height: 33, border: `1px solid ${T.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: F.syne, fontSize: 8, color: T.muted, cursor: "pointer", letterSpacing: 1,
                            transition: "border-color .3s,color .3s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        >{s}</div>
                    ))}
                </div>
            </div>

            {[
                { h: "Khám Phá", links: ["Bộ Sưu Tập", "Hàng Mới Về", "Sale", "Lookbook"] },
                { h: "Hỗ Trợ", links: ["Hướng Dẫn Size", "Đổi Trả", "Theo Dõi Đơn", "FAQ"] },
                { h: "Liên Hệ", links: ["hello@maisonv.vn", "+84 903 456 789", "Shopee · TikTok", "TP. Hồ Chí Minh"] },
            ].map(col => (
                <div key={col.h}>
                    <h4 style={{ fontFamily: F.syne, fontSize: 9, letterSpacing: 4, color: T.gold, marginBottom: 22, textTransform: "uppercase" }}>
                        {col.h}
                    </h4>
                    {col.links.map(lk => (
                        <p key={lk} data-cur style={{
                            fontFamily: F.clean, fontSize: 13, color: T.muted,
                            margin: "10px 0", cursor: "pointer", transition: "color .25s",
                        }}
                            onMouseEnter={e => e.target.style.color = T.gold}
                            onMouseLeave={e => e.target.style.color = T.muted}
                        >{lk}</p>
                    ))}
                </div>
            ))}
        </div>

        <div style={{
            paddingTop: 26, borderTop: `1px solid ${T.dim}`,
            display: "flex", justifyContent: "space-between",
            fontFamily: F.syne, fontSize: 9, letterSpacing: 2,
            color: "rgba(248,244,236,0.18)", textTransform: "uppercase",
        }}>
            <span>© 2025 Maison·V. All rights reserved.</span>
            <span>Crafted in Saigon · Born for Vietnamese Women</span>
        </div>
    </footer>
);

/* ══════════════════════════════════════════════════════════════
   SEO
══════════════════════════════════════════════════════════════ */
const SEO = () => {
    useEffect(() => {
        document.title = "Maison·V – Thời Trang Nữ Cao Cấp | Shop Váy Áo Đẹp 2025";
        const m = (n, c, p = false) => {
            let el = document.querySelector(`meta[${p ? "property" : "name"}="${n}"]`);
            if (!el) { el = document.createElement("meta"); el.setAttribute(p ? "property" : "name", n); document.head.appendChild(el); }
            el.content = c;
        };
        m("description", "Maison·V – Shop váy đầm, áo nữ cao cấp tại TP.HCM. Chất liệu lụa, thiết kế độc quyền, phong cách sang trọng. Mua ngay SS25.");
        m("keywords", "shop váy nữ cao cấp,thời trang nữ 2025,váy đầm đẹp,áo nữ sang trọng,boutique Sài Gòn");
        m("og:title", "Maison·V – Thời Trang Nữ Cao Cấp Saigon", true);
        m("og:type", "website", true);
    }, []);
    return null;
};

/* ══════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════ */
export default function Blog() {
    return (
        <div style={{ background: T.black, color: T.white, cursor: "none", position: "relative" }}>
            <FontLoader />
            <ArticleSEO 
                article={{
                    title: "Maison·V – Thời Trang Nữ Cao Cấp | Shop Váy Áo Đẹp 2025",
                    summary: "Maison·V – Shop váy đầm, áo nữ cao cấp tại TP.HCM. Chất liệu lụa, thiết kế độc quyền, phong cách sang trọng. Mua ngay SS25.",
                    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop"
                }} 
                pageTitle="Maison·V – Thời Trang Nữ Cao Cấp | Shop Váy Áo Đẹp 2025" 
                pageDescription="Maison·V – Shop váy đầm, áo nữ cao cấp tại TP.HCM. Chất liệu lụa, thiết kế độc quyền, phong cách sang trọng. Mua ngay SS25." 
                baseUrl={window.location.origin} 
            />
            <Cursor />
            <ScrollBar />
            <Navbar />

            <h1 style={{ position: "absolute", left: -9999 }}>
                Maison·V – Shop Váy Áo Nữ Cao Cấp Sài Gòn 2025
            </h1>

            {/* §1 — BRUTALIST: chữ khổng lồ stagger từng ký tự */}
            <StackedPage zIndex={5}>
                <Hero />
            </StackedPage>

            <Ticker words={["BỘ SƯU TẬP MỚI 2025", "MAISON·V", "LUXURY FASHION", "SAIGON"]} dark />

            <StackedPage zIndex={6} height="180vh">
                <CinemaSection
                    img="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000"
                    label="Bộ Sưu Tập · SS25"
                    headline={"Bóng Đêm\nÁnh Vàng"}
                    sub="Lấy cảm hứng từ những dạ tiệc Sài Gòn thập niên 1960 — lộng lẫy, bí ẩn, và đầy sức sống. Mỗi thiết kế là một bản nhạc jazz không hồi kết."
                    align="left"
                    isStacked
                />
            </StackedPage>

            <StackedPage zIndex={7} height="180vh">
                <CinemaSection
                    img="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000"
                    label="Capsule Collection"
                    headline={"Tối Giản\nTinh Tế"}
                    sub="Khi đường nét trở thành ngôn ngữ. Khi màu đen không phải vắng mặt của màu sắc — mà là sự hiện diện của tất cả."
                    align="right"
                    isStacked
                />
            </StackedPage>

            <Ticker words={["CRAFTED WITH LOVE", "MADE IN VIETNAM", "LIMITED EDITION"]} dark={false} reverse />

            <Manifesto />

            <Products />

            <BrandDNA />

            {/* §6 — DARK MOSAIC LOOKBOOK: viền vàng hover */}
            <Lookbook />

            {/* §7 — SPOTLIGHT NEWSLETTER: spotlight theo chuột */}
            <Newsletter />

            <Footer />
        </div>
    );
}