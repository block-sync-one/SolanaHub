const webpack = require('webpack');

module.exports = (config) => {
	// Ensure server-side build does NOT include browser-specific fallbacks
	config.target = 'node'; // Tells Webpack we're building for Node.js
	config.output.libraryTarget = 'commonjs2'; // Needed for SSR builds

	config.resolve.fallback = {
		fs: false,
		tls: false,
		os: false,
		http: false,
		https: false,
		zlib: false,
		stream: false,
		crypto: false,
		path: false
	};

	config.plugins = [
		...config.plugins,
		new webpack.DefinePlugin({
			ngDevMode: false,
			"global.GENTLY": false // Prevents some Node modules from breaking
		})
	];

	return config;
};
