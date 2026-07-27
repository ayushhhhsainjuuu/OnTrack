/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: "standalone",
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
