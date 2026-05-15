/**
 * useJsonLd.js
 * Hook nhỏ — tự inject / cleanup <script type="application/ld+json"> vào <head>
 */
import { useEffect } from "react";

export default function useJsonLd(id, data) {
    useEffect(() => {
        if (!data) return;

        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement("script");
            el.type = "application/ld+json";
            el.id = id;
            document.head.appendChild(el);
        }
        el.textContent = JSON.stringify(data);

        return () => {
            const tag = document.getElementById(id);
            if (tag) tag.remove();
        };
    }, [id, JSON.stringify(data)]);
}