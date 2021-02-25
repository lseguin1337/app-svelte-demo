const { AppFederationPlugin } = require('@contentsquare/app-federation-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join } = require('path');
const autoPreprocess = require('svelte-preprocess');

module.exports = {
  mode: "production",
  entry: {
    '@uxanalytics/workspace': './src/App.svelte',
    '@uxanalytics/workspace/panel-editor': './src/Panel.svelte',
  },
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        exclude: /node_modules/,
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: autoPreprocess()
          }
        }
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.svelte', '.mjs', '.js'],
  },
  plugins:[
    new AppFederationPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ]
};