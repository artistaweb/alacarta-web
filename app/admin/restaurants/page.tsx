import RestaurantsTable from "@/app/admin/restaurants/RestaurantsTable";
import { createServerComponentClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  const supabase = await createServerComponentClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <RestaurantsTable initialRestaurants={restaurants ?? []} />
  );
}
