/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ✅ Completely disable ESLint during production builds
        ignoreDuringBuilds: true,
    },
    typescript: {
        // ✅ Skip type checking on build (still works in dev)
        ignoreBuildErrors: true,
    },
    reactStrictMode: true,
}

module.exports = nextConfig
