//this file has been generated by rollup-ns
//#region EnumType.ts
namespace Samples.Basic
{
export enum EnumType {
    A,
    B,
    C
}

}
//#endregion EnumType.ts
//#region BaseClass.ts
namespace Samples.Basic
{

export class BaseClass {
    baseProp: number = 0;
    enumField: EnumType = EnumType.A;
}
}
//#endregion BaseClass.ts
//#region EnumB.ts
namespace Samples.Basic.SubFolder
{

export enum EnumB {
    X,
    Y,
    Z
}

}
//#endregion EnumB.ts
//#region SubClass.ts
namespace Samples.Basic.SubFolder
{

export class SubClass extends BaseClass {
    enumB: EnumB;
}

}
//#endregion SubClass.ts
