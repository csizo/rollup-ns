declare namespace Samples.Basic {
    enum EnumType {
        A = 0,
        B = 1,
        C = 2
    }
}
declare namespace Samples.Basic {
    class BaseClass {
        baseProp: number;
        enumField: EnumType;
    }
}
declare namespace Samples.Basic.SubFolder {
    enum EnumB {
        X = 0,
        Y = 1,
        Z = 2
    }
}
declare namespace Samples.Basic.SubFolder {
    class SubClass extends BaseClass {
        enumB: EnumB;
    }
}
