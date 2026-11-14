/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Uploaded images are served through /api/images/[id]; plain <img> tags are used,
    // so the Next image optimizer is not needed.
    unoptimized: true,
  },
  eslint: {
    // Lint runs as a separate step; never block production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
