"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { optimizeCoverImage } from "@/lib/images/optimize";
import { createBrowserClient } from "@/lib/supabase/browser";

type CoverUploaderProps = {
  restaurantId: string;
  coverUrl: string | null;
  onUploaded: (url: string) => void;
};

export default function CoverUploader({
  restaurantId,
  coverUrl,
  onUploaded,
}: CoverUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(coverUrl);

  useEffect(() => {
    setPreviewUrl(coverUrl);
  }, [coverUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const optimized = await optimizeCoverImage(file);
      const path = `covers/${restaurantId}/cover.webp`;
      const supabase = createBrowserClient();

      const { error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(path, optimized, {
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
        }

      const { data: publicData } = supabase.storage
        .from("restaurant-images")
        .getPublicUrl(path);

      const publicUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ cover_url: publicUrl })
        .eq("id", restaurantId);

      if (updateError) {
        throw updateError;
      }

      setPreviewUrl(publicUrl);
      onUploaded(publicUrl);
      event.target.value = "";
    } catch (uploadError) {
      setError("No se pudo subir el cover. Intenta nuevamente.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Cover actual"
              className="h-48 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            No hay cover cargado.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <span className="text-sm text-muted-foreground">
            {isUploading ? "Subiendo..." : "Selecciona una imagen para subir."}
          </span>
        </div>

        {error && <p className="text-sm text-muted-foreground">{error}</p>}
      </CardContent>
    </Card>
  );
}
