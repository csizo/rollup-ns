import { BaseClass } from '../BaseClass';


declare module '../BaseClass' {
    export interface BaseClass {
        extensionB(): void;
    }
}

//extends the base class...
BaseClass.prototype.extensionB = () => { };
