const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const banner = pkg.name + ' v' + pkg.version + ' | (c) ' + new Date().getFullYear() + ' ' + pkg.author + ' | ' + pkg.license + ' | ' + pkg.homepage;

module.exports = [
    {
        entry: path.resolve(__dirname, 'lib/index.js'),
        output: {
            path: path.join(__dirname, 'dist'),
            filename: `${pkg.name}-${pkg.version}.js`,
            libraryTarget: 'umd',
            library: 'CNCController'
        },
        plugins: [
            new webpack.BannerPlugin(banner)
        ]
    },
    {
        entry: path.resolve(__dirname, 'lib/index.js'),
        output: {
            path: path.join(__dirname, 'dist'),
            filename: `${pkg.name}-${pkg.version}.min.js`,
            libraryTarget: 'umd',
            library: 'CNCController'
        },
        plugins: [
            new webpack.BannerPlugin(banner),
            new webpack.optimize.UglifyJsPlugin({
                sourceMap: true,
                compress: {
                    screw_ie8: true, // React doesn't support IE8
                    warnings: false
                },
                mangle: {
                    screw_ie8: true
                },
                output: {
                    comments: false,
                    screw_ie8: true
                }
            })
        ]
    }
];
