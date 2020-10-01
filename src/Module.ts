import fs = require("fs");
import path = require("path");
import balanced = require("node-balanced");
import { ModuleImport } from "./ModuleImport";
import { Namespace } from './Namespace';
import { NamespaceBuilder } from './NamespaceBuilder';
import { RollupNs } from './RollupNs';
import os = require('os');

const fromRegex = /from[\s]*["'](.*?)["']/;
const importLineRegex = /import\s+{[\w,\s}]+['"][./\w@_-]+['"]+\s*;{0,1}/;
const typeImportRegex = /\{([\w,\s]*)\}/;
const exportRegex = /export[\s]*(interface|class|type|const)[\s]*([\w]*)/gm;
const extendRegex = /extends\s*(.*?)(implements|{)/gm;
/**
 * defines a .ts module parsing and resolving logic
 */
export class Module {
    content: string = "";
    declaredBy?: Module;
    declaredGlobals: Module[] = [];
    declaredModules: Module[] = [];
    /**
     * Exported types of the module
     */
    exportedTypes: { typeName: string, typeKind: string }[] = [];
    /**
     * all the extended types
     */
    extendedTypes: string[] = [];
    /**
     * all the implemented types
     */
    implementedTypes: string[] = [];
    /**
     * contains list of imported types for the given namespace
     */
    importedTypes: {
        /**
         *
         * @param {string} typeName - the typename this namespace has import
         * @returns {ModuleImport}
         */
        [typeName: string]: ModuleImport;
    } = {};
    mergeClass: boolean = false;
    /**
     * stores the path of the module.
     */
    modulePath: string;
    /**
     * gets or sets the Module {@link Namespace}
     */
    ns: Namespace;

    static writeImportedTypes(fd: number, ns: Namespace, importedTypes: { [typeName: string]: ModuleImport }, modulePath?: string): void {
        //write imports (if any)
        for (let key in importedTypes) {
            //get the nsImport
            const nsImport = importedTypes[key];
            if (nsImport.ns) {
                //if we have any ns import...
                //check if we need to add the import.
                //(due to ES6 MUST import all used type we need to filter all imports on the same or up namespace as it is generally available)
                if (!ns.contains(nsImport.ns)) {
                    const importText = `import ${key.toString()} = ${nsImport.ns.fullName}.${key.toString()};\n`;
                    fs.appendFileSync(fd, importText, { encoding: "utf-8" });
                }
            }
            else {
                console.error('cannot find imported module namespace', modulePath ?? '', nsImport);
                throw new Error(`cannot find imported module namespace, import {${key}} from ${nsImport.sourcePath}`)
            }
        }
    }

    /**
     * adds the given content to this module
     * @param {string} fileDirectory the file directory to read
     * @param {string} filePath the file patch to read
     * @param {string} content the file content to add
     */
    addContent(fileDirectory: string, filePath: string, content: string): void {
        if (content === '')//if the file is actually empty skip it.
            return;

        //grab the imports.
        while (importLineRegex.test(content)) {
            content = content.replace(importLineRegex, (importLine: string) => {
                const fromClause = fromRegex.exec(importLine)[1];
                //check if import is not a named import (such as import from ../..)
                const unnamedImportChars = './'.split('');
                if (fromClause.split('').every(character => unnamedImportChars.some(c => c === character))) {
                    const errorMessage = 'unnamed import ' + importLine + ' in module: ' + filePath;
                    console.error(errorMessage);
                    throw new Error(errorMessage);
                }

                let resolvedPath: string;
                //check for external namespaced package import
                let isExternal: boolean = this._isExternalImport(fromClause);
                if (isExternal) {
                    //when we have an external import the resolved path must remains the external import path.        
                    resolvedPath = fromClause;
                } else {
                    resolvedPath = path.resolve(fileDirectory + "/" + fromClause + ".ts");
                    if (!fs.existsSync(resolvedPath)) {
                        if (RollupNs.config.externalLibs)
                            resolvedPath = path.resolve(fileDirectory + "/" + fromClause + "/index.ts");
                    }
                }
                //seek for import fragment import {a,b,c}
                typeImportRegex
                    .exec(importLine)[1]
                    .split(",") //imports are comma (,) separated
                    .map(a => a.trim()) //trim the import statements          
                    .filter(a => a !== '')//filter out empty import (such as import {A,B,} from '...')
                    .forEach(typeName => {
                        let importedType = this.importedTypes[typeName];
                        if (!importedType) {
                            importedType = {
                                sourcePath: resolvedPath,
                                isExternal: isExternal
                            };
                            this.importedTypes[typeName] = importedType;
                        }
                    });
                return os.EOL;
            });
        }

        //remove too long cr/lf
        while (/[\r\n]{3,}/.test(content)) {
            content = content.replace(/[\r\n]{3,}/, os.EOL);
        }

        // content = content.replace(/\/\/[ ]{0,}@ns-merge-class.*/, r => {
        //     this.mergeClass = true;
        //     return '';
        // });

        while (/\/\/[ ]{0,}@ns-extends.*/.test(content)) {
            content = content.replace(/\/\/[ ]{0,}@ns-extends.*/, r => {
                const match = r.match(/@ns-extends[ ]{0,}([a-z|0-9|_]{1,})/i);
                if (match) {
                    //debugger;
                    this.extendedTypes.push(match[1]);
                }
                return '';
            });
        }

        //grab the declare module '../Module/Path' augmentations...
        content = balanced.replacements({
            source: content,
            head: /declare module '[.|\/|a-z|A-Z]*'[ ]*\{/,
            open: '{',
            close: '}',
            replace: (source, head, tail) => {
                //create the define module
                const dm = new Module();
                dm.modulePath = this.modulePath + '.d';
                //add content
                dm.content = head + source + tail;
                dm.evaluateModule(dm.content);
                dm.declaredBy = this;
                // //copy all imports.
                // for (let k in this.importedTypes) {
                //     if (!(k in dm.importedTypes))
                //         dm.importedTypes[k] = this.importedTypes[k];
                // }
                this.declaredModules.push(dm);
                //remove the declare module from the original module content
                return '';
            }
        })

        //grab the declare global augmentations...
        content = balanced.replacements({
            source: content,
            head: /declare[\s]*[a-z|A-Z|0-9|_]{1,}[\s]*\{/,
            open: '{',
            close: '}',
            replace: (source, head, tail) => {
                //create the define module
                const dm = new Module();
                dm.modulePath = this.modulePath + '.d';
                //add content
                dm.content = head + source + tail;
                dm.evaluateModule(dm.content);
                dm.declaredBy = this;

                //copy all imports.
                for (let k in this.importedTypes) {
                    if (!(k in dm.importedTypes))
                        dm.importedTypes[k] = this.importedTypes[k];
                }

                this.declaredGlobals.push(dm);
                //remove the declare module from the original module content
                return '';
            }
        })

        this.evaluateModule(content);

        this.content = this.content + content;
    }

    evaluateModule(content: string) {
        //to support generics all the generic types must be removed before searching for extended, implemented, exported type names.

        const untypedContent = balanced.replacements({
            source: content,
            open: '<',
            close: '>',
            replace: (source, head, tail) => {
                return '';
            }
        });
        let match: RegExpExecArray | null = null;
        while ((match = extendRegex.exec(untypedContent))) {
            //debugger;
            match[1].split(',').map(a => a.trim()).forEach(typeName => {
                //skip generic type like 'T' or 'U' or T[X]...
                if (typeName === 'T' || typeName === 'U' || (typeName.length > 1 && typeName.startsWith('T') && typeName.charAt(1) === typeName.charAt(1).toUpperCase()))
                    return;

                //skip configured external types (config.externalTypes: [...])
                if (RollupNs.config.externalTypes && Array.isArray(RollupNs.config.externalTypes)) {
                    if (RollupNs.config.externalTypes.some(a => { a === typeName })) {
                        return;
                    }
                }

                //skip well known ts.lib types, such as Error
                if (typeName === 'Error') {
                    return;
                }

                if (!this.extendedTypes.includes(typeName))
                    this.extendedTypes.push(typeName);
            });
        }
        //find implements keywords
        const implementsRegex = /class[\w\s]*implements\s*(.*)\s*{/gm;
        while ((match = implementsRegex.exec(untypedContent))) {
            match[1].split(',').map(a => a.trim()).forEach(typeName => {
                if (!this.implementedTypes.includes(typeName))
                    this.implementedTypes.push(typeName);
            });
        }
        while ((match = exportRegex.exec(untypedContent))) {
            const exportedTypeKind = match[1];
            const exportedTypeName = match[2];
            if (this.exportedTypes.every(e => e.typeName !== exportedTypeName))
                this.exportedTypes.push({
                    typeName: exportedTypeName,
                    typeKind: exportedTypeKind,
                });
        }
    }

    /**
    * resolves the augmentations and global declarations in the current module
    * @param {NamespaceBuilder} the nsBuilder
    */
    resolveDeclareModules(nsBuilder: NamespaceBuilder): void {
        //check for "declare global {...}"
        this.declaredGlobals.forEach((declaredGlobal, idx) => {
            for (let extendedType of declaredGlobal.extendedTypes) {
                const extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    //must import the types extended to have proper module ordering.
                    declaredGlobal.importedTypes[extendedType] = {
                        ns: extendedTypeModule.ns,
                        sourcePath: extendedTypeModule.modulePath,
                        module: extendedTypeModule,
                        isExternal: false,
                    };
                } else {
                    debugger;
                }
            }

            //declared module reference to fully specified type names.
            declaredGlobal.content = declaredGlobal.content.replace(/extends ([a-z|A-Z]{1,})/gm, c => {
                const extendedType = /extends ([a-z|A-Z]{1,})/gm.exec(c)[1]
                const extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    c = `extends ${extendedTypeModule.ns.fullName}.${extendedType}`;
                }
                return c;
            });

            //copy the declare global to the nsBuilder
            nsBuilder.declarations.push(declaredGlobal);
        });

        //check for "declare module '../path.to.module/module'"
        this.declaredModules.forEach((declaredModule, idx) => {
            for (let extendedType of declaredModule.extendedTypes) {
                const extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    //must import the types extended to have proper module ordering.
                    declaredModule.importedTypes[extendedType] = {
                        ns: extendedTypeModule.ns,
                        sourcePath: extendedTypeModule.modulePath,
                        module: extendedTypeModule,
                        isExternal: false
                    };
                } else {
                    debugger;
                }
            }
            const regexDeclareModule = /(declare[ ]{1,}module[ ]{1,}'[\-_./a-zA-Z0-9]*')/;

            while (regexDeclareModule.test(declaredModule.content)) {
                //replace the declare module '[abc]' to export namespace 'Resolved.NameSpace'
                declaredModule.content = balanced.replacements({
                    source: declaredModule.content,
                    head: /declare module '[.|\/|a-z|A-Z]*'[ ]*\{/,
                    open: '{',
                    close: '}',
                    replace: (source, head, tail) => {
                        const declareFindings = /declare[ ]{1,}module[ ]{1,}'([\-_./a-zA-Z0-9]*)'/.exec(head);
                        const declareRelativePath = declareFindings[1];

                        const declareFullPath = path.resolve(path.dirname(this.modulePath), declareRelativePath + '.ts');

                        //resolve module path to namespace.
                        const declareNs = nsBuilder.findModuleNs(declareFullPath);

                        //debugger;
                        declaredModule.ns = declareNs;
                        nsBuilder.modules[declaredModule.modulePath + idx] = declaredModule;
                        declareNs.modules.push(declaredModule);
                        return source;
                    }
                });
            }

            //declared module reference to fully specified type names.
            declaredModule.content = declaredModule.content.replace(/extends ([a-z|A-Z]{1,})/gm, c => {
                const extendedType = /extends ([a-z|A-Z]{1,})/gm.exec(c)[1]
                const extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    c = `extends ${extendedTypeModule.ns.fullName}.${extendedType}`;
                }
                return c;

            });

        });
    }

    /**
     * resolves the imports in the current module
     * @param {NamespaceBuilder} the nsBuilder
     */
    resolveImports(nsBuilder: NamespaceBuilder): void {
        for (const key in this.importedTypes) {
            const importEntry = this.importedTypes[key];
            if (importEntry.isExternal) { 
                const ns = nsBuilder.getExternalNs(importEntry.sourcePath);
                importEntry.ns = ns;

            } else {
                const importedNs = nsBuilder.findModuleNs(importEntry.sourcePath);
                if (importedNs) {//imported source namespace
                    const m = nsBuilder.modules[importEntry.sourcePath];
                    importEntry.ns = importedNs;
                    importEntry.module = m;
                }
                else {
                    debugger;
                    console.warn(`resolving module ${this.modulePath} importing ${key} at ${importEntry.sourcePath} failed. Check if ${importEntry.sourcePath} is imported and not the index.ts`);
                }
            }
        }
    }

    /**
     * write the namespace to the given output
     * @param {number} fd the file descriptor to append the namespace content.
     * @return {void}
     */
    writeTo(fd: number): void {
        //wrap content in vs region.
        const moduleName = path.basename(this.modulePath);
        fs.appendFileSync(fd, `//#region ${moduleName}${os.EOL}`, { encoding: "utf-8" });

        this.ns.writeTo(fd, () => {
            //write the imported types.     
            try {
                Module.writeImportedTypes(fd, this.ns, this.importedTypes);
            } catch (e) {
                //TODO: better error handling.
                fs.appendFileSync(fd, `//${e}`);
            }

            //write content.
            fs.appendFileSync(fd, this.content + os.EOL, { encoding: "utf-8" });
        });

        fs.appendFileSync(fd, `//#endregion ${moduleName}${os.EOL}`, {
            encoding: "utf-8"
        });
    }

    /**
     * Determines whether the import is external.
     * @param fromClause 
     * @returns true if external import 
     */
    private _isExternalImport(fromClause: string): boolean {
        return Object.keys(RollupNs.config.externalLibs).some(k => fromClause.startsWith(k));
    }
}
