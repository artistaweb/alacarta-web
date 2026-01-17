"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoriesEditor from "@/app/admin/restaurants/[id]/_components/CategoriesEditor";
import CoverUploader from "@/app/admin/restaurants/[id]/_components/CoverUploader";
import GalleryUploader from "@/app/admin/restaurants/[id]/_components/GalleryUploader";
import GeneralForm from "@/app/admin/restaurants/[id]/_components/GeneralForm";
import HoursForm from "@/app/admin/restaurants/[id]/_components/HoursForm";
import LocationForm from "@/app/admin/restaurants/[id]/_components/LocationForm";

type HoursEntry = {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type GalleryImage = {
  id: string;
  url: string;
  path: string;
  sort_order: number | null;
};

type RestaurantEditorProps = {
  restaurantId: string;
  coverUrl: string | null;
  restaurant: {
    name: string | null;
    slug: string | null;
    description: string | null;
    phone: string | null;
    website: string | null;
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
  categories: Category[];
  assignedCategoryIds: string[];
  galleryImages: GalleryImage[];
  updateGeneral: (formData: FormData) => Promise<void>;
  updateLocation: (formData: FormData) => Promise<void>;
  updateHours: (formData: FormData) => Promise<void>;
};

export default function RestaurantEditor({
  restaurantId,
  coverUrl,
  restaurant,
  location,
  hours,
  categories,
  assignedCategoryIds,
  galleryImages,
  updateGeneral,
  updateLocation,
  updateHours,
}: RestaurantEditorProps) {
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(coverUrl);

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="flex w-full flex-wrap justify-start gap-2">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="categorias">Categorias</TabsTrigger>
        <TabsTrigger value="horarios">Horarios</TabsTrigger>
        <TabsTrigger value="ubicacion">Ubicacion</TabsTrigger>
        <TabsTrigger value="fotos">Fotos</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <CoverUploader
          restaurantId={restaurantId}
          coverUrl={currentCoverUrl}
          onUploaded={setCurrentCoverUrl}
        />
        <GeneralForm initialData={restaurant} action={updateGeneral} />
      </TabsContent>

      <TabsContent value="categorias">
        <CategoriesEditor
          restaurantId={restaurantId}
          categories={categories}
          assignedCategoryIds={assignedCategoryIds}
        />
      </TabsContent>

      <TabsContent value="horarios">
        <HoursForm initialData={hours} action={updateHours} />
      </TabsContent>

      <TabsContent value="ubicacion">
        <LocationForm initialData={location} action={updateLocation} />
      </TabsContent>

      <TabsContent value="fotos" className="space-y-6">
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          Sube una foto del plato estrella o bebida iconica. Evita logos,
          fachadas, rotulos.
        </div>
        <CoverUploader
          restaurantId={restaurantId}
          coverUrl={currentCoverUrl}
          onUploaded={setCurrentCoverUrl}
        />
        <GalleryUploader
          restaurantId={restaurantId}
          initialImages={galleryImages}
        />
      </TabsContent>
    </Tabs>
  );
}
