import fs = require("fs");
import path = require("path");
import micromatch = require("micromatch");
import { Config } from "./Config";
import { Module } from "./Module";
import { Namespace } from './Namespace';
import { NamespaceBuilder } from './NamespaceBuilder';

/**
 * defines and implements the rollup namespace functionality
 */
export class RollupNs {
    static config: Config = new Config();

    nsBuilder: NamespaceBuilder;

    /**
     * runs the rollup.
     * @returns The roll-up target file
     */
    async run(options?: { config?: Config }): Promise<void> {
        RollupNs.config = options?.config ?? Config.fromConfig();
        //set up the namespace builder
        this.nsBuilder = new NamespaceBuilder(RollupNs.config);
        console.log('reading source files.');
        //walk through the source directory files.
        this._walk(path.normalize(RollupNs.config.src), RollupNs.config.targetNs, this.processModule.bind(this));
        console.log('resolving imports.');
        //resolve the imports
        this.nsBuilder.resolveImports();
        console.log('resolving declarations.');
        //resolve the declarations
        this.nsBuilder.resolveDeclarations();
       
        //explicitly set the declare module to 'global'
        this.nsBuilder.declarations.forEach(m=>m.ns = this.nsBuilder.getNamespace('global'));

        //write the target file
        await this.nsBuilder.write(RollupNs.config);
        //done.
        console.log('done');
    }

    protected processModule(fileDirectory: string, fileName: string, nsName: string): void {
        const filePath = path.resolve(path.join(fileDirectory, fileName));
        if (micromatch.some([filePath], RollupNs.config.exclude)) {
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
