import { redirect } from "next/navigation";

import RestaurantForm from "@/app/admin/restaurants/RestaurantForm";
import { slugify } from "@/lib/slug";
import { createServerComponentClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const days = [0, 1, 2, 3, 4, 5, 6];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toNullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerComponentClient>
>;

async function upsertPrimaryLocation(
  supabase: ServerSupabaseClient,
  restaurantId: string,
  payload: {
    address: string | null;
    municipio: string | null;
    zone: string | null;
    lat: number | null;
    lng: number | null;
  }
) {
  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_primary", true)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("locations")
      .update({ ...payload, is_primary: true })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("locations").insert({
    restaurant_id: restaurantId,
    is_primary: true,
    ...payload,
  });
}

export default async function NewRestaurantPage() {
  async function createRestaurant(formData: FormData) {
    "use server";

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const name = getString(formData, "name");
    const slugInput = getString(formData, "slug");
    const slug = slugInput || slugify(name);

    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert({
        name,
        slug,
        description: toNullable(getString(formData, "description")),
        phone: toNullable(getString(formData, "phone")),
        website: toNullable(getString(formData, "website")),
        cover_url: toNullable(getString(formData, "cover_url")),
        price_level: parseInteger(getString(formData, "price_level"), 2),
        status: getString(formData, "status") || "draft",
      })
      .select("id")
      .single();

    if (error || !restaurant) {
      throw error;
    }

    await upsertPrimaryLocation(supabase, restaurant.id, {
      address: toNullable(getString(formData, "address")),
      municipio: toNullable(getString(formData, "municipio")),
      zone: toNullable(getString(formData, "zone")),
      lat: parseNumber(getString(formData, "lat")),
      lng: parseNumber(getString(formData, "lng")),
    });

    const hoursPayload = days.map((day) => {
      const isClosed = Boolean(formData.get(`hours_${day}_is_closed`));
      const opensAt = getString(formData, `hours_${day}_opens_at`);
      const closesAt = getString(formData, `hours_${day}_closes_at`);

      return {
        restaurant_id: restaurant.id,
        day_of_week: day,
        is_closed: isClosed,
        opens_at: isClosed ? null : toNullable(opensAt),
        closes_at: isClosed ? null : toNullable(closesAt),
      };
    });

    await supabase
      .from("restaurant_hours")
      .upsert(hoursPayload, { onConflict: "restaurant_id,day_of_week" });

    redirect(`/admin/restaurants/${restaurant.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Nuevo
        </p>
        <h2 className="text-2xl font-semibold">Crear restaurante</h2>
      </div>
      <RestaurantForm
        action={createRestaurant}
        submitLabel="Guardar"
        initialData={{
          restaurant: {
            name: "",
            slug: "",
            description: "",
            phone: "",
            website: "",
            cover_url: "",
            price_level: 2,
            status: "draft",
          },
          location: {
            address: "",
            municipio: "",
            zone: "",
            lat: null,
            lng: null,
          },
          hours: days.map((day) => ({
            day_of_week: day,
            is_closed: false,
            opens_at: null,
            closes_at: null,
          })),
        }}
      />
    </div>
  );
}
