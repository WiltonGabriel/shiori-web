import { useEffect } from "react";

export function useDocumentTitle(title: string, description?: string): void {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Shiori` : "Shiori — Seu Catálogo e Diário de Leituras";

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description]);
}
