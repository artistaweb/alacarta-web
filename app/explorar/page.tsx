import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function formatPriceLevel(value: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return "$".repeat(Math.min(4, Math.max(1, Math.round(numeric))));
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const catParam = resolvedSearchParams.cat;
  const selectedCategorySlug = Array.isArray(catParam)
    ? catParam[0]
    : catParam;
  const currentExplorarPath = selectedCategorySlug
    ? `/explorar?cat=${encodeURIComponent(selectedCategorySlug)}`
    : "/explorar";
  const fromParam = encodeURIComponent(currentExplorarPath);

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const selectedCategory = selectedCategorySlug
    ? categories?.find((category) => category.slug === selectedCategorySlug)
    : null;

  let restaurantIds: string[] | null = null;

  if (selectedCategorySlug && !selectedCategory) {
    restaurantIds = [];
  } else if (selectedCategory) {
    const { data: categoryLinks } = await supabase
      .from("restaurant_categories")
      .select("restaurant_id")
      .eq("category_id", selectedCategory.id);

    restaurantIds = (categoryLinks ?? [])
      .map((row) => row.restaurant_id)
      .filter((id): id is string => Boolean(id));
  }

  if (categoriesError) {
    console.error("Error cargando categorías:", categoriesError.message);
  }

  const restaurantsQuery = supabase
    .from("restaurants")
    .select("id, name, slug, description, price_level, cover_url")
    .order("created_at", { ascending: false })
    .limit(25);

  if (selectedCategory && restaurantIds && restaurantIds.length > 0) {
    restaurantsQuery.in("id", restaurantIds);
  }

  const shouldSkipRestaurants =
    selectedCategorySlug && restaurantIds && restaurantIds.length === 0;

  const { data, error } = shouldSkipRestaurants
    ? { data: [], error: null }
    : await restaurantsQuery;

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

  const displayedRestaurantIds = (data ?? []).map((restaurant) => restaurant.id);
  let restaurantCategories: Record<string, string[]> = {};

  if (displayedRestaurantIds.length > 0) {
    const { data: categoryLinks, error: categoryLinksError } = await supabase
      .from("restaurant_categories")
      .select("restaurant_id, category_id")
      .in("restaurant_id", displayedRestaurantIds);

    if (categoryLinksError) {
      console.error(
        "Error cargando categorías de restaurantes:",
        categoryLinksError.message,
      );
    } else if (categoryLinks && categoryLinks.length > 0) {
      const categoryIds = Array.from(
        new Set(
          categoryLinks
            .map((row) => row.category_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      if (categoryIds.length > 0) {
        const { data: categoryRows, error: categoryRowsError } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

        if (categoryRowsError) {
          console.error(
            "Error cargando nombres de categorías:",
            categoryRowsError.message,
          );
        } else if (categoryRows) {
          const categoryNameById = new Map(
            categoryRows.map((category) => [category.id, category.name]),
          );

          restaurantCategories = categoryLinks.reduce(
            (acc, row) => {
              if (!row.restaurant_id || !row.category_id) {
                return acc;
              }

              const name = categoryNameById.get(row.category_id);
              if (!name) {
                return acc;
              }

              const existing = acc[row.restaurant_id] ?? [];
              if (!existing.includes(name)) {
                acc[row.restaurant_id] = [...existing, name];
              }

              return acc;
            },
            {} as Record<string, string[]>,
          );
        }
      }
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-bold">Explorar</h1>
        <p className="mt-2 text-sm text-white/60">
          Resultados: {data?.length ?? 0}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/explorar"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              !selectedCategorySlug
                ? "border-white/30 bg-white/20 text-white"
                : "border-white/10 text-white/70 hover:border-white/30 hover:text-white"
            }`}
          >
            Todos
          </Link>
          {categories?.map((category) => {
            const isActive = category.slug === selectedCategorySlug;
            return (
              <Link
                key={category.id}
                href={`/explorar?cat=${category.slug}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-white/30 bg-white/20 text-white"
                    : "border-white/10 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((r) => {
            const priceLabel = formatPriceLevel(r.price_level) ?? "N/A";
            const categoryBadges = restaurantCategories[r.id] ?? [];
            const visibleCategories = categoryBadges.slice(0, 3);

            return (
              <Link
                key={r.id}
                href={`/r/${r.slug}?from=${fromParam}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-4 overflow-hidden rounded-lg bg-white/10">
                  <div className="aspect-[4/3] w-full">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
                        alt={r.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-xs uppercase tracking-wide text-white/40">
                        Sin imagen
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    {r.name}
                  </h2>
                  <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-white/80">
                    {priceLabel}
                  </span>
                </div>
                {r.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-white/70">
                    {r.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-white/40">
                    Sin descripción disponible.
                  </p>
                )}
                {visibleCategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleCategories.map((category) => (
                      <span
                        key={`${r.id}-${category}`}
                        className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/70"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <span className="mt-4 inline-flex items-center text-xs text-white/50 transition group-hover:text-white/70">
                  Ver detalle
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
