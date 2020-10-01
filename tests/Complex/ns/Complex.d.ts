declare namespace Samples.Complex {
    import BaseClass = Samples.Basic.BaseClass;
    class ComplexBaseClass extends BaseClass {
    }
}
declare namespace Samples.Complex {
    import SubClass = Samples.Basic.SubFolder.SubClass;
    class ComplexSubClass extends SubClass {
    }
}
declare namespace Samples.Complex {
    interface ComplexBaseClass {
        /**
                 * decrement the base property value
                 */
        decrement(): void;
    }
}
declare namespace Samples.Complex {
    interface ComplexBaseClass {
        /**
             * increment the base property value
             */
        increment(): void;
    }
}
declare namespace Samples.Complex.Extensions {
}
declare namespace Samples.Complex.Modules {
}
declare namespace Samples.Complex.Modules {
}
