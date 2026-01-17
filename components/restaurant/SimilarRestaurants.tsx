import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  currentId: string;
  categoryId: string | null;
};

type Row = {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  price_level: number | null;
};

export default async function SimilarRestaurants({ currentId, categoryId }: Props) {
  if (!categoryId) return null;

  // 1) Buscar IDs por pivot
  const { data: rc } = await supabase
    .from("restaurant_categories")
    .select("restaurant_id")
    .eq("category_id", categoryId);

  const ids = (rc ?? []).map((x) => x.restaurant_id).filter(Boolean).filter((id) => id !== currentId);

  if (ids.length === 0) return null;

  const { data } = await supabase
    .from("restaurants")
    .select("id,name,slug,cover_url,price_level,status")
    .in("id", ids)
    .eq("status", "active")
    .limit(6);

  const items = (data ?? []) as any as Row[];
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lugares similares</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/r/${r.slug}`}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <div className="font-medium">{r.name}</div>
            {r.price_level ? (
              <div className="text-xs text-muted-foreground">
                {"$".repeat(Math.min(4, Math.max(1, Math.round(r.price_level))))}
              </div>
            ) : null}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
