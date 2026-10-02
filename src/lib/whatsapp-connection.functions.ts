import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwnsShop(supabase: any, userId: string, shopId: string) {
  const { data: shops, error } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", userId)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!shops?.[0]) throw new Error("Boutique introuvable ou non autorisée");
}

export const getWhatsAppConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ shopId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsShop(supabase, userId, data.shopId);
    const { data: rows, error } = await supabase
      .from("whatsapp_connections")
      .select("phone_number_id, display_phone_number, status, created_at")
      .eq("shop_id", data.shopId)
      .limit(1);
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const connectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        shopId: z.string().uuid(),
        phoneNumberId: z.string().min(3),
        accessToken: z.string().min(10),
        wabaId: z.string().optional(),
        displayPhoneNumber: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsShop(supabase, userId, data.shopId);

    const { error } = await supabase.from("whatsapp_connections").upsert(
      {
        shop_id: data.shopId,
        phone_number_id: data.phoneNumberId,
        access_token: data.accessToken,
        waba_id: data.wabaId ?? null,
        display_phone_number: data.displayPhoneNumber ?? null,
        status: "connected",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ shopId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsShop(supabase, userId, data.shopId);
    const { error } = await supabase.from("whatsapp_connections").delete().eq("shop_id", data.shopId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
