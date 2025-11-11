// File: dumdul_submission1/webpack.prod.js

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { InjectManifest } = require('workbox-webpack-plugin'); // <-- TAMBAHKAN INI
const path = require('path'); // <-- TAMBAHKAN INI

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    // ... (rules)
  },
  optimization: {
    // ... (splitChunks)
  },
  performance: {
    // ... (performance)
  },
  
  // TAMBAHKAN PLUGINS INI
  plugins: [
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'),
      swDest: 'sw.js',
    })
  ],
});