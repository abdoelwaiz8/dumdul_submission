// File: abdoelwaiz8/dumdul_submission/webpack.prod.js

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  // TAMBAHKAN BLOK 'module' DARI REFERENSI
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['last 2 versions', '> 1%', 'not dead'],
                    },
                    useBuiltIns: 'usage',
                    corejs: 3, // Menggunakan corejs versi 3
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },

  // TAMBAHKAN BLOK 'optimization' DARI REFERENSI
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000, // Ukuran bisa disesuaikan
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },

  // TAMBAHKAN BLOK 'performance' DARI REFERENSI
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  
  // BLOK 'plugins' ANDA SUDAH BENAR (TETAPKAN)
  plugins: [
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'),
      swDest: 'sw.js',
    })
  ],
});