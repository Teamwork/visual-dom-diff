const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
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
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: __dirname + '/demo/index.html'
        })
    ],
    devServer: {
        open: true,
        port: 8028
    }
}
