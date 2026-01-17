import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Picsum (mock / placeholders)
      {
        protocol: "https",
        hostname: "picsum.photos",
      },

      // Supabase Storage (covers, galleries, etc.)
      {
        protocol: "https",
        hostname: "thwpabcccedvqboyxlll.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // (opcional pero recomendado si tendrás varios proyectos)
      // {
      //   protocol: "https",
      //   hostname: "*.supabase.co",
      // },
    ],
  },
};

export default nextConfig;
