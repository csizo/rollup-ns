import { MyModule } from '../MyModule';

declare global {
    export interface Window {
        myModule: MyModule;

        myMethod(): void;
    }
}

(() => {
    console.log('extending window with myModule...')
    window.myModule = window.myModule || new MyModule();
    console.log('extending window with myMethod...')
    window.myMethod = function (this: Window) {
        console.log('Extension method on window')
    }
})();