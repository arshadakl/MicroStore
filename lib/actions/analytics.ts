"use server"

import { createClient } from "@/lib/supabase/server"

export async function trackWhatsAppClick(storeId: string, productId: string): Promise<void> {
  if (!storeId || !productId) return
  const supabase = await createClient()
  const { error } = await supabase.from("analytics_events").insert({
    store_id: storeId,
    product_id: productId,
    event_type: "click_whatsapp",
  })
  if (error) console.error("[trackWhatsAppClick]", error.message)
}
