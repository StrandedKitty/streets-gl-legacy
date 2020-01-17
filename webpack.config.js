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
			{from: './src/css', to: __dirname + '/build/css'},
			{from: './src/textures', to: __dirname + '/build/textures'}
		])
	],
	module: {
		rules: [
			{
				test: /\.vert|.frag|.glsl|.json$/i,
				use: 'raw-loader'
			},
			/*{
				test: /\.js/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							'@babel/preset-env'
						],
						plugins: [
							'@babel/plugin-proposal-class-properties'
						]
					}
				}
			}*/
		]
	}
},{
	entry: './src/js/worker.js',
	output: {
		filename: 'worker.js',
		path: path.resolve(__dirname, 'build/js')
	}
}];