import { useEffect } from "react";
import useJsonLd from "../hooks/useJsonLd";

export default function WebsiteSEO({ pageTitle, pageDescription, baseUrl }) {

    useEffect(() => {
        document.title = pageTitle || "Trang chủ";

        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "description";
            document.head.appendChild(meta);
        }
        meta.content = pageDescription || "";
    }, [pageTitle, pageDescription]);

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Routine",
        url: baseUrl,
        potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/products?search={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Routine",
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+84-903-456-789",
            contactType: "Customer Service"
        }
    };

    useJsonLd("schema-website", websiteSchema);
    useJsonLd("schema-organization", organizationSchema);

    return null;
}
