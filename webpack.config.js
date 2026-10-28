const path = require('path')

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
