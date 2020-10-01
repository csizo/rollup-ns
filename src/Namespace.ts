import fs = require("fs");
import { Module } from "./Module";
import { Namespaces } from "./Namespaces";
import os = require('os');
/**
 * defines a namespace like My.Name.Space
 * The actual namespace can contains several {@link Module}
 */
export class Namespace {
    /**
     * the actual child namespaces
     */
    private _namespaces: Namespaces = {};
    /**
     * the parent namespace
     */
    private _parent?: Namespace = undefined;

    /**
     * gets or sets the External paths of namespace
     */
    externalPaths: string[] = [];
    /**
     * The namespace resolved modules.
     */
    modules: Module[] = [];

    /**
     * creates new instance of the namespace
     * @param name
     * @param parent
     */
    constructor(readonly name: string, parent?: Namespace) {
        this._parent = parent;
    }

    /**
     * gets the namespace full name
     * @returns {}
     */
    get fullName(): string {
        let parent: Namespace = this._parent;
        let fullName = this.name;
        while (parent) {
            fullName = parent.name + "." + fullName;
            parent = parent._parent;
        }
        return fullName;
    }

    /**
     * gets if the namespace (has) external types.
     */
    get isExternal(): boolean {
        return this.externalPaths?.length > 0;
    }

    /**
     * check if namespace is a 'global' namespace
     * @returns {}
     */
    get isGlobal(): boolean {
        return this._parent == undefined && this.name === "global";
    }

    /**
     * check if the namespace is a root namespace.
     * it can be either top level namespace or 'global'
     * @returns {}
     */
    get isRoot(): boolean {
        return this._parent == undefined;
    }

    /**
     * returns the child namespaces
     * @returns {}
     */
    get namespaces(): {
        [name: string]: Namespace;
    } {
        return this._namespaces;
    }

    /**
     * gets the parent namespace or undefined if empty.
     * @returns {}
     */
    get parent(): Namespace | undefined {
        return this._parent;
    }

    /**
     * returns true if this namespace contains the other namespace
     * @param ns
     */
    contains(ns: Namespace): boolean {
        //string.startsWith replacement with string.lastIndexOf('str',0)
        //for details see: https://stackoverflow.com/questions/646628/how-to-check-if-a-string-startswith-another-string
        if (ns == null) {
            return false;
        }
        const contains = this.fullName.lastIndexOf(ns.fullName, 0) === 0;
        return contains;
    }

    /**
     * write the namespace and its modules to the target file
     * @param {number} fd The target file descriptor.
     * @param {()=>void} writeContentFn the write content callback
     */
    writeTo(fd: number, writeContentFn: () => void) {
        if (!this.isGlobal) {
            fs.appendFileSync(fd, `namespace ${this.fullName}${os.EOL}{${os.EOL}`);
        }
        writeContentFn();
        if (!this.isGlobal) {
            fs.appendFileSync(fd, `}${os.EOL}`);
        }
    }
}
