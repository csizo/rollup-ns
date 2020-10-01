import { ComplexBaseClass } from '../ComplexBaseClass';

declare global {
    export interface Window {
    baseClass: ComplexBaseClass;
}
}

(() => {
    window.baseClass = new ComplexBaseClass()
})()