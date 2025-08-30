/** @type {import('next').NextConfig} */
const config = {
    async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://157.66.34.70:3100/:path*", // your Nest server
      },
    ];
  },
};

export default config;
