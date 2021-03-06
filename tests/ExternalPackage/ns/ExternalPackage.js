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
//#region ExternalClass.ts
var Samples;
(function (Samples) {
    var ExternalPackage;
    (function (ExternalPackage) {
        var BaseClass = Samples.Basic.BaseClass;
        var ExternalClass = /** @class */ (function (_super) {
            __extends(ExternalClass, _super);
            function ExternalClass() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ExternalClass.prototype.decrement = function () {
                this.baseProp -= 1;
            };
            return ExternalClass;
        }(BaseClass));
        ExternalPackage.ExternalClass = ExternalClass;
    })(ExternalPackage = Samples.ExternalPackage || (Samples.ExternalPackage = {}));
})(Samples || (Samples = {}));
//#endregion ExternalClass.ts
