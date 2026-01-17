import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import RestaurantEditor from "@/app/admin/restaurants/[id]/_components/RestaurantEditor";
import { slugify } from "@/lib/slug";
import { createServerComponentClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const days = [0, 1, 2, 3, 4, 5, 6];

type PageProps = {
  params: Promise<{ id: string }>;
};

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

function normalizeHours(
  hours:
    | {
        day_of_week: number;
        is_closed: boolean;
        opens_at: string | null;
        closes_at: string | null;
      }[]
    | null
) {
  const byDay = new Map(hours?.map((entry) => [entry.day_of_week, entry]));
  return days.map((day) => {
    const entry = byDay.get(day);
    return {
      day_of_week: day,
      is_closed: entry?.is_closed ?? false,
      opens_at: entry?.opens_at ?? null,
      closes_at: entry?.closes_at ?? null,
    };
  });
}

export default async function EditRestaurantPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, name, slug, description, phone, website, cover_url, price_level, status"
    )
    .eq("id", id)
    .single();

  if (!restaurant) {
    redirect("/admin/restaurants");
  }

  const { data: location } = await supabase
    .from("locations")
    .select("address, municipio, zone, lat, lng")
    .eq("restaurant_id", id)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: hours } = await supabase
    .from("restaurant_hours")
    .select("day_of_week, is_closed, opens_at, closes_at")
    .eq("restaurant_id", id);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  const { data: assignedCategories } = await supabase
    .from("restaurant_categories")
    .select("category_id")
    .eq("restaurant_id", id);

  const { data: galleryImages } = await supabase
    .from("restaurant_gallery_images")
    .select("id, url, path, sort_order, created_at")
    .eq("restaurant_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  async function updateGeneral(formData: FormData) {
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

    await supabase
      .from("restaurants")
      .update({
        name,
        slug,
        description: toNullable(getString(formData, "description")),
        phone: toNullable(getString(formData, "phone")),
        website: toNullable(getString(formData, "website")),
        price_level: parseInteger(getString(formData, "price_level"), 2),
        status: getString(formData, "status") || "draft",
      })
      .eq("id", id);

    revalidatePath(`/admin/restaurants/${id}`);
  }

  async function updateLocation(formData: FormData) {
    "use server";

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    await upsertPrimaryLocation(supabase, id, {
      address: toNullable(getString(formData, "address")),
      municipio: toNullable(getString(formData, "municipio")),
      zone: toNullable(getString(formData, "zone")),
      lat: parseNumber(getString(formData, "lat")),
      lng: parseNumber(getString(formData, "lng")),
    });

    revalidatePath(`/admin/restaurants/${id}`);
  }

  async function updateHours(formData: FormData) {
    "use server";

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const hoursPayload = days.map((day) => {
      const isClosed = Boolean(formData.get(`hours_${day}_is_closed`));
      const opensAt = getString(formData, `hours_${day}_opens_at`);
      const closesAt = getString(formData, `hours_${day}_closes_at`);

      return {
        restaurant_id: id,
        day_of_week: day,
        is_closed: isClosed,
        opens_at: isClosed ? null : toNullable(opensAt),
        closes_at: isClosed ? null : toNullable(closesAt),
      };
    });

    await supabase
      .from("restaurant_hours")
      .upsert(hoursPayload, { onConflict: "restaurant_id,day_of_week" });

    revalidatePath(`/admin/restaurants/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Editar
        </p>
        <h2 className="text-2xl font-semibold">
          {restaurant.name ?? "Restaurante"}
        </h2>
      </div>

      <RestaurantEditor
        restaurantId={id}
        coverUrl={restaurant.cover_url}
        restaurant={{
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          phone: restaurant.phone,
          website: restaurant.website,
          price_level: restaurant.price_level,
          status: restaurant.status,
        }}
        location={{
          address: location?.address ?? "",
          municipio: location?.municipio ?? "",
          zone: location?.zone ?? "",
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
        }}
        hours={normalizeHours(hours)}
        categories={categories ?? []}
        assignedCategoryIds={
          assignedCategories?.map((category) => category.category_id) ?? []
        }
        galleryImages={galleryImages ?? []}
        updateGeneral={updateGeneral}
        updateLocation={updateLocation}
        updateHours={updateHours}
      />
    </div>
  );
}
