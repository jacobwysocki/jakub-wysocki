import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    /**
     * Jedna reguła dla wszystkich, bez bloków per-agent: to jest witryna-encja,
     * więc crawlery AI i LLM mają tu wchodzić tak samo jak Googlebot — po to
     * są te dane strukturalne.
     *
     * Wyjątkiem jest /api/. `GET /api/phone` oddaje numer telefonu jako JSON,
     * gdy w env jest CONTACT_PHONE, i cała ta trasa istnieje właśnie po to,
     * żeby numer nie leżał w statycznym HTML-u. Nic do niej nie linkuje, więc
     * to zabezpieczenie, a nie łatanie wycieku — ale reguła kosztuje linijkę.
     */
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
