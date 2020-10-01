import { ComplexBaseClass } from '../ComplexBaseClass';

declare module '../ComplexBaseClass' {
    export interface ComplexBaseClass {
    /**
             * decrement the base property value
             */
    decrement(): void;
}
}

(() => {
    ComplexBaseClass.prototype.decrement = function (this: ComplexBaseClass) {
        this.baseProp -= 1;
    }
})()