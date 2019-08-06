const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const isDevServer = process.argv[1].indexOf('webpack-dev-server') >= 0
const config = {
    mode: 'development',
    entry: __dirname + '/demo/main.js',
    output: {
        filename: '[hash].js',
        path: __dirname + '/docs/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [__dirname + '/demo/', __dirname + '/lib/'],
                loader: 'babel-loader'
            },
            {
                test: /\.css$/,
                include: [__dirname + '/demo'],
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: 'file-loader'
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: __dirname + '/demo/index.html'
        })
    ],
    devServer: {
        open: true,
        port: 8028
    }
}

if (!isDevServer) {
    config.plugins.push(new CleanWebpackPlugin())
}

module.exports = config
