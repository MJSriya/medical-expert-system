import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
};

export default function Seo({ title, description, ogTitle, ogDescription }: SeoProps) {
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, attr: "name" | "property" = "name") => {
      const selector = attr === "name" ? `meta[name="${name}"]` : `meta[property="${name}"]`;
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      return el;
    };

    if (description) {
      ensureMeta("description").content = description;
    }

    ensureMeta("og:type", "property").content = "website";
    ensureMeta("og:title", "property").content = ogTitle ?? title;
    if (ogDescription ?? description) {
      ensureMeta("og:description", "property").content = ogDescription ?? description ?? "";
    }
  }, [title, description, ogTitle, ogDescription]);

  return null;
}
