"use strict";
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
var path = require("path");
var micromatch = require("micromatch");
var NamespaceBuilder_1 = require("./NamespaceBuilder");
var Module_1 = require("./Module");
var Config_1 = require("./Config");
/**
 * defines and implements the rollup namespace functionality
 */
var RollupNs = /** @class */ (function () {
    function RollupNs() {
        this.config = new Config_1.Config();
    }
    /**
     * runs the rollup.
     */
    RollupNs.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.config = Config_1.Config.fromConfig();
                        //set up the namespace builder
                        this.nsBuilder = new NamespaceBuilder_1.NamespaceBuilder();
                        console.log('reading source files.');
                        //walk through the source directory files.
                        this._walk(path.normalize(this.config.src), this.config.targetNs, this.processModule.bind(this));
                        console.log('resolving imports.');
                        //resolve the imports
                        this.nsBuilder.resolveImports();
                        console.log('resolving declarations.');
                        //resolve the declarations
                        this.nsBuilder.resolveDeclareModules();
                        console.log("writing target " + this.config.target + ".");
                        //write the target file
                        return [4 /*yield*/, this.nsBuilder.write(this.config)];
                    case 1:
                        //write the target file
                        _a.sent();
                        //pretty the target file...
                        console.log('done');
                        return [2 /*return*/];
                }
            });
        });
    };
    RollupNs.prototype.processModule = function (fileDirectory, fileName, nsName) {
        var _this = this;
        var filePath = path.resolve(path.join(fileDirectory, fileName));
        if (micromatch.some([filePath], this.config.exclude)) {
            //console.warn(filePath + " excluded");
            return;
        }
        console.log(filePath);
        var ns;
        ns = this.nsBuilder.getNamespace(nsName);
        var content = fs.readFileSync(filePath, { encoding: "utf-8" });
        var m = new Module_1.Module();
        m.ns = ns;
        m.modulePath = filePath;
        m.addContent(fileDirectory, filePath, content);
        ns.modules.push(m);
        this.nsBuilder.modules[filePath] = m;
        //fill the nsBuilder exported types.
        m.exportedTypes.forEach(function (exportedType) {
            var typeModule = _this.nsBuilder.typeMap[exportedType.typeName];
            if (typeModule === undefined) {
                typeModule = m;
            }
            else {
                if (Array.isArray(typeModule)) {
                    typeModule.push(m);
                }
                else {
                    typeModule = [typeModule, m];
                }
            }
            _this.nsBuilder.typeMap[exportedType.typeName] = typeModule;
        });
    };
    // sync version
    RollupNs.prototype._walk = function (currentDirPath, nsName, callbackFn) {
        var _this = this;
        fs.readdirSync(currentDirPath).forEach(function (fileName) {
            var filePath = path.join(currentDirPath, fileName);
            var stat = fs.statSync(filePath);
            //TODO: add support for excluding file
            if (stat.isFile() && filePath.endsWith('.ts') && !filePath.endsWith('polyfills.ts')) {
                callbackFn(currentDirPath, fileName, nsName, stat);
            }
            else if (stat.isDirectory()) {
                _this._walk(filePath, nsName + "." + fileName, callbackFn);
            }
        });
    };
    return RollupNs;
}());
exports.RollupNs = RollupNs;
//# sourceMappingURL=RollupNs.js.map