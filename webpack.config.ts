import path from "path";
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {Configuration} from 'webpack';

const config: Configuration = {
    mode: "development",
    entry: {
        index: "./src/pages/index.ts",
        dashboard: "./src/pages/dashboard.ts"
    },
    output: {
        filename: "bundle.[name].js",
        path: path.resolve(__dirname, "./dist"),
        clean: true,
        publicPath: "",
    },
    module: {
        rules: [{ test: /\.ts/, use: 'ts-loader' }],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Index",
            filename: "index.html",
            template: "src/templates/index.html",
            chunks: ["index"],
        }),
        new HtmlWebpackPlugin({
            title: "Dashboard",
            filename: "dashboard",
            template: "src/templates/dashboard.html",
            chunks: ["dashboard"],
        })
    ],
    resolve: {
        alias: {
            "script":  path.resolve(__dirname, "src/assets/script/"),
        },
        extensions: [".ts", ".js"]
    }
};

export default config;
