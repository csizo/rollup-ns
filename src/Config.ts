import cosmiconfig = require("cosmiconfig");
/**
 * defines the rollup-ns configuration options.
 */
export class Config {
    //excluded files in the source directory.
    exclude: string[] = [
        "**/index.ts",
        "**/*.[s|S]pec.ts",
        "**/*.[t|T]est.ts",
        "**/*.js"
    ];
    /**
     * gets or sets the external libraries (other namespace references)
     */
    externalLibs: { [path: string]: string } = {}

    /**
     * gets or sets the external types which are resolved to external sources.  (such as Error, Window, Array types)
     */
    externalTypes: string[] = ['Error', 'Window', 'Array'];
    /**
     * gets or sets if the target ts file is prettied.
     */
    pretty: boolean = false;
    /**
     * gets or sets the source folder
     */
    src: string = "../../src/source-project/src";
    /**
     * gets or set the target file
     */
    target: string = "../../src/target-project/target-file.ts";
    /**
     * gets or sets the generated target namespace
     */
    targetNs: string = "Target.Namespace";

    /**
     * gets the config from the configuration (rollup-ns)
     * @returns config 
     */
    static fromConfig(): Config {
        const config = new Config();
        const explorer = cosmiconfig("rollup-ns");
        // Search for a configuration by walking up directories.
        // See documentation for search, below.
        const result: {
            isEmpty: boolean;
            filepath: string;
            config: any;
        } = explorer.searchSync();
        // result.config is the parsed configuration object.
        // result.filepath is the path to the config file that was found.
        // result.isEmpty is true if there was nothing to parse in the config file.
        if (result && result.config && !result.isEmpty) {
            config.src = result.config.src;
            config.exclude = result.config.exclude ? result.config.exclude : [];
            config.target = result.config.target ? result.config.target : "index.ts";
            config.targetNs = result.config.targetNs ? result.config.targetNs : "rollup.ns";
            config.pretty = result.config.pretty ? result.config.pretty : false;
            config.externalTypes = result.config.externalTypes ?? ['Error'];
            config.externalLibs = {};
            if (result.config.externalLibs) {
                for (const key of Object.keys(result.config.externalLibs)){
                    config.externalLibs[key] = String(result.config.externalLibs[key])
                }
            }
            console.log(`rollup-ns config from: ${result.filepath}`, config);
        }
        else if (result && result.isEmpty) {
            console.log(`rollup-ns config from: ${result.filepath}`);
        }
        else {
            console.warn(`rollup-ns config is not found.`);
        }
        return config;
    }
}
