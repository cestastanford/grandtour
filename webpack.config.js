var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
var path = require('path');

module.exports = {

  entry: './public/app.js',
  output: {
    publicPath: '',
    path: path.resolve(__dirname, './dist'),
    filename: 'app.bundle.js'
  },
  module:
  {
    rules: [
      // .ts files for TypeScript
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader?{tsconfig: "tsconfig.json"}'
        ]
      },
      // { test: /\.pug$/, loaders: ['pug-loader'] },
      { test: /\.css$/, loaders: ['css-loader'] },
      { test: /\.html$/, loader: 'raw-loader' },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.html', '.css']
  },
  plugins: [
    // new webpack.ContextReplacementPlugin(
    //   // The (\\|\/) piece accounts for path separators in *nix and Windows
    //   /angular(\\|\/)core(\\|\/)@angular/,
    //   path.resolve(__dirname, '../client'),
    //   {
    //     // your Angular Async Route paths relative to this root directory
    //   }
    // ),
    new HtmlWebpackPlugin({
      filetype: 'pug',
      template: './public/index.pug'
    }),
    new HtmlWebpackPugPlugin(),
    new webpack.DefinePlugin({
    })
  ]

};
