//this file has been generated by rollup-ns
//#region MyModule.ts
var Samples;
(function (Samples) {
    var GlobalAugmentation;
    (function (GlobalAugmentation) {
        var MyModule = /** @class */ (function () {
            function MyModule() {
            }
            return MyModule;
        }());
        GlobalAugmentation.MyModule = MyModule;
    })(GlobalAugmentation = Samples.GlobalAugmentation || (Samples.GlobalAugmentation = {}));
})(Samples || (Samples = {}));
//#endregion MyModule.ts
//#region ArrayExtensions.ts
(function (Samples) {
    var GlobalAugmentation;
    (function (GlobalAugmentation) {
        var Extensions;
        (function (Extensions) {
            (function () {
                Array.prototype.myModule = window.myModule || new GlobalAugmentation.MyModule();
                Array.prototype.myMethod = function () {
                    console.log('Extension method on window');
                };
            })();
        })(Extensions = GlobalAugmentation.Extensions || (GlobalAugmentation.Extensions = {}));
    })(GlobalAugmentation = Samples.GlobalAugmentation || (Samples.GlobalAugmentation = {}));
})(Samples || (Samples = {}));
//#endregion ArrayExtensions.ts
//#region WindowExtensions.ts
(function (Samples) {
    var GlobalAugmentation;
    (function (GlobalAugmentation) {
        var Extensions;
        (function (Extensions) {
            (function () {
                console.log('extending window with myModule...');
                window.myModule = window.myModule || new GlobalAugmentation.MyModule();
                console.log('extending window with myMethod...');
                window.myMethod = function () {
                    console.log('Extension method on window');
                };
            })();
        })(Extensions = GlobalAugmentation.Extensions || (GlobalAugmentation.Extensions = {}));
    })(GlobalAugmentation = Samples.GlobalAugmentation || (Samples.GlobalAugmentation = {}));
})(Samples || (Samples = {}));
//#endregion WindowExtensions.ts
