const path = require('path')
const webpack = require('webpack')

// set by scripts/build.js, which builds one browser target at a time
const outputDir = process.env.EXTENSION_OUTPUT_DIR || path.resolve(__dirname, 'dist', 'chrome')

module.exports = {
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},
  entry: {
    'popup': './src/index.tsx',
    'content': './src/chrome/content.ts',
    'options': './src/chrome/options.ts'
  },
  output: {
    path: outputDir,
    filename: '[name].js'
  },
  plugins: [
    // replaced at build time, so the dev-only middlewares are dropped by the minifier
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-env", "@babel/preset-typescript"],
          plugins: [["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]]
        }
      }
    ]
  }
}
