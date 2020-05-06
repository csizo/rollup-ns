import fs = require("fs");
import path = require("path");
import balanced = require("node-balanced");
import { ModuleImport } from "./ModuleImport";
import { Namespace } from './Namespace';
import { NamespaceBuilder } from './NamespaceBuilder';
import os = require('os');

const fromRegex = /from[\s]*["'](.*?)["']/;
const importLineRegex = /import\s+{[\w,\s}]+['"][./\w]+['"]+\s*;{0,1}/;
const typeImportRegex = /\{([\w,\s]*)\}/;
const exportRegex = /export[\s]*(interface|class|type|const)[\s]*([\w]*)/gm;
const extendRegex = /extends\s*(.*?)(implements|{)/gm;
/**
 * defines a .ts module parsing and resolving logic
 */
export class Module {
    content: string = "";
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
    declaredModules: Module[] = [];
    /**
     * stores the path of the module.
     */
    modulePath: string;
    /**
     * gets or sets the Module {@link Namespace}
     */
    ns: Namespace;

    declaredBy?: Module;
    /**
     * Exported types of the module
     */
    exportedTypes: { typeName: string, typeKind: string }[] = [];
    mergeClass: boolean = false;
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
                const fromFile = fromRegex.exec(importLine)[1];
                //check if import is not a named import (such as import from ../..)
                const unnamedImportChars = './'.split('');
                if (fromFile.split('').every(character => unnamedImportChars.some(c => c === character))) {
                    const errorMessage = 'unnamed import ' + importLine + ' in module: ' + filePath;
                    console.error(errorMessage);
                    throw new Error(errorMessage);
                }
                let resolvedPath = path.resolve(fileDirectory + "/" + fromFile + ".ts");
                if (!fs.existsSync(resolvedPath)) {
                    resolvedPath = path.resolve(fileDirectory + "/" + fromFile + "/index.ts");
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
                                sourcePath: resolvedPath
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
        //#region handle the global @ns- comments.

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
        //#endregion

        //grab the augmentations...
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
        //#region extends
        while ((match = extendRegex.exec(untypedContent))) {
            //debugger;
            match[1].split(',').map(a => a.trim()).forEach(typeName => {
                //skip generic type like 'T' or 'U' or T[X]...
                if (typeName === 'T' || typeName === 'U' || (typeName.length > 1 && typeName.startsWith('T') && typeName.charAt(1) === typeName.charAt(1).toUpperCase()))
                    return;
                //skip well known ts.lib types, such as Error
                if (typeName === 'Error') {
                    return;
                }
                if (!this.extendedTypes.includes(typeName))
                    this.extendedTypes.push(typeName);
            });
        }
        //#endregion
        //#region implements
        //find implements keywords
        const implementsRegex = /class[\w\s]*implements\s*(.*)\s*{/gm;
        while ((match = implementsRegex.exec(untypedContent))) {
            match[1].split(',').map(a => a.trim()).forEach(typeName => {
                if (!this.implementedTypes.includes(typeName))
                    this.implementedTypes.push(typeName);
            });
        }
        //#endregion
        //#region export
        while ((match = exportRegex.exec(untypedContent))) {
            const exportedTypeKind = match[1];
            const exportedTypeName = match[2];
            if (this.exportedTypes.every(e => e.typeName !== exportedTypeName))
                this.exportedTypes.push({
                    typeName: exportedTypeName,
                    typeKind: exportedTypeKind,
                });
        }
        //#endregion
    }

    /**
    * resolves the augmentations in the current module
    * @param {NamespaceBuilder} the nsBuilder
    */
    resolveDeclareModules(nsBuilder: NamespaceBuilder): void {
        //check for "declare module '../path.to.module/module'"


        this.declaredModules.forEach((declaredModule, idx) => {

            for (let extendedType of declaredModule.extendedTypes) {
                const extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    //must import the types extended to have proper module ordering.
                    declaredModule.importedTypes[extendedType] = {
                        ns: extendedTypeModule.ns,
                        sourcePath: extendedTypeModule.modulePath,
                        module: extendedTypeModule
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
            const importedNs = nsBuilder.findModuleNs(importEntry.sourcePath);
            if (importedNs) {
                const m = nsBuilder.modules[importEntry.sourcePath];
                importEntry.ns = importedNs;
                importEntry.module = m;
            }
            else {
                console.warn(`resolving module ${this.modulePath} importing ${key} at ${importEntry.sourcePath} failed. Check if ${importEntry.sourcePath} is imported and not the index.ts`);
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
        fs.appendFileSync(fd, `//#region ${moduleName}\n`, { encoding: "utf-8" });
        this.ns.writeTo(fd, () => {
            //write imports (if any)
            for (let key in this.importedTypes) {
                //get the nsImport
                const nsImport = this.importedTypes[key];
                if (nsImport.ns) {
                    //if we have any ns import...
                    //check if we need to add the import.
                    //(due to ES6 MUST import all used type we need to filter all imports on the same or up namespace as it is generally available)
                    if (!this.ns.contains(nsImport.ns)) {
                        const importText = `import ${key.toString()} = ${nsImport.ns.fullName}.${key.toString()};\n`;
                        fs.appendFileSync(fd, importText, { encoding: "utf-8" });
                    }
                }
                else {
                    console.error('cannot find imported module namespace', this.modulePath, nsImport)
                    debugger;
                }
            }
            //write content.
            fs.appendFileSync(fd, this.content + os.EOL, { encoding: "utf-8" });
        });
        fs.appendFileSync(fd, `//#endregion ${moduleName}${os.EOL}`, {
            encoding: "utf-8"
        });
    }
}
