const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: './src/js/main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'build/js')
	},
	plugins: [
		new CopyPlugin([
			{from: './src', to: __dirname + '/build'},
			{from: './src/css', to: __dirname + '/build/css'}
		])
	]
};