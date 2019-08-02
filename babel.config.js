module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: 'cjs',
                targets: { browsers: '> 2%, ie 11, safari > 9' },
                useBuiltIns: 'entry',
                corejs: 3,
            },
        ],
    ],
}
