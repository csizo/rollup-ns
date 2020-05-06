"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cosmiconfig = require("cosmiconfig");
/**
 * defines the rollup-ns configuration options.
 */
var Config = /** @class */ (function () {
    function Config() {
        //exluded files in the source directory.
        this.exclude = [
            "**/index.ts",
            "**/*.[s|S]pec.ts",
            "**/*.[t|T]est.ts",
            "**/*.js"
        ];
        //the source directory to search modules from
        this.src = "../../src/source-project/src";
        /**
         * gets or set the target file
         */
        this.target = "../../src/target-project/target-file.ts";
        /**
         * gets or sets the generated target namespace
         */
        this.targetNs = "Target.Namespace";
        /**
         * gets or sets if the target ts file is prettied.
         */
        this.pretty = false;
    }
    ////module overrides.
    //fileNamespaces: { [key: string]: string } = {
    //  ["Extensions.ts"]: "global"
    //};
    /**
     * gets the config from the configuration (rollup-ns)
     * @returns config
     */
    Config.fromConfig = function () {
        var config = new Config();
        var explorer = cosmiconfig("rollup-ns");
        // Search for a configuration by walking up directories.
        // See documentation for search, below.
        var result = explorer.searchSync();
        // result.config is the parsed configuration object.
        // result.filepath is the path to the config file that was found.
        // result.isEmpty is true if there was nothing to parse in the config file.
        if (result && result.config && !result.isEmpty) {
            console.log("rollup-ns config from: " + result.filepath);
            config.src = result.config.src;
            config.exclude = result.config.exclude ? result.config.exclude : [];
            config.target = result.config.target ? result.config.target : "index.ts";
            config.targetNs = result.config.targetNs ? result.config.targetNs : "rollup.ns";
            config.pretty = result.config.pretty ? result.config.pretty : false;
        }
        else if (result && result.isEmpty) {
            console.log("rollup-ns config from: " + result.filepath);
        }
        else {
            console.warn("rollup-ns config is not found.");
        }
        return config;
    };
    return Config;
}());
exports.Config = Config;
//# sourceMappingURL=Config.js.map