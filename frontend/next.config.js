/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
      {
        source: '/proxy/:path*',
        destination: 'http://127.0.0.1:8000/proxy/:path*',
      },
      {
        source: '/search/:path*',
        destination: 'http://127.0.0.1:8000/search/:path*',
      },
      {
        source: '/validate/:path*',
        destination: 'http://127.0.0.1:8000/validate/:path*',
      },
      {
        source: '/enrich/:path*',
        destination: 'http://127.0.0.1:8000/enrich/:path*',
      },
      {
        source: '/discovery/:path*',
        destination: 'http://127.0.0.1:8000/discovery/:path*',
      },
      {
        source: '/proxies/:path*',
        destination: 'http://127.0.0.1:8000/proxies/:path*',
      },
      {
        source: '/scrape',
        destination: 'http://127.0.0.1:8000/scrape',
      },
      {
        source: '/swarm',
        destination: 'http://127.0.0.1:8000/swarm',
      },
      {
        source: '/health',
        destination: 'http://127.0.0.1:8000/health',
      },
    ];
  },
};

module.exports = nextConfig;
