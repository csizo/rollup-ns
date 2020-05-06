import { RollupNs } from './RollupNs';

//run the rollup-ns command.
//as this app is a node binary this is like an entry point for the whole application.
const rollupNs = new RollupNs();

rollupNs.run().catch(e => {
    console.error('The process failed with error(s).', e)
    process.exitCode = 1;
});
