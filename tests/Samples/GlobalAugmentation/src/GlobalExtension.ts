import { MyModule } from './MyModule';


declare global {
    export interface Window {
        myModule: MyModule;
        myMethod(): void;
    }
}


window.myModule = window.myModule || new MyModule();
window.myMethod = () => { };