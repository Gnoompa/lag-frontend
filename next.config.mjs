/** @type {import('next').NextConfig} */
const nextConfig = {
    // swcMinify: false,
    distDir: "./build",
    reactStrictMode: true,
    // webpack: (config, { buildId, dev }) => {
    //     config.resolve.symlinks = false
    //     return config
    // },
    transpilePackages: ['lag-types/*']
};

export default nextConfig;
