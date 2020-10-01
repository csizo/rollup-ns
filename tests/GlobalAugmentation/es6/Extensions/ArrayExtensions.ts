import { MyModule } from '../MyModule';

declare global {
    export interface Array<T> {
    myModule: MyModule;

    myMethod(): void;
}
}

(() => {
    Array.prototype.myModule = window.myModule || new MyModule();
    Array.prototype.myMethod = function (this: Window) {
        console.log('Extension method on window')
    }
})();