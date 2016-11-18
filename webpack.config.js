'use strict';
/*
以下ではwebpackの設定を行う。
main.jsが入り口であり、
そのファイルからいろいろ必要な依存性のあるファイルをまとめ、
build.jsでまとめて、/front/public/js/に下に置く。
実際のアプリはこのbuildを読み込むこととなる。
以下のpluginsでnew webpack.optimize.UglifyJsPluginを使うかどうかでminimizeするかどうかを決められる。
angularJSとの互換性のためmangle: falseというオプションが必要である。
*/
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