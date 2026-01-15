import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Location = {
  address: string | null;
  municipio: string | null;
  zone: string | null;
};

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, price_level")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-4 text-red-600">
          Error cargando restaurante: {error.message}
        </p>
      </main>
    );
  }

  if (!restaurant) notFound();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("address, municipio, zone")
    .eq("restaurant_id", restaurant.id)
    .eq("is_primary", true)
    .maybeSingle<Location>();

  if (locationError) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="mt-4 text-red-600">
          Error cargando ubicación: {locationError.message}
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{restaurant.name}</h1>
      <p className="mt-2 text-sm text-gray-600">Slug: {restaurant.slug}</p>

      {restaurant.description && (
        <p className="mt-4 text-gray-300">{restaurant.description}</p>
      )}

      {restaurant.price_level !== null && restaurant.price_level !== undefined && (
        <p className="mt-4 text-sm text-gray-500">
          Nivel de precio: {restaurant.price_level}
        </p>
      )}

      <div className="mt-8 rounded-lg border p-4">
        <p className="font-semibold">Ubicación principal</p>

        {location ? (
          <div className="mt-2 text-sm text-gray-400">
            {location.address && <p>{location.address}</p>}
            {(location.municipio || location.zone) && (
              <p>
                {[location.municipio, location.zone].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Ubicación no disponible.</p>
        )}
      </div>
    </main>
  );
}
