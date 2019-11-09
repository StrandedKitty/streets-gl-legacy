const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
	entry: './src/js/main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'build/js')
	},
	plugins: [
		new CopyPlugin([
			{from: '*.html', to: __dirname + '/build', context: './src'},
			{from: './src/css', to: __dirname + '/build/css'}
		])
	]
},{
	entry: './src/js/worker.js',
	output: {
		filename: 'worker.js',
		path: path.resolve(__dirname, 'build/js')
	}
}];