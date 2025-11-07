const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'umd',
    publicPath: './'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  externals: {
    '@jupyterlab/application': '@jupyterlab/application',
    '@jupyterlab/apputils': '@jupyterlab/apputils',
    '@jupyterlab/coreutils': '@jupyterlab/coreutils',
    '@jupyterlab/docregistry': '@jupyterlab/docregistry',
    '@jupyterlab/documentmanager': '@jupyterlab/documentmanager',
    '@jupyterlab/mainmenu': '@jupyterlab/mainmenu',
    '@jupyterlab/settingregistry': '@jupyterlab/settingregistry',
    '@jupyterlab/statedb': '@jupyterlab/statedb',
    '@jupyterlab/services': '@jupyterlab/services',
    '@jupyterlab/translation': '@jupyterlab/translation',
    '@lumino/algorithm': '@lumino/algorithm',
    '@lumino/commands': '@lumino/commands',
    '@lumino/coreutils': '@lumino/coreutils',
    '@lumino/disposable': '@lumino/disposable',
    '@lumino/messaging': '@lumino/messaging',
    '@lumino/signaling': '@lumino/signaling',
    '@lumino/widgets': '@lumino/widgets',
    'react': 'react',
    'react-dom': 'react-dom'
  }
};

