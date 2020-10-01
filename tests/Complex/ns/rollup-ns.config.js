/*
 * rollup-ns configuration.
 */
module.exports = {
	//set the target file to Charts.ts
	target: './',

	//sets the target namespace to Bissantz.Ui.Controls.Charts
	targetNs: 'Bissantz.Ui.Controls.Charts',

	//sets the source directory (where the charts es6 files located)
	src: '../Bissantz.Charts/src/',

	//disable the target prettier.
	pretty: true,

	//excluded files...
	exclude: [
		//ignore the ES6 module index file (exports)
		'**/**/index.ts',

		//ignore the polyfill module.
		'**/**/polyfills.ts',

		//exclude all spec
		'**/*.[s|S]pec.ts',

		//exclude all test
		'**/*.[t|T]est.ts',

		//exclude all js files.
		'**/*.js',
	],
	externalTypes: ['Error'],
	externalLibs: [
		//the external library mappings
		{ '@bissantz/flextable-core/lib/': 'Bissantz.Ui.Controls' }
	]
};
