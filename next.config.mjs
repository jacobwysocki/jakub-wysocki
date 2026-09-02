/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wiele root layoutów nie ma wspólnego drzewa dla nieznanego URL-a.
  // Globalny 404 omija je wszystkie i pozostaje statyczny.
  experimental: { globalNotFound: true },
  // Dymek developerski Next zasłaniał treść przy wąskim viewportcie.
  devIndicators: false,
};

export default nextConfig;
