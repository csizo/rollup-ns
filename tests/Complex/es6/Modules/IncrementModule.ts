import { ComplexBaseClass } from '../ComplexBaseClass';

declare module '../ComplexBaseClass' {
    export interface ComplexBaseClass {
    /**
         * increment the base property value
         */
    increment(): void;
}
}

(() => {
    ComplexBaseClass.prototype.increment = function (this: ComplexBaseClass) {
        this.baseProp += 1;
    }
})()