// File: dumdul_submission1/webpack.dev.js (BARU)

const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  
  // TAMBAHKAN BLOK 'module' INI UNTUK MENANGANI .JS
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // Preset sederhana untuk dev
          },
        },
      },
    ],
  },
  
  // Ini adalah config server dari langkah kita sebelumnya
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    open: true,
    port: 8080,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    historyApiFallback: true,
    hot: true,
  },
});