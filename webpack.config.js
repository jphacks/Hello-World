'use strict';
const webpack = require("webpack");

const config = {
  entry: ['babel-polyfill', './front/main.js'],
  output: {
    path: __dirname+ '/front/public/js/',
    publicPath: 'public/js/',
    filename: 'build.js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        sourceMap: true,
        compress: {
          drop_console: false
        },
        mangle: false
    })
  ],
  module: {
    loaders: [
		{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		},
		{
			test: /\.html$/,
			loader: 'html'
		},
		{
			test: /\.(jpe?g|png|gif|svg)$/i,
			loaders: [
			    'file?hash=sha512&digest=hex&name=[hash].[ext]',
			    'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
			]
		},
		{
			test: /\.json$/,
			loader: 'json'
		}
    ]
  },
  babel: {
    presets: ['es2015']
  }
};

module.exports = config;