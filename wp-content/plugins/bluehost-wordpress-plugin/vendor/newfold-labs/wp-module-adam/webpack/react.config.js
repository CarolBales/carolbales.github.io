const path = require( 'path' );
const { merge } = require( 'webpack-merge' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

const customConfig = {
	entry: {
		adam: path.resolve( process.cwd(), 'src/adam.js' ),
	},
	output: {
		path: path.resolve( process.cwd(), 'build/adam' ),
		filename: 'adam.min.js',
	},
	plugins: [
		new MiniCssExtractPlugin( {
			filename: '[name].min.css',
		} ),
	],
};

module.exports = merge( defaultConfig, customConfig );
