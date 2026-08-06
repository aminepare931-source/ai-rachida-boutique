import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type RachidaMode = "storefront" | "platform" | "admin";

declare global {
  interface Window {
    RachidaWidgetConfig?: { mode: RachidaMode; avatarUrl: string };
    RachidaGetAuthToken?: () => Promise<string | null>;
    RachidaOpen?: (message?: string) => void;
  }
}

/** Injects the Rachida embeddable widget on any page. Defaults to the public `demo` shop. */
export function RachidaWidget({ shop = "demo", mode = "storefront" }: { shop?: string; mode?: RachidaMode }) {
  useEffect(() => {
    document.getElementById("rachida-widget-script")?.remove();
    document.getElementById("rachida-root")?.remove();

    window.RachidaWidgetConfig = { mode, avatarUrl: "/rachida-avatar.png" };
    if (mode === "admin") {
      window.RachidaGetAuthToken = async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      };
    } else {
      delete window.RachidaGetAuthToken;
    }

    const s = document.createElement("script");
    s.id = "rachida-widget-script";
    s.src = "/widget/rachida.js";
    s.dataset.shop = shop;
    s.dataset.mode = mode;
    s.dataset.avatar = "/rachida-avatar.png";
    s.async = true;
    s.defer = true;
    s.onerror = () => console.warn("[Rachida] widget script failed to load");
    document.body.appendChild(s);
    return () => {
      document.getElementById("rachida-widget-script")?.remove();
      document.getElementById("rachida-root")?.remove();
      delete window.RachidaWidgetConfig;
      delete window.RachidaGetAuthToken;
    };
  }, [shop, mode]);
  return null;
}
