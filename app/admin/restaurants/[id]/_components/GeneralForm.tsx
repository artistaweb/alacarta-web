"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slug";

type GeneralFormProps = {
  initialData: {
    name: string | null;
    slug: string | null;
    description: string | null;
    phone: string | null;
    website: string | null;
    price_level: number | null;
    status: string | null;
  };
  action: (formData: FormData) => Promise<void>;
};

export default function GeneralForm({ initialData, action }: GeneralFormProps) {
  const [name, setName] = useState(initialData.name ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData.slug));

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
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
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialData.phone ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initialData.website ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_level">Precio</Label>
            <Select
              id="price_level"
              name="price_level"
              defaultValue={String(initialData.price_level ?? 2)}
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
              defaultValue={initialData.status ?? "draft"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit">Guardar cambios</Button>
      </div>
    </form>
  );
}
