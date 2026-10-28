const path = require('path')

// set by scripts/build.js, which builds one browser target at a time
const outputDir = process.env.EXTENSION_OUTPUT_DIR || path.resolve(__dirname, 'dist', 'chrome')

module.exports = {
  entry: {
    'popup': './src/index.js',
    'content': './src/chrome/content.js',
    'options': './src/chrome/options.js'
  },
  output: {
    path: outputDir,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-env"],
          plugins: ["@babel/plugin-transform-react-jsx"]
        }
      }
    ]
  }
}
