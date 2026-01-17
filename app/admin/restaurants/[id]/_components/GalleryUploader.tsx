"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { optimizeGalleryImage } from "@/lib/images/optimize";
import { createBrowserClient } from "@/lib/supabase/browser";

type GalleryImage = {
  id: string;
  url: string;
  path: string;
  sort_order: number | null;
};

type GalleryUploaderProps = {
  restaurantId: string;
  initialImages: GalleryImage[];
};

const MAX_IMAGES = 6;

export default function GalleryUploader({
  restaurantId,
  initialImages,
}: GalleryUploaderProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const aOrder = a.sort_order ?? 0;
      const bOrder = b.sort_order ?? 0;
      if (aOrder === bOrder) return 0;
      return aOrder - bOrder;
    });
  }, [images]);

  const canAddMore = images.length < MAX_IMAGES;

  async function handleFilesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    const supabase = createBrowserClient();

    let nextOrder =
      Math.max(0, ...images.map((image) => image.sort_order ?? 0)) + 1;

    const uploaded: GalleryImage[] = [];

    try {
      for (const file of files) {
        if (images.length + uploaded.length >= MAX_IMAGES) {
          break;
        }
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const optimized = await optimizeGalleryImage(file);
        const fileId = crypto.randomUUID();
        const path = `gallery/${restaurantId}/${fileId}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("restaurant-images")
          .upload(path, optimized, {
            upsert: true,
            contentType: "image/webp",
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from("restaurant-images")
          .getPublicUrl(path);

        const publicUrl = publicData.publicUrl;

        const { data: inserted, error: insertError } = await supabase
          .from("restaurant_gallery_images")
          .insert({
            restaurant_id: restaurantId,
            url: publicUrl,
            path,
            sort_order: nextOrder,
          })
          .select("id, url, path, sort_order")
          .single();

        if (insertError || !inserted) {
          throw insertError;
        }

        uploaded.push(inserted);
        nextOrder += 1;
      }

      setImages((prev) => [...prev, ...uploaded]);
      event.target.value = "";
    } catch (uploadError) {
      setError("No se pudieron subir las imagenes.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(image: GalleryImage) {
    setIsUploading(true);
    setError(null);
    const supabase = createBrowserClient();

    const { error: storageError } = await supabase.storage
      .from("restaurant-images")
      .remove([image.path]);

    if (storageError) {
      setError("No se pudo eliminar la imagen.");
      setIsUploading(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("restaurant_gallery_images")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError("No se pudo eliminar la imagen.");
      setIsUploading(false);
      return;
    }

    setImages((prev) => prev.filter((item) => item.id !== image.id));
    setIsUploading(false);
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sortedImages.length) return;

    const reordered = [...sortedImages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    const normalized = reordered.map((image, idx) => ({
      ...image,
      sort_order: idx + 1,
    }));

    setImages(normalized);

    const supabase = createBrowserClient();
    await Promise.all(
      normalized.map((image) =>
        supabase
          .from("restaurant_gallery_images")
          .update({ sort_order: image.sort_order })
          .eq("id", image.id)
      )
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galeria (maximo 6)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={!canAddMore || isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore || isUploading}
          >
            {canAddMore
              ? "Anadir fotos"
              : "Limite alcanzado"}
          </Button>
        </div>

        {error && <p className="text-sm text-muted-foreground">{error}</p>}

        {sortedImages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay imagenes en la galeria.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-md border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Imagen de galeria"
                  className="h-40 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 p-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0 || isUploading}
                    >
                      Arriba
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === sortedImages.length - 1 || isUploading}
                    >
                      Abajo
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image)}
                    disabled={isUploading}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
