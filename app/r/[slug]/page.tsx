// app/r/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPin,
  Phone,
  Globe,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Navigation,
  Clock,
  CalendarDays,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import SimilarRestaurants from "@/components/restaurant/SimilarRestaurants";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

type LocationRow = {
  id: string;
  address: string | null;
  municipio: string | null;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  is_primary: boolean | null;
};

type CategoryJoin = {
  categories: { id: string; name: string; slug: string } | null;
};

type HourRow = {
  day_of_week: number; // 0=Dom ... 6=Sat
  opens_at: string | null; // "HH:MM:SS" o "HH:MM"
  closes_at: string | null;
  is_closed: boolean;
};

type GalleryRow = {
  id: string;
  url: string;
  sort_order: number | null;
  created_at: string;
};

type MetadataProps = { params: Promise<{ slug: string }> };

const fallbackDescription = "Guía gastronómica de Puerto Rico";

function formatPriceLevel(value: number | null) {
  if (!value || value <= 0) return null;
  const clamped = Math.min(4, Math.max(1, Math.round(value)));
  return "$".repeat(clamped);
}

function buildGoogleMapsUrl(args: {
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
}) {
  const { lat, lng, query } = args;

  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  const q = (query ?? "").trim();
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null;
}

/** Helpers Horario (Puerto Rico, 12h AM/PM) */
function formatTime12h(time: string) {
  const [hh, mm] = time.split(":");
  let hour = Number(hh);
  const minute = Number(mm);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function minutesSinceMidnight(time: string) {
  const [hh, mm] = time.split(":");
  return Number(hh) * 60 + Number(mm);
}

function getPRNowParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dayOfWeek: dayMap[weekday] ?? 0,
    minutesNow: hour * 60 + minute,
  };
}

function getOpenStatus(hours: HourRow[] | null | undefined) {
  if (!hours || hours.length === 0) {
    return {
      hasHours: false,
      isOpen: null as boolean | null,
      label: "Horario no disponible",
      detail: "Añade horarios para mostrar Abierto/Cerrado.",
    };
  }

  const { dayOfWeek, minutesNow } = getPRNowParts();
  const today = hours.find((h) => h.day_of_week === dayOfWeek);

  if (!today || today.is_closed || !today.opens_at || !today.closes_at) {
    return {
      hasHours: true,
      isOpen: false,
      label: "Cerrado",
      detail: "Hoy no está disponible.",
    };
  }

  const openMin = minutesSinceMidnight(today.opens_at);
  const closeMin = minutesSinceMidnight(today.closes_at);

  const isOpen = minutesNow >= openMin && minutesNow < closeMin;

  if (isOpen) {
    return {
      hasHours: true,
      isOpen: true,
      label: "Abierto ahora",
      detail: `Cierra a las ${formatTime12h(today.closes_at)}.`,
    };
  }

  if (minutesNow < openMin) {
    return {
      hasHours: true,
      isOpen: false,
      label: "Cerrado",
      detail: `Abre a las ${formatTime12h(today.opens_at)}.`,
    };
  }

  return {
    hasHours: true,
    isOpen: false,
    label: "Cerrado",
    detail: `Cerró a las ${formatTime12h(today.closes_at)}.`,
  };
}

function getTodaySchedule(hours: HourRow[] | null | undefined) {
  if (!hours || hours.length === 0) return null;

  const { dayOfWeek } = getPRNowParts();
  const today = hours.find((h) => h.day_of_week === dayOfWeek);

  if (!today || today.is_closed || !today.opens_at || !today.closes_at) {
    return "Cerrado hoy";
  }

  return `${formatTime12h(today.opens_at)} – ${formatTime12h(today.closes_at)}`;
}

function dayLabelEs(dow: number) {
  switch (dow) {
    case 0:
      return "Dom";
    case 1:
      return "Lun";
    case 2:
      return "Mar";
    case 3:
      return "Mié";
    case 4:
      return "Jue";
    case 5:
      return "Vie";
    case 6:
      return "Sáb";
    default:
      return String(dow);
  }
}

function getWeeklyScheduleLines(hours: HourRow[]) {
  if (!hours || hours.length === 0) return [];
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  return sorted.map((h) => {
    const label = dayLabelEs(h.day_of_week);
    if (h.is_closed || !h.opens_at || !h.closes_at) return `${label}: Cerrado`;
    return `${label}: ${formatTime12h(h.opens_at)} – ${formatTime12h(h.closes_at)}`;
  });
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("restaurants")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data?.name) {
    return {
      title: "A la Carta",
      description: fallbackDescription,
    };
  }

  return {
    title: `${data.name} | A la Carta`,
    description: data.description?.trim() || fallbackDescription,
  };
}

export default async function RestaurantPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const fromParam = resolvedSearchParams.from;
  const backPath = Array.isArray(fromParam) ? fromParam[0] : fromParam;

  const backHref =
    typeof backPath === "string" && backPath.startsWith("/explorar")
      ? backPath
      : "/explorar";

  // Restaurante base + relaciones (categorías + galería)
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select(
      `
      id,
      name,
      slug,
      description,
      phone,
      website,
      price_level,
      cover_url,
      status,
      locations (
        address,
        municipio,
        zone,
        lat,
        lng,
        is_primary
      ),
      restaurant_categories (
        categories (
          id,
          name,
          slug
        )
      ),
      restaurant_gallery_images (
        id,
        url,
        sort_order,
        created_at
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-3 text-sm text-red-500">{error.message}</p>
        <Link className="mt-6 inline-flex text-sm underline" href={backHref}>
          Volver
        </Link>
      </main>
    );
  }

  if (!restaurant) notFound();

  const categories =
    (restaurant.restaurant_categories as CategoryJoin[] | null | undefined)
      ?.map((rc) => rc.categories)
      .filter(Boolean) ?? [];

  // Mantener una categoría "principal" solo para SimilarRestaurants (no para UI)
  const primaryCategory = categories[0] ?? null;

  const gallery = ((restaurant as any).restaurant_gallery_images ?? []) as GalleryRow[];
  const sortedGallery = gallery
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Ubicación primaria (consulta independiente; puedes optimizar luego usando restaurant.locations)
  const { data: locations, error: locError } = await supabase
    .from("locations")
    .select("id,address,municipio,zone,lat,lng,is_primary")
    .eq("restaurant_id", restaurant.id)
    .order("is_primary", { ascending: false });

  if (locError) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="mt-3 text-sm text-red-500">{locError.message}</p>
        <Link className="mt-6 inline-flex text-sm underline" href={backHref}>
          Volver
        </Link>
      </main>
    );
  }

  const primaryLocation: LocationRow | null =
    (locations as LocationRow[] | null)?.find((l) => l.is_primary) ??
    (locations as LocationRow[] | null)?.[0] ??
    null;

  // Horario
  const { data: hoursData } = await supabase
    .from("restaurant_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("restaurant_id", restaurant.id)
    .order("day_of_week", { ascending: true });

  const hours = (hoursData ?? []) as HourRow[];
  const openStatus = getOpenStatus(hours);
  const todaySchedule = getTodaySchedule(hours);
  const weeklyLines = getWeeklyScheduleLines(hours);

  const priceText = formatPriceLevel(restaurant.price_level ?? null);

  const mapsUrl = buildGoogleMapsUrl({
    lat: primaryLocation?.lat ?? null,
    lng: primaryLocation?.lng ?? null,
    query:
      primaryLocation?.address ??
      [primaryLocation?.municipio, primaryLocation?.zone]
        .filter(Boolean)
        .join(", ") ??
      restaurant.name,
  });

  const hasCoords =
    typeof primaryLocation?.lat === "number" &&
    Number.isFinite(primaryLocation.lat) &&
    typeof primaryLocation?.lng === "number" &&
    Number.isFinite(primaryLocation.lng);

  const actionsCount = [restaurant.phone, restaurant.website, mapsUrl].filter(Boolean).length;
  const actionsCols =
    actionsCount <= 1 ? "sm:grid-cols-1" : actionsCount === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <TooltipProvider>
          {/* Back Button */}
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Volver a Explorar
            </Link>
          </Button>

          {/* Hero */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            {restaurant.cover_url ? (
              <div className="relative aspect-[21/9] w-full overflow-hidden">
                <Image
                  src={restaurant.cover_url}
                  alt={restaurant.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1200px"
                />
              </div>
            ) : (
              <div className="aspect-[21/9] w-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
              <div className="p-8 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {categories.length > 0 ? (
                    <>
                      {categories.slice(0, 3).map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="bg-white/90 text-black hover:bg-white"
                        >
                          {c.name}
                        </Badge>
                      ))}
                      {categories.length > 3 ? (
                        <Badge
                          variant="outline"
                          className="bg-white/20 text-white border-white/30"
                        >
                          +{categories.length - 3}
                        </Badge>
                      ) : null}
                    </>
                  ) : null}

                  {priceText ? (
                    <Badge variant="outline" className="bg-white/90 text-black border-white/50">
                      {priceText}
                    </Badge>
                  ) : null}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {restaurant.name}
                </h1>

                {(primaryLocation?.municipio || primaryLocation?.zone) ? (
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">
                      {[primaryLocation.municipio, primaryLocation.zone].filter(Boolean).join(", ")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              {actionsCount > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className={`grid grid-cols-1 ${actionsCols} gap-4`}>
                      {restaurant.phone ? (
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                          <a href={`tel:${restaurant.phone}`}>
                            <Phone className="h-5 w-5" />
                            <span className="text-sm">Llamar</span>
                          </a>
                        </Button>
                      ) : null}

                      {restaurant.website ? (
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                          <a href={restaurant.website} target="_blank" rel="noreferrer">
                            <Globe className="h-5 w-5" />
                            <span className="text-sm">Website</span>
                          </a>
                        </Button>
                      ) : null}

                      {mapsUrl ? (
                        <Button className="h-auto py-4 flex-col gap-2" asChild>
                          <a href={mapsUrl} target="_blank" rel="noreferrer">
                            <Navigation className="h-5 w-5" />
                            <span className="text-sm">Cómo llegar</span>
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Description */}
              {restaurant.description?.trim() ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre este lugar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {restaurant.description.trim()}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Gallery */}
              {sortedGallery.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Galería</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {sortedGallery.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl border"
                        >
                          <Image
                            src={img.url}
                            alt={`${restaurant.name} - foto`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Ubicación
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {primaryLocation?.address ? (
                    <div>
                      <p className="font-medium mb-1">Dirección</p>
                      <p className="text-muted-foreground">{primaryLocation.address}</p>
                      {(primaryLocation.municipio || primaryLocation.zone) ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          {[primaryLocation.municipio, primaryLocation.zone].filter(Boolean).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {hasCoords ? (
                    <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                      <iframe
                        title={`Mapa de ${restaurant.name}`}
                        className="h-full w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${primaryLocation!.lat},${primaryLocation!.lng}&z=15&output=embed`}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Este lugar aún no tiene coordenadas guardadas. Puedes abrirlo en Google Maps para navegación.
                    </p>
                  )}

                  {mapsUrl ? (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Abrir en Google Maps
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              {/* Similar */}
              <SimilarRestaurants currentId={restaurant.id} categoryId={primaryCategory?.id ?? null} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Información</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Horario / Abierto-Cerrado + Tooltip horario semanal */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Horario</p>

                        {openStatus.hasHours && openStatus.isOpen === true ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                          >
                            Abierto
                          </Badge>
                        ) : openStatus.hasHours && openStatus.isOpen === false ? (
                          <Badge
                            variant="outline"
                            className="bg-red-500/15 text-red-300 border-red-500/25"
                          >
                            Cerrado
                          </Badge>
                        ) : null}

                        {/* Tooltip: Ver horario semanal */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                              aria-label="Ver horario semanal"
                            >
                              <CalendarDays className="h-3.5 w-3.5" />
                              Ver
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-medium">Horario semanal</div>
                              <div className="text-xs text-muted-foreground">
                                {weeklyLines.length > 0
                                  ? weeklyLines.join(" • ")
                                  : "No hay horarios guardados."}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <p className="text-sm text-muted-foreground">{openStatus.label}</p>

                      {todaySchedule ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Horario hoy: {todaySchedule}
                        </p>
                      ) : null}

                      {openStatus.detail ? (
                        <p className="text-xs text-muted-foreground mt-1">{openStatus.detail}</p>
                      ) : null}
                    </div>
                  </div>

                  <Separator />

                  {/* Categorías (multiple) */}
                  {categories.length > 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Categorías</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {categories.map((c) => (
                            <Badge key={c.id} variant="outline">
                              {c.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {priceText ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Precio</p>
                        <p className="text-sm text-muted-foreground">{priceText}</p>
                      </div>
                    </div>
                  ) : null}

                  {(primaryLocation?.municipio || primaryLocation?.zone) ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Zona</p>
                        <p className="text-sm text-muted-foreground">
                          {[primaryLocation.municipio, primaryLocation.zone].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <Separator />

                  {restaurant.phone ? (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Teléfono</p>
                        <a
                          href={`tel:${restaurant.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {restaurant.phone}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {restaurant.website ? (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Website</p>
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          Visitar sitio web
                        </a>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </aside>
          </div>
        </TooltipProvider>
      </div>
    </main>
  );
}
