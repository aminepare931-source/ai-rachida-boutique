import { useEffect } from "react";

/** Injects the Rachida embeddable widget on any page. Defaults to the public `demo` shop. */
export function RachidaWidget({ shop = "demo" }: { shop?: string }) {
  useEffect(() => {
    if (document.getElementById("rachida-widget-script")) return;
    const s = document.createElement("script");
    s.id = "rachida-widget-script";
    s.src = "/widget/rachida.js";
    s.dataset.shop = shop;
    s.async = true;
    s.defer = true;
    s.onerror = () => console.warn("[Rachida] widget script failed to load");
    document.body.appendChild(s);
    return () => {
      document.getElementById("rachida-widget-script")?.remove();
      document.getElementById("rachida-root")?.remove();
    };
  }, [shop]);
  return null;
}
