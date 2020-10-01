import { Module } from './Module';
import { Namespace } from './Namespace';
export type ModuleImport = {
    /**
     * the module the imported type originated from
     */
    sourcePath: string;
    module?: Module;
    /**
     * The resolved {@link Namespace} for the originated {@link Module}
     */
    ns?: Namespace;
    isExternal:boolean;
};
