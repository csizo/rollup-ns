"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RollupNs_1 = require("./RollupNs");
//run the rollup-ns command.
//as this app is a node binary this is like an entry point for the whole application.
var rollupNs = new RollupNs_1.RollupNs();
rollupNs.run().catch(function (e) {
    console.error('The process failed with error(s).', e);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map