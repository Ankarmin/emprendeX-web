import type { NextConfig } from "next";

function resolveAllowedDevOrigins() {
  return Array.from(
    new Set(
      (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .flatMap(resolveAllowedDevOriginValues)
        .filter(Boolean),
    ),
  );
}

function resolveAllowedDevOriginValues(origin: string) {
  if (!origin.includes("://")) {
    const value = origin.replace(/\/+$/, "");
    const hostname = value.split(":")[0];

    return hostname && hostname !== value ? [value, hostname] : [value];
  }

  try {
    const url = new URL(origin);

    return url.host === url.hostname
      ? [url.hostname]
      : [url.host, url.hostname];
  } catch {
    const value = origin.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const hostname = value.split(":")[0];

    return hostname && hostname !== value ? [value, hostname] : [value];
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: resolveAllowedDevOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
