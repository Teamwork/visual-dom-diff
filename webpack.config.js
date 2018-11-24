const path = require('path')

module.exports = {
    entry: './demo/main.js',
    output: {
        path: path.resolve(__dirname, 'demo'),
        filename: 'bundle.js'
    }
}
