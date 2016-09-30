module.exports = {
    entry: "./texts_viewer/static/main.js",
    output: {
        path: "texts_viewer/static/bundle",
        filename: "./bundle.js"
    },

    devtool: "#cheap-eval-source-map",
    module: {
        loaders: [
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
            },

            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?limit=10000&mimetype=image/svg+xml'},
            {test: /\.css$/, loader: "style-loader!css-loader"},
            {test: /\.(jpg|svg)$/, loader: "file"},
            {test: /\.scss$/, loaders: ["style", "css", "sass"]}
        ]

    }
};
