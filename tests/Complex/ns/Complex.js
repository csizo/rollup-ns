var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//this file has been generated by rollup-ns
//#region ComplexBaseClass.ts
var Samples;
(function (Samples) {
    var Complex;
    (function (Complex) {
        var BaseClass = Samples.Basic.BaseClass;
        var ComplexBaseClass = /** @class */ (function (_super) {
            __extends(ComplexBaseClass, _super);
            function ComplexBaseClass() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return ComplexBaseClass;
        }(BaseClass));
        Complex.ComplexBaseClass = ComplexBaseClass;
    })(Complex = Samples.Complex || (Samples.Complex = {}));
})(Samples || (Samples = {}));
//#endregion ComplexBaseClass.ts
//#region ComplexSubClass.ts
(function (Samples) {
    var Complex;
    (function (Complex) {
        var SubClass = Samples.Basic.SubFolder.SubClass;
        var ComplexSubClass = /** @class */ (function (_super) {
            __extends(ComplexSubClass, _super);
            function ComplexSubClass() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return ComplexSubClass;
        }(SubClass));
        Complex.ComplexSubClass = ComplexSubClass;
    })(Complex = Samples.Complex || (Samples.Complex = {}));
})(Samples || (Samples = {}));
//#endregion IncrementModule.ts.d
//#region WindowExtensions.ts
(function (Samples) {
    var Complex;
    (function (Complex) {
        var Extensions;
        (function (Extensions) {
            (function () {
                window.baseClass = new Complex.ComplexBaseClass();
            })();
        })(Extensions = Complex.Extensions || (Complex.Extensions = {}));
    })(Complex = Samples.Complex || (Samples.Complex = {}));
})(Samples || (Samples = {}));
//#endregion WindowExtensions.ts
//#region DecrementModule.ts
(function (Samples) {
    var Complex;
    (function (Complex) {
        var Modules;
        (function (Modules) {
            (function () {
                Complex.ComplexBaseClass.prototype.decrement = function () {
                    this.baseProp -= 1;
                };
            })();
        })(Modules = Complex.Modules || (Complex.Modules = {}));
    })(Complex = Samples.Complex || (Samples.Complex = {}));
})(Samples || (Samples = {}));
//#endregion DecrementModule.ts
//#region IncrementModule.ts
(function (Samples) {
    var Complex;
    (function (Complex) {
        var Modules;
        (function (Modules) {
            (function () {
                Complex.ComplexBaseClass.prototype.increment = function () {
                    this.baseProp += 1;
                };
            })();
        })(Modules = Complex.Modules || (Complex.Modules = {}));
    })(Complex = Samples.Complex || (Samples.Complex = {}));
})(Samples || (Samples = {}));
//#endregion IncrementModule.ts