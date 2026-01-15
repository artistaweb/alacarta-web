import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";



export default async function ExplorarPage() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, price_level")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Explorar</h1>
        <p className="mt-4 text-red-600">
          Error cargando restaurantes: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Explorar</h1>
      <p className="mt-2 text-gray-600">
        Resultados: {data?.length ?? 0}
      </p>

      <ul className="mt-6 space-y-4">
        {data?.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <h2 className="font-semibold text-lg"><Link className="underline" href={`/r/${r.slug}`}>{r.name}</Link>
</h2>
            {r.description && (
              <p className="text-sm text-gray-600">{r.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Slug: {r.slug}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
