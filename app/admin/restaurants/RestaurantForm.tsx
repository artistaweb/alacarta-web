"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slug";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

type HoursEntry = {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

type RestaurantFormData = {
  restaurant: {
    name: string | null;
    slug: string | null;
    description: string | null;
    phone: string | null;
    website: string | null;
    cover_url: string | null;
    price_level: number | null;
    status: string | null;
  };
  location: {
    address: string | null;
    municipio: string | null;
    zone: string | null;
    lat: number | null;
    lng: number | null;
  };
  hours: HoursEntry[];
};

type RestaurantFormProps = {
  initialData: RestaurantFormData;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export default function RestaurantForm({
  initialData,
  action,
  submitLabel,
}: RestaurantFormProps) {
  const [name, setName] = useState(initialData.restaurant.name ?? "");
  const [slug, setSlug] = useState(initialData.restaurant.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(
    Boolean(initialData.restaurant.slug)
  );

  const orderedHours = useMemo(() => {
    const byDay = new Map(
      initialData.hours.map((entry) => [entry.day_of_week, entry])
    );

    return days.map((day) => {
      const entry = byDay.get(day.value);
      return {
        day_of_week: day.value,
        is_closed: entry?.is_closed ?? false,
        opens_at: formatTime(entry?.opens_at ?? null),
        closes_at: formatTime(entry?.closes_at ?? null),
      };
    });
  }, [initialData.hours]);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Restaurante</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugTouched) {
                  setSlug(slugify(nextName));
                }
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialData.restaurant.phone ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData.restaurant.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initialData.restaurant.website ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_url">Cover URL</Label>
            <Input
              id="cover_url"
              name="cover_url"
              type="url"
              defaultValue={initialData.restaurant.cover_url ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_level">Precio</Label>
            <Select
              id="price_level"
              name="price_level"
              defaultValue={String(initialData.restaurant.price_level ?? 2)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              id="status"
              name="status"
              defaultValue={initialData.restaurant.status ?? "draft"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación principal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData.location.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input
              id="municipio"
              name="municipio"
              defaultValue={initialData.location.municipio ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone">Zona</Label>
            <Input
              id="zone"
              name="zone"
              defaultValue={initialData.location.zone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lat">Lat</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="0.000001"
              defaultValue={initialData.location.lat ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Lng</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="0.000001"
              defaultValue={initialData.location.lng ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horario semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderedHours.map((entry, index) => (
            <div
              key={entry.day_of_week}
              className="grid gap-3 rounded-lg border px-3 py-3 md:grid-cols-[120px_1fr_1fr_120px] md:items-center"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {days[index].label}
              </p>
              <div className="flex items-center gap-2">
                <input
                  id={`hours_${entry.day_of_week}_is_closed`}
                  name={`hours_${entry.day_of_week}_is_closed`}
                  type="checkbox"
                  defaultChecked={entry.is_closed}
                  className="h-4 w-4 rounded border border-input"
                />
                <Label htmlFor={`hours_${entry.day_of_week}_is_closed`}>
                  Cerrado
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`hours_${entry.day_of_week}_opens_at`}>
                  Abre
                </Label>
                <Input
                  id={`hours_${entry.day_of_week}_opens_at`}
                  name={`hours_${entry.day_of_week}_opens_at`}
                  type="time"
                  defaultValue={entry.opens_at}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`hours_${entry.day_of_week}_closes_at`}>
                  Cierra
                </Label>
                <Input
                  id={`hours_${entry.day_of_week}_closes_at`}
                  name={`hours_${entry.day_of_week}_closes_at`}
                  type="time"
                  defaultValue={entry.closes_at}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
