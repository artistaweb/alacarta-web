import Link from "next/link";

import { createServerComponentClient } from "@/lib/supabase/server";

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

function buildExplorarHref(categorySlug?: string) {
  return categorySlug
    ? `/explorar?cat=${encodeURIComponent(categorySlug)}`
    : "/explorar";
}

function normalizeCategoryList(categories: string[]) {
  // Consistencia: orden alfabético y sin duplicados
  return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
}

function pickVisibleCategories(
  categories: string[],
  maxVisible: number,
): { visible: string[]; remaining: number } {
  const visible = categories.slice(0, maxVisible);
  const remaining = Math.max(0, categories.length - visible.length);
  return { visible, remaining };
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const supabase = await createServerComponentClient();
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const catParam = resolvedSearchParams.cat;
  const selectedCategorySlug = Array.isArray(catParam) ? catParam[0] : catParam;
  const currentExplorarPath = buildExplorarHref(selectedCategorySlug);
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

  let restaurantsQuery = supabase
    .from("restaurants")
    .select("id, name, slug, description, price_level, cover_url")
    .order("created_at", { ascending: false })
    .limit(25);

  if (selectedCategory && restaurantIds && restaurantIds.length > 0) {
    restaurantsQuery = restaurantsQuery.in("id", restaurantIds);
  }

  const shouldSkipRestaurants =
    selectedCategorySlug && restaurantIds && restaurantIds.length === 0;

  const { data, error } = shouldSkipRestaurants
    ? { data: [], error: null }
    : await restaurantsQuery;

  if (error) {
    return (
      <main className="py-8">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          <h1 className="text-2xl font-bold">Explorar</h1>
          <p className="mt-4 text-red-600">
            Error cargando restaurantes: {error.message}
          </p>
        </div>
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

          // Normaliza: orden alfabético y sin duplicados
          for (const [rid, cats] of Object.entries(restaurantCategories)) {
            restaurantCategories[rid] = normalizeCategoryList(cats);
          }
        }
      }
    }
  }

  return (
    <main className="py-8">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-bold">Explorar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resultados: {data?.length ?? 0}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={buildExplorarHref()}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              !selectedCategorySlug
                ? "border-border bg-muted text-foreground"
                : "border-border text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Todos
          </Link>
          {categories?.map((category) => {
            const isActive = category.slug === selectedCategorySlug;
            return (
              <Link
                key={category.id}
                href={buildExplorarHref(category.slug)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-border bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:border-border hover:text-foreground"
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

            // Visible: 2 en móvil, 3 en desktop (+N si sobran)
            const { visible: mobileVisible, remaining: mobileRemaining } =
              pickVisibleCategories(categoryBadges, 2);
            const { visible: desktopVisible, remaining: desktopRemaining } =
              pickVisibleCategories(categoryBadges, 3);

            return (
              <Link
                key={r.id}
                href={`/r/${r.slug}?from=${fromParam}`}
                className="group rounded-xl border border-border bg-card p-5 transition hover:border-border hover:bg-muted"
              >
                <div className="mb-4 overflow-hidden rounded-lg bg-muted">
                  <div className="aspect-[4/3] w-full">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
                        alt={r.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-card text-xs uppercase tracking-wide text-muted-foreground/70">
                        Sin imagen
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {r.name}
                  </h2>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                    {priceLabel}
                  </span>
                </div>

                {r.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground/70">
                    Sin descripción disponible.
                  </p>
                )}

                {categoryBadges.length > 0 ? (
                  <>
                    {/* Mobile: 2 +N */}
                    <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                      {mobileVisible.map((category) => (
                        <span
                          key={`${r.id}-${category}`}
                          title={category}
                          className="h-6 max-w-[10rem] truncate rounded-full border border-border px-2 text-[11px] font-medium leading-6 text-muted-foreground"
                        >
                          {category}
                        </span>
                      ))}

                      {mobileRemaining > 0 ? (
                        <span className="h-6 rounded-full border border-border px-2 text-[11px] font-medium leading-6 text-muted-foreground">
                          +{mobileRemaining}
                        </span>
                      ) : null}
                    </div>

                    {/* Desktop: 3 +N */}
                    <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
                      {desktopVisible.map((category) => (
                        <span
                          key={`${r.id}-${category}`}
                          title={category}
                          className="h-6 max-w-[12rem] truncate rounded-full border border-border px-2 text-[11px] font-medium leading-6 text-muted-foreground"
                        >
                          {category}
                        </span>
                      ))}

                      {desktopRemaining > 0 ? (
                        <span className="h-6 rounded-full border border-border px-2 text-[11px] font-medium leading-6 text-muted-foreground">
                          +{desktopRemaining}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <span className="mt-4 inline-flex items-center text-xs text-muted-foreground transition group-hover:text-foreground/80">
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
