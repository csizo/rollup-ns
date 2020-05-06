import fs = require("fs");
import path = require("path");
import micromatch = require("micromatch");
import { Namespace } from './Namespace';
import { NamespaceBuilder } from './NamespaceBuilder';
import { Module } from "./Module";
import { Config } from "./Config";

/**
 * defines and implements the rollup namespace functionality
 */
export class RollupNs {
    config: Config = new Config();
    nsBuilder: NamespaceBuilder;
    /**
     * runs the rollup.
     */
    async run(): Promise<void> {
        this.config = Config.fromConfig();
        //set up the namespace builder
        this.nsBuilder = new NamespaceBuilder();
        console.log('reading source files.');
        //walk through the source directory files.
        this._walk(path.normalize(this.config.src), this.config.targetNs, this.processModule.bind(this));
        console.log('resolving imports.');
        //resolve the imports
        this.nsBuilder.resolveImports();
        console.log('resolving declarations.')
        //resolve the declarations
        this.nsBuilder.resolveDeclareModules();
        console.log(`writing target ${this.config.target}.`);
        //write the target file
        await this.nsBuilder.write(this.config);
        //pretty the target file...
        console.log('done');
    }
    protected processModule(fileDirectory: string, fileName: string, nsName: string): void {
        const filePath = path.resolve(path.join(fileDirectory, fileName));
        if (micromatch.some([filePath], this.config.exclude)) {
            //console.warn(filePath + " excluded");
            return;
        }
        console.log(filePath);
        let ns: Namespace;
        ns = this.nsBuilder.getNamespace(nsName);
        const content = fs.readFileSync(filePath, { encoding: "utf-8" });
        const m = new Module();
        m.ns = ns;
        m.modulePath = filePath;
        m.addContent(fileDirectory, filePath, content);
        ns.modules.push(m);
        this.nsBuilder.modules[filePath] = m;
        
        //fill the nsBuilder exported types.
        m.exportedTypes.forEach(exportedType => {
            let typeModule: Module | Module[] = this.nsBuilder.typeMap[exportedType.typeName];
            if (typeModule === undefined) {
                typeModule = m;
            } else {
                if (Array.isArray(typeModule)) {
                    typeModule.push(m);
                } else {
                    typeModule = [typeModule, m];
                }
            }
            this.nsBuilder.typeMap[exportedType.typeName] = typeModule;
        });
    }
    // sync version
    private _walk(currentDirPath: string, nsName: string, callbackFn: (fileDirectory: string, fileName: string, nsName: string, stat: fs.Stats) => void): void {
        fs.readdirSync(currentDirPath).forEach(fileName => {
            const filePath = path.join(currentDirPath, fileName);

            const stat = fs.statSync(filePath);
            //TODO: add support for excluding file
            if (stat.isFile() && filePath.endsWith('.ts') && !filePath.endsWith('polyfills.ts')) {
                callbackFn(currentDirPath, fileName, nsName, stat);
            }
            else if (stat.isDirectory()) {
                this._walk(filePath, nsName + "." + fileName, callbackFn);
            }
        });
    }
}
