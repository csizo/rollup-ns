import { BaseClass } from '@basic/BaseClass';
export class ExternalClass extends BaseClass {
    decrement(): void {
        this.baseProp -= 1;
    }
}