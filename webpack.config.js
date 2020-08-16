const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [{
	entry: './src/js/main.js',
	output: {
		filename: './js/main.[contenthash].js',
		path: path.resolve(__dirname, 'build')
	},
	plugins: [
		//new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/index.html',
			minify: false
		}),
		new MiniCssExtractPlugin({
			filename: 'style.[contenthash].css'
		}),
		new CopyPlugin([
			{from: './src/textures', to: path.resolve(__dirname, 'build/textures')},
			{from: './src/models', to: path.resolve(__dirname, 'build/models')},
			{from: './src/images', to: path.resolve(__dirname, 'build/images')}
		])
	],
	module: {
		rules: [
			{
				test: /\.vert|.frag|.glsl|.json$/i,
				use: 'raw-loader'
			},
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},
		]
	}
},{
	entry: './src/js/worker/worker.js',
	output: {
		filename: 'worker.js',
		path: path.resolve(__dirname, 'build/js')
	}
}];
