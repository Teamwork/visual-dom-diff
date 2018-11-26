const path = require('path')

module.exports = {
    entry: './docs/main.js',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'bundle.js'
    }
}
