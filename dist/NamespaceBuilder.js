"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var prettier = require("prettier");
var Namespace_1 = require("./Namespace");
/**
 * defines the namespace builder.
 * It reads and resolves {@link Namespace} with their {@link Module} dependencies
 */
var NamespaceBuilder = /** @class */ (function () {
    function NamespaceBuilder() {
        var _a;
        /**
         * all the modules directly under this {@link Namespace}.
         */
        this.modules = {};
        /**
         * the root namespaces
         */
        this.rootNamespaces = (_a = {},
            _a["global"] = new Namespace_1.Namespace("global"),
            _a);
        /**
         * gets the type map
         */
        this.typeMap = {};
    }
    /**
     * finds the module namespace
     * @param modulePath
     * @return  {Namespace | undefined }
     */
    NamespaceBuilder.prototype.findModuleNs = function (modulePath) {
        var moduleEntry = this.modules[modulePath];
        if (moduleEntry)
            return moduleEntry.ns;
        return undefined;
    };
    /**
     * gets the namespace for the given directory and file.
     * @param fullname
     */
    NamespaceBuilder.prototype.getNamespace = function (fullname) {
        var names = fullname.split(".");
        var ns = this.rootNamespaces[fullname];
        for (var i = 0; i < names.length; i++) {
            var name_1 = names[i];
            if (i === 0) {
                ns = this.rootNamespaces[name_1];
                if (!ns) {
                    ns = new Namespace_1.Namespace(name_1);
                    this.rootNamespaces[name_1] = ns;
                }
            }
            else {
                var child = ns.namespaces[name_1];
                if (!child) {
                    child = new Namespace_1.Namespace(name_1, ns);
                    ns.namespaces[name_1] = child;
                }
                ns = child;
            }
        }
        return ns;
    };
    /**
     * Resolves all augmentations in a module (such as declare module '../CanvasTable')
     */
    NamespaceBuilder.prototype.resolveDeclareModules = function () {
        for (var key in this.modules) {
            var m = this.modules[key];
            m.resolveDeclareModules(this);
        }
    };
    /**
     * resolves all imports of a module, connects namespaces to those and sets the order
     */
    NamespaceBuilder.prototype.resolveImports = function () {
        //resolve the imports
        for (var key in this.modules) {
            var m = this.modules[key];
            m.resolveImports(this);
        }
        //debugger;
    };
    NamespaceBuilder.prototype.write = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var fd, modules;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Open the file
                        try {
                            fd = fs.openSync(config.target, "w");
                        }
                        catch (e) {
                            console.warn(e);
                            console.warn('writing out.ts instead');
                            fd = fs.openSync('out.ts', "w");
                        }
                        fs.writeFileSync(fd, "//this file has been generated by a tool\n");
                        modules = Object.keys(this.modules).map(function (key) { return _this.modules[key]; });
                        //write the modules to the output
                        this.writeModules(fd, modules);
                        // Force the file to be flushed
                        fs.fdatasync(fd, function (err) {
                            if (err)
                                console.warn(err);
                        });
                        fs.close(fd, function (err) {
                            if (err)
                                console.warn(err);
                        });
                        if (!config.pretty) return [3 /*break*/, 2];
                        console.log("pretty " + config.target + ".");
                        return [4 /*yield*/, prettier
                                .resolveConfig(config.target, {
                                useCache: true
                            })
                                .then(function (c) {
                                var source = fs.readFileSync(config.target, { encoding: "utf-8" });
                                source = prettier.format(source, __assign({}, c, { filepath: config.target }));
                                fs.writeFileSync(config.target, source, { encoding: "utf-8" });
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Writes modules to the disk.
     * @param fd The file descriptor to append the module into.
     * @param modules The array of the modules to write.
     */
    NamespaceBuilder.prototype.writeModules = function (fd, modules) {
        //find the first module which not written and has is no target
        var mergeClass = false;
        while (modules.length > 0) {
            var moduleIndex = modules
                .sort(function (a, b) {
                return a.ns.fullName.localeCompare(b.ns.fullName);
            })
                .findIndex(function (moduleToWrite) {
                //get the module imports
                var importedTypes = Object.keys(moduleToWrite.importedTypes);
                var implementedTypes = moduleToWrite.implementedTypes;
                var extendedTypes = moduleToWrite.extendedTypes;
                var declaredModules = moduleToWrite.declaredModules;
                //if the module dependencies has been satisfied we can write the module to the output.
                //with typescript namespaces extended and implemented modules must be defined before the usage.
                //when using declaration merging the parent class must be written.
                var parentClassStatisfied = modules.every(function (m) {
                    return m.exportedTypes.filter(function (t) { return t.typeKind === 'class'; }).every(function (t) {
                        return m.ns.fullName + '.' + t.typeName !== moduleToWrite.ns.fullName;
                    });
                });
                var importStatisifed = importedTypes.every(function (importedType) {
                    //all imported types are satisfied                            
                    var importedTypeModuleEntry = moduleToWrite.importedTypes[importedType];
                    //all imports has been already statisfied previously.
                    var importExplicitlyStatisfied = modules.every(function (a) { return a !== importedTypeModuleEntry.module; });
                    //imported module is in the same namespace or parent namespace...
                    //const importImplicitlyStatisfied = moduleToWrite.ns == importedTypeModuleEntry.ns;
                    return importExplicitlyStatisfied; // || importImplicitlyStatisfied;
                });
                var implementStatisfied = implementedTypes.length === 0 || (implementedTypes.every(function (implementedType) {
                    //all implemented types are satisfied
                    //get the implementedModule import
                    var implementedTypeModuleEntry = moduleToWrite.importedTypes[implementedType];
                    if (implementedTypeModuleEntry) {
                        //in case it is defined it is an external dependency so check if already written
                        return modules.every(function (a) { return a !== implementedTypeModuleEntry.module; });
                    }
                    else {
                        //otherwise the dependency is internal...
                        return true;
                    }
                }));
                var extendStatisfied = extendedTypes.length === 0 || (extendedTypes.every(function (extendedType) {
                    //all extended types are satisfied
                    //gets the extendedModule import
                    var extendedTypeModuleEntry = moduleToWrite.importedTypes[extendedType];
                    if (extendedTypeModuleEntry) {
                        //in case it is defined it is an external dependency so check if already written
                        return modules.every(function (a) { return a !== extendedTypeModuleEntry.module; });
                    }
                    else {
                        //otherwise the dependency is internal...
                        return true;
                    }
                }));
                var declareStatisfied = declaredModules.length === 0 || (declaredModules.every(function (declaredModule) {
                    return modules.every(function (m) { return m !== declaredModule; });
                }));
                if (mergeClass) {
                    return moduleToWrite.mergeClass;
                }
                else {
                    var allStatisfied = parentClassStatisfied && importStatisifed && implementStatisfied && extendStatisfied && declareStatisfied;
                    return allStatisfied;
                }
            });
            if (moduleIndex === -1 && !mergeClass) {
                //reset the merge class flag
                mergeClass = true;
                continue;
            }
            if (moduleIndex === -1 && mergeClass === true) {
                //in this case none of the modules can be statisfied.
                //theoretically it is possible because of bug in the rollup-ns and circular dependenency in the modules.
                //the circular dependency most probably also an error by the tsc compiler.
                //the bugs root cause can miss-identified import/extends/implements detection.
                debugger;
                console.log("unresolved modules");
                var me = modules.sort(function (a, b) { return a.modulePath.localeCompare(b.modulePath); });
                me.forEach(function (m) {
                    console.log(m.modulePath);
                });
                throw new Error("module resolve order has been failed");
            }
            var m = modules[moduleIndex];
            //write out the module
            m.writeTo(fd);
            //finally remove the actually written module from the module list.
            var index = modules.indexOf(m, 0);
            if (index > -1) {
                modules.splice(index, 1);
            }
            //reset the merge class flag
            mergeClass = false;
        }
    };
    return NamespaceBuilder;
}());
exports.NamespaceBuilder = NamespaceBuilder;
//# sourceMappingURL=NamespaceBuilder.js.map