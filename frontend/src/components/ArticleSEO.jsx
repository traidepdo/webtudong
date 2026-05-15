import { useEffect } from "react";
import useJsonLd from "../hooks/useJsonLd";

export default function ArticleSEO({ article = null, pageTitle, pageDescription, baseUrl }) {

    useEffect(() => {
        document.title = pageTitle || article?.title || "Bài viết";

        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "description";
            document.head.appendChild(meta);
        }
        meta.content = pageDescription || article?.summary || "";
    }, [pageTitle, pageDescription, article]);

    const articleSchema = article ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.summary || pageDescription,
        image: article.image ? [article.image] : [],
        datePublished: article.published_at || new Date().toISOString(),
        dateModified: article.updated_at || article.published_at || new Date().toISOString(),
        author: [{
            "@type": "Person",
            name: article.author || "Admin"
        }],
        publisher: {
            "@type": "Organization",
            name: "Routine",
            logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/logo.png`
            }
        }
    } : null;

    useJsonLd("schema-article", articleSchema);

    return null;
}
