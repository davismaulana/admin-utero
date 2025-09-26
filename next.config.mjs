/** @type {import('next').NextConfig} */
const API = process.env.NEXT_PUBLIC_API_BASE_URL;

const config = {
	// NEXT/IMAGE remote sources (top-level, not inside rewrites)
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "picsum.photos" },
			{ protocol: "http", hostname: "localhost", port: "3100" },
			{ protocol: "http", hostname: "157.66.34.70", port: "3100" }, // your Nest host
			// add more CDNs/domains here if needed
		],
	},

	// URL proxying (client requests to /api/* go to your Nest server)
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${API}/:path*`,
			},
		];
	},
};

export default config;
