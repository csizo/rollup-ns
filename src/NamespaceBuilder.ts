import fs = require("fs");
import prettier = require("prettier");
import { Config } from './Config';
import { Module } from "./Module";
import { ModuleImport } from './ModuleImport';
import { Namespace } from './Namespace';
import { Namespaces } from "./Namespaces";
import os = require('os');

/**
 * defines the namespace builder.
 * It reads and resolves {@link Namespace} with their {@link Module} dependencies
 */
export class NamespaceBuilder {
    /**
     * Stores all the external declarations. such as modules of the 'declare global {...}'
     */
    declarations: Module[] = []
    /**
     * all the modules directly under this {@link Namespace}.
     */
    modules: {
        [modulePath: string]: Module;
    } = {};
    /**
     * the root namespaces
     */
    rootNamespaces: Namespaces = {
        ["global"]: new Namespace("global")
    };
    /**
     * gets the type map
     */
    typeMap: { [typeName: string]: Module | Module[] } = {};

    /**
     * Creates an instance of namespace builder.
     * @param config The rollup-ns configuration.
     */
    constructor(readonly config: Config) {
        const externalLibs = Object.keys(config.externalLibs);
        if (externalLibs.length > 0)
            console.log('external libs:')
        for (let path of externalLibs) {
            const nsFullName = config.externalLibs[path];
            console.log(`${path} => ${nsFullName}`)

            const ns = this.getNamespace(nsFullName);
            ns.externalPaths.push(path);
        }
    }

    /**
     * finds the module namespace
     * @param modulePath
     * @return  {Namespace | undefined }
     */
    findModuleNs(modulePath: string): Namespace | undefined {
        const moduleEntry = this.modules[modulePath];
        if (moduleEntry)
            return moduleEntry.ns;
        return undefined;
    }

    getExternalNs(importPath: string): Namespace {
        for (let path of Object.keys(this.config.externalLibs)) {
            if (importPath.startsWith(path)) {
                const externalPackageNs = this.config.externalLibs[path];

                let nsPath = importPath.substr(path.length);
                //the import path is like this: import {A} from ../NamespaceDirectory/Module -> therefore the last segment must be removed.
                const segments = nsPath.split('/');
                nsPath = segments.slice(0, -1).join('.');

                const fullName = externalPackageNs + (nsPath ? '.' + nsPath : '');

                return this.getNamespace(fullName);
            }
        }

        throw new Error(`No external namespace found for: ${importPath}`);
    }

    /**
     * gets the namespace for the given name (eg: My.Name.Space).
     * @param fullName
     */
    getNamespace(fullName: string): Namespace {
        const names = fullName.split(".");
        let ns: Namespace = this.rootNamespaces[fullName];
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (i === 0) {
                ns = this.rootNamespaces[name];
                if (!ns) {
                    ns = new Namespace(name);
                    this.rootNamespaces[name] = ns;
                }
            }
            else {
                let child = ns!.namespaces[name];
                if (!child) {
                    child = new Namespace(name, ns);
                    ns.namespaces[name] = child;
                }
                ns = child;
            }
        }
        return ns;
    }

    /**
     * Resolves all augmentations and global declarations in a module (such as declare module '../ModuleA' {...} or declare global {...})
     */
    resolveDeclarations() {
        for (const key in this.modules) {
            const m = this.modules[key];
            m.resolveDeclareModules(this);
        }
    }

    /**
     * resolves all imports of a module, connects namespaces to those and sets the order
     */
    resolveImports() {
        //resolve the imports
        for (const key in this.modules) {
            const m = this.modules[key];
            m.resolveImports(this);
        }
        //debugger;
    }

    async write(config: Config): Promise<void> {
        const outFile = config.target;
        console.log(`writing target ${outFile}.`);
        //get all the module keys
        const modules = Object.keys(this.modules).map(key => this.modules[key]);
        await this._writeOutFile(outFile, modules);
        if (config.pretty)
            await this._pretty(outFile);

        if (this.declarations.length > 0) {
            const globalsOutFile = outFile.replace('.ts', '.Globals.d.ts');
            console.log(`writing target ${globalsOutFile}.`);
            await this._writeOutFile(globalsOutFile, this.declarations, true);
            if (config.pretty)
                await this._pretty(globalsOutFile);
        }
    }

    /**
     * Writes modules to the disk.
     * @param fd The file descriptor to append the module into.
     * @param modules The array of the modules to write.
     */
    writeModules(fd: number, modules: Module[], isGlobal?: boolean): void {
        //find the first module which not written and has is no target

        let mergeClass = false;

        if (isGlobal) {
            const importedTypes: { [typeName: string]: ModuleImport } = {};
            for (const m of modules) {
                for (const importedTypeName of Object.keys(m.importedTypes)) {
                    importedTypes[importedTypeName] = m.importedTypes[importedTypeName];
                }
            }
            Module.writeImportedTypes(fd, this.rootNamespaces['global'], importedTypes, 'global');

            for (const m of modules) {
                fs.appendFileSync(fd, m.content + os.EOL, { encoding: "utf-8" });
            }
        } else {
            while (modules.length > 0) {
                const moduleIndex = modules
                    .sort((a, b) => {
                        return a.ns.fullName.localeCompare(b.ns.fullName);
                    })
                    .findIndex(moduleToWrite => {
                        //get the module imports
                        const importedTypes = Object.keys(moduleToWrite.importedTypes);
                        const implementedTypes = moduleToWrite.implementedTypes;
                        const extendedTypes = moduleToWrite.extendedTypes;
                        const declaredModules = moduleToWrite.declaredModules;
                        //if the module dependencies has been satisfied we can write the module to the output.
                        //with typescript namespaces extended and implemented modules must be defined before the usage.

                        //when using declaration merging the parent class must be written.
                        const parentClassSatisfied = modules.every(m => {
                            return m.exportedTypes.filter(t => t.typeKind === 'class').every(t => {
                                return m.ns.fullName + '.' + t.typeName !== moduleToWrite.ns.fullName;
                            });
                        });

                        const importSatisfied = importedTypes.every(importedType => {
                            //all imported types are satisfied                            

                            const importedTypeModuleEntry = moduleToWrite.importedTypes[importedType];
                            //all imports has been already satisfied previously.
                            const importExplicitlySatisfied = modules.every(a => a !== importedTypeModuleEntry.module);
                            //imported module is in the same namespace or parent namespace...
                            //const importImplicitlySatisfied = moduleToWrite.ns == importedTypeModuleEntry.ns;
                            return importExplicitlySatisfied;// || importImplicitlySatisfied;
                        });

                        const implementSatisfied = implementedTypes.length === 0 || (implementedTypes.every(implementedType => {
                            //all implemented types are satisfied
                            //get the implementedModule import
                            const implementedTypeModuleEntry = moduleToWrite.importedTypes[implementedType];
                            if (implementedTypeModuleEntry) {
                                //in case it is defined it is an external dependency so check if already written
                                return modules.every(a => a !== implementedTypeModuleEntry.module);
                            }
                            else {
                                //otherwise the dependency is internal...
                                return true;
                            }
                        }));

                        const extendSatisfied = extendedTypes.length === 0 || (extendedTypes.every(extendedType => {
                            //all extended types are satisfied
                            //gets the extendedModule import
                            const extendedTypeModuleEntry = moduleToWrite.importedTypes[extendedType];
                            if (extendedTypeModuleEntry) {
                                //in case it is defined it is an external dependency so check if already written
                                return modules.every(a => a !== extendedTypeModuleEntry.module);
                            }
                            else {
                                //otherwise the dependency is internal...
                                return true;
                            }
                        }));

                        const declareSatisfied = declaredModules.length === 0 || (declaredModules.every(declaredModule => {
                            return modules.every(m => m !== declaredModule);
                        }));

                        if (mergeClass) {
                            return moduleToWrite.mergeClass;
                        } else {
                            const allSatisfied = parentClassSatisfied && importSatisfied && implementSatisfied && extendSatisfied && declareSatisfied;
                            return allSatisfied;
                        }
                    });
                if (moduleIndex === -1 && !mergeClass) {
                    //reset the merge class flag
                    mergeClass = true;
                    continue;
                }
                if (moduleIndex === -1 && mergeClass === true) {
                    //in this case none of the remaining modules can be satisfied.
                    //theoretically it is possible because of bug in the rollup-ns and circular dependency in the modules.
                    //the circular dependency most probably also an error by the tsc compiler.
                    //the bugs root cause can miss-identified import/extends/implements detection.
                    debugger;
                    console.log("unresolved modules");
                    const me = modules.sort((a, b) => a.modulePath.localeCompare(b.modulePath));
                    me.forEach(m => {
                        console.log(m.modulePath);
                    });
                    throw new Error("module resolve order has been failed");
                }
                const m = modules[moduleIndex];
                //write out the module
                m.writeTo(fd);
                //finally remove the actually written module from the module list.
                const index = modules.indexOf(m, 0);
                if (index > -1) {
                    modules.splice(index, 1);
                }
                //reset the merge class flag
                mergeClass = false;
            }
        }
    }

    private async _pretty(outFile: string): Promise<void> {
        console.log(`pretty ${outFile}.`);
        const prettierConfig = await prettier
            .resolveConfig(outFile, {
                useCache: true
            });

        let source = fs.readFileSync(outFile, { encoding: "utf-8" });
        source = prettier.format(source, {
            ...prettierConfig,
            filepath: outFile
        });
        fs.writeFileSync(outFile, source, { encoding: "utf-8" });
    }

    private _writeOutFile(outFile: string, modules: Module[], isGlobal?: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            let fd: number;
            // Open the file
            try {
                fd = fs.openSync(outFile, "w");
            }
            catch (e) {
                console.warn(e);
                console.warn('writing out.ts instead');
                fd = fs.openSync('out.ts', "w");
            }
            fs.writeFileSync(fd, "//this file has been generated by rollup-ns\r\n");
            if (isGlobal) {
                fs.writeFileSync(fd, 'export { }\r\n');
            }

            //write the modules to the output
            this.writeModules(fd, modules, isGlobal);
            // Force the file to be flushed
            fs.fdatasync(fd, err => {
                if (err) {
                    console.warn(err);
                    reject(err);
                } else {
                    //then close the file.
                    fs.close(fd, err => {
                        if (err) {
                            console.warn(err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }
}
