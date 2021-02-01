const CopyWebpackPlugin = require('copy-webpack-plugin');
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                query: {
                    configFileName: './tsconfig.json'
                }
            },
            {
                test: /\.scss$/,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader'
                ]
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader'
                    }
                ]
            }
        ]
    },
    output: {
        filename: 'main.js',
        path: join(__dirname, 'docs'),
        publicPath: '/sudoku-generator'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: './index.html'
        }),
        new CopyWebpackPlugin([
            {
                from: 'assets'
            }
        ])
    ],
    resolve: {
        extensions: ['.js', '.scss', '.ts', '.tsx']
    }
};
