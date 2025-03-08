const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = (config) => {
	config.resolve.fallback = {
		path: false,
		fs: false,
		tls:false,
		os: false,
		crypto: false,
		process: false,
		util: false,
		assert: false,
		stream: false,
		zlib: false,
		url: false,
		http:false,
		https:false,
		"vm": require.resolve("vm-browserify"),
		"events": require.resolve("events/"),
		"buffer": require.resolve("buffer/"),
		"crypto": require.resolve("crypto-browserify"),
		"http": require.resolve("stream-http"),
		"https": require.resolve("https-browserify"),
		"os": require.resolve("os-browserify/browser"),
		"path": require.resolve("path-browserify"),
		"zlib": require.resolve("browserify-zlib")
	};

	if (config.mode === 'production') {
		config.plugins = [
			...config.plugins,
			new webpack.DefinePlugin({
				ngDevMode: false
			})
		];

		config.optimization = {
			...config.optimization,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						keep_classnames: /.*Wallet.*|.*Adapter.*|.*ModalController.*/,
						keep_fnames: /.*Wallet.*|.*Adapter.*|.*ModalController.*/,
					},
				}),
			],
		};
	}

	return config;
};