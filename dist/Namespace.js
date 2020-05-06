"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var os = require("os");
/**
 * defines a namespace like My.Name.Space
 * The actual namespace can contains several {@link Module}
 */
var Namespace = /** @class */ (function () {
    /**
     * creates new instance of the namespace
     * @param name
     * @param parent
     */
    function Namespace(name, parent) {
        this.name = name;
        /**
         * the actual child namespaces
         */
        this._namespaces = {};
        /**
         * the parent namespace
         */
        this._parent = undefined;
        /**
         * The namespace resolved modules.
         */
        this.modules = [];
        this._parent = parent;
    }
    Object.defineProperty(Namespace.prototype, "fullName", {
        /**
         * gets the namespace full name
         * @returns {}
         */
        get: function () {
            var parent = this._parent;
            var fullName = this.name;
            while (parent) {
                fullName = parent.name + "." + fullName;
                parent = parent._parent;
            }
            return fullName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Namespace.prototype, "isGlobal", {
        /**
         * check if namespace is a 'global' namespace
         * @returns {}
         */
        get: function () {
            return this._parent == undefined && this.name === "global";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Namespace.prototype, "isRoot", {
        /**
         * check if the namespace is a root namespace.
         * it can be either top level namespace or 'global'
         * @returns {}
         */
        get: function () {
            return this._parent == undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Namespace.prototype, "namespaces", {
        /**
         * returns the child namespaces
         * @returns {}
         */
        get: function () {
            return this._namespaces;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Namespace.prototype, "parent", {
        /**
         * gets the parent namespace or undefined if empty.
         * @returns {}
         */
        get: function () {
            return this._parent;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * returns true if this namespace contains the other namespace
     * @param ns
     */
    Namespace.prototype.contains = function (ns) {
        //string.startsWith replacement with string.lastIndexOf('str',0)
        //for details see: https://stackoverflow.com/questions/646628/how-to-check-if-a-string-startswith-another-string
        if (ns == null) {
            return false;
        }
        var contains = this.fullName.lastIndexOf(ns.fullName, 0) === 0;
        return contains;
    };
    /**
     * write the namespace and its modules to the target file
     * @param {number} fd The target file descriptor.
     * @param {()=>void} writeContentFn the write content callback
     */
    Namespace.prototype.writeTo = function (fd, writeContentFn) {
        if (!this.isGlobal) {
            fs.appendFileSync(fd, "namespace " + this.fullName + os.EOL + "{" + os.EOL);
        }
        writeContentFn();
        if (!this.isGlobal) {
            fs.appendFileSync(fd, "}" + os.EOL);
        }
    };
    return Namespace;
}());
exports.Namespace = Namespace;
//# sourceMappingURL=Namespace.js.map