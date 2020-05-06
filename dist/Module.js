"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var balanced = require("node-balanced");
var os = require("os");
var fromRegex = /from[\s]*["'](.*?)["']/;
var importLineRegex = /import\s+{[\w,\s}]+['"][./\w]+['"]+\s*;{0,1}/;
var typeImportRegex = /\{([\w,\s]*)\}/;
var exportRegex = /export[\s]*(interface|class|type|const)[\s]*([\w]*)/gm;
var extendRegex = /extends\s*(.*?)(implements|{)/gm;
/**
 * defines a .ts module parsing and resolving logic
 */
var Module = /** @class */ (function () {
    function Module() {
        this.content = "";
        /**
         * all the extended types
         */
        this.extendedTypes = [];
        /**
         * all the implemented types
         */
        this.implementedTypes = [];
        /**
         * contains list of imported types for the given namespace
         */
        this.importedTypes = {};
        this.declaredModules = [];
        /**
         * Exported types of the module
         */
        this.exportedTypes = [];
        this.mergeClass = false;
    }
    /**
     * adds the given content to this module
     * @param {string} fileDirectory the file directory to read
     * @param {string} filePath the file patch to read
     * @param {string} content the file content to add
     */
    Module.prototype.addContent = function (fileDirectory, filePath, content) {
        var _this = this;
        if (content === '') //if the file is actually empty skip it.
            return;
        //grab the imports.
        while (importLineRegex.test(content)) {
            content = content.replace(importLineRegex, function (importLine) {
                var fromFile = fromRegex.exec(importLine)[1];
                //check if import is not a named import (such as import from ../..)
                var unnamedImportChars = './'.split('');
                if (fromFile.split('').every(function (character) { return unnamedImportChars.some(function (c) { return c === character; }); })) {
                    var errorMessage = 'unnamed import ' + importLine + ' in module: ' + filePath;
                    console.error(errorMessage);
                    throw new Error(errorMessage);
                }
                var resolvedPath = path.resolve(fileDirectory + "/" + fromFile + ".ts");
                if (!fs.existsSync(resolvedPath)) {
                    resolvedPath = path.resolve(fileDirectory + "/" + fromFile + "/index.ts");
                }
                //seek for import fragment import {a,b,c}
                typeImportRegex
                    .exec(importLine)[1]
                    .split(",") //imports are comma (,) separated
                    .map(function (a) { return a.trim(); }) //trim the import statements          
                    .filter(function (a) { return a !== ''; }) //filter out empty import (such as import {A,B,} from '...')
                    .forEach(function (typeName) {
                    var importedType = _this.importedTypes[typeName];
                    if (!importedType) {
                        importedType = {
                            sourcePath: resolvedPath
                        };
                        _this.importedTypes[typeName] = importedType;
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
            content = content.replace(/\/\/[ ]{0,}@ns-extends.*/, function (r) {
                var match = r.match(/@ns-extends[ ]{0,}([a-z|0-9|_]{1,})/i);
                if (match) {
                    //debugger;
                    _this.extendedTypes.push(match[1]);
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
            replace: function (source, head, tail) {
                //create the define module
                var dm = new Module();
                dm.modulePath = _this.modulePath + '.d';
                //add content
                dm.content = head + source + tail;
                dm.evaluateModule(dm.content);
                dm.declaredBy = _this;
                // //copy all imports.
                // for (let k in this.importedTypes) {
                //     if (!(k in dm.importedTypes))
                //         dm.importedTypes[k] = this.importedTypes[k];
                // }
                _this.declaredModules.push(dm);
                //remove the declare module from the original module content
                return '';
            }
        });
        this.evaluateModule(content);
        this.content = this.content + content;
    };
    Module.prototype.evaluateModule = function (content) {
        //to support generics all the generic types must be removed before searching for extended, implemented, exported type names.
        var _this = this;
        var untypedContent = balanced.replacements({
            source: content,
            open: '<',
            close: '>',
            replace: function (source, head, tail) {
                return '';
            }
        });
        var match = null;
        //#region extends
        while ((match = extendRegex.exec(untypedContent))) {
            //debugger;
            match[1].split(',').map(function (a) { return a.trim(); }).forEach(function (typeName) {
                //skip generic type like 'T' or 'U' or T[X]...
                if (typeName === 'T' || typeName === 'U' || (typeName.length > 1 && typeName.startsWith('T') && typeName.charAt(1) === typeName.charAt(1).toUpperCase()))
                    return;
                //skip well known ts.lib types, such as Error
                if (typeName === 'Error') {
                    return;
                }
                if (!_this.extendedTypes.includes(typeName))
                    _this.extendedTypes.push(typeName);
            });
        }
        //#endregion
        //#region implements
        //find implements keywords
        var implementsRegex = /class[\w\s]*implements\s*(.*)\s*{/gm;
        while ((match = implementsRegex.exec(untypedContent))) {
            match[1].split(',').map(function (a) { return a.trim(); }).forEach(function (typeName) {
                if (!_this.implementedTypes.includes(typeName))
                    _this.implementedTypes.push(typeName);
            });
        }
        var _loop_1 = function () {
            var exportedTypeKind = match[1];
            var exportedTypeName = match[2];
            if (this_1.exportedTypes.every(function (e) { return e.typeName !== exportedTypeName; }))
                this_1.exportedTypes.push({
                    typeName: exportedTypeName,
                    typeKind: exportedTypeKind,
                });
        };
        var this_1 = this;
        //#endregion
        //#region export
        while ((match = exportRegex.exec(untypedContent))) {
            _loop_1();
        }
        //#endregion
    };
    /**
    * resolves the augmentations in the current module
    * @param {NamespaceBuilder} the nsBuilder
    */
    Module.prototype.resolveDeclareModules = function (nsBuilder) {
        //check for "declare module '../path.to.module/module'"
        var _this = this;
        this.declaredModules.forEach(function (declaredModule, idx) {
            for (var _i = 0, _a = declaredModule.extendedTypes; _i < _a.length; _i++) {
                var extendedType = _a[_i];
                var extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    //must import the types extended to have proper module ordering.
                    declaredModule.importedTypes[extendedType] = {
                        ns: extendedTypeModule.ns,
                        sourcePath: extendedTypeModule.modulePath,
                        module: extendedTypeModule
                    };
                }
                else {
                    debugger;
                }
            }
            var regexDeclareModule = /(declare[ ]{1,}module[ ]{1,}'[\-_./a-zA-Z0-9]*')/;
            while (regexDeclareModule.test(declaredModule.content)) {
                //replace the declare module '[abc]' to export namespace 'Resolved.NameSpace'
                declaredModule.content = balanced.replacements({
                    source: declaredModule.content,
                    head: /declare module '[.|\/|a-z|A-Z]*'[ ]*\{/,
                    open: '{',
                    close: '}',
                    replace: function (source, head, tail) {
                        var declareFindings = /declare[ ]{1,}module[ ]{1,}'([\-_./a-zA-Z0-9]*)'/.exec(head);
                        var declareRelativePath = declareFindings[1];
                        var declareFullPath = path.resolve(path.dirname(_this.modulePath), declareRelativePath + '.ts');
                        //resolve module path to namespace.
                        var declareNs = nsBuilder.findModuleNs(declareFullPath);
                        //debugger;
                        declaredModule.ns = declareNs;
                        nsBuilder.modules[declaredModule.modulePath + idx] = declaredModule;
                        declareNs.modules.push(declaredModule);
                        return source;
                    }
                });
            }
            //declared module reference to fully specified type names.
            declaredModule.content = declaredModule.content.replace(/extends ([a-z|A-Z]{1,})/gm, function (c) {
                var extendedType = /extends ([a-z|A-Z]{1,})/gm.exec(c)[1];
                var extendedTypeModule = nsBuilder.typeMap[extendedType];
                if (extendedTypeModule && extendedTypeModule instanceof Module) {
                    c = "extends " + extendedTypeModule.ns.fullName + "." + extendedType;
                }
                return c;
            });
        });
    };
    /**
     * resolves the imports in the current module
     * @param {NamespaceBuilder} the nsBuilder
     */
    Module.prototype.resolveImports = function (nsBuilder) {
        for (var key in this.importedTypes) {
            var importEntry = this.importedTypes[key];
            var importedNs = nsBuilder.findModuleNs(importEntry.sourcePath);
            if (importedNs) {
                var m = nsBuilder.modules[importEntry.sourcePath];
                importEntry.ns = importedNs;
                importEntry.module = m;
            }
            else {
                console.warn("resolving module " + this.modulePath + " importing " + key + " at " + importEntry.sourcePath + " failed. Check if " + importEntry.sourcePath + " is imported and not the index.ts");
            }
        }
    };
    /**
     * write the namespace to the given output
     * @param {number} fd the file descriptor to append the namespace content.
     * @return {void}
     */
    Module.prototype.writeTo = function (fd) {
        var _this = this;
        //wrap content in vs region.
        var moduleName = path.basename(this.modulePath);
        fs.appendFileSync(fd, "//#region " + moduleName + "\n", { encoding: "utf-8" });
        this.ns.writeTo(fd, function () {
            //write imports (if any)
            for (var key in _this.importedTypes) {
                //get the nsImport
                var nsImport = _this.importedTypes[key];
                if (nsImport.ns) {
                    //if we have any ns import...
                    //check if we need to add the import.
                    //(due to ES6 MUST import all used type we need to filter all imports on the same or up namespace as it is generally available)
                    if (!_this.ns.contains(nsImport.ns)) {
                        var importText = "import " + key.toString() + " = " + nsImport.ns.fullName + "." + key.toString() + ";\n";
                        fs.appendFileSync(fd, importText, { encoding: "utf-8" });
                    }
                }
                else {
                    console.error('cannot find imported module namespace', _this.modulePath, nsImport);
                    debugger;
                }
            }
            //write content.
            fs.appendFileSync(fd, _this.content + os.EOL, { encoding: "utf-8" });
        });
        fs.appendFileSync(fd, "//#endregion " + moduleName + os.EOL, {
            encoding: "utf-8"
        });
    };
    return Module;
}());
exports.Module = Module;
//# sourceMappingURL=Module.js.map