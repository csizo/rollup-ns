

import { RollupNs } from '../src/RollupNs';
import { Config } from '../src/Config';
import tsNode = require('ts-node');
import fs = require("fs");

describe('rollup-ns', () => {

    it('Trivial sample is compilable', async () => {
        const config = new Config();

        config.src = 'tests/Samples/Basic/src';
        config.target = 'tests/Samples/Basic/generated/out.ts';
        config.targetNs = 'Samples.Basic';

        const rollupNs = new RollupNs();
        rollupNs.run({ config: config });

        const compiler = tsNode.create({
            compilerOptions: {
                target: 'es5',
                module: 'none'
            }
        });

        const generated = fs.readFileSync('tests/Samples/Basic/generated/out.ts', { encoding: 'utf-8' });

        expect(() => {
            //generated code must be compilable
            const compiled = compiler.compile(generated, 'tests/Samples/Basic/generated/out.ts')
        }).not.toThrow();

    });

    it('Scoped augmentation is compilable', () => {
        const config = new Config();

        config.src = './tests/Samples/ScopedAugmentation/src';
        config.target = 'tests/Samples/ScopedAugmentation/generated/out.ts';
        config.targetNs = 'Samples.Scoped.Augmentation';

        const rollupNs = new RollupNs();
        rollupNs.run({ config: config })

        const compiler = tsNode.create({
            compilerOptions: {
                target: 'es5',
                module: 'none'
            }
        });

        const generated = fs.readFileSync('tests/Samples/ScopedAugmentation/generated/out.ts', { encoding: 'utf-8' });

        expect(() => {
            //generated code must be compilable
            const compiled = compiler.compile(generated, 'tests/Samples/ScopedAugmentation/generated/out.ts')
        }).not.toThrow();
    });

    it('Global augmentation is not supported', () => {
        const config = new Config();

        config.src = './tests/Samples/GlobalAugmentation/src';
        config.target = 'tests/Samples/GlobalAugmentation/generated/out.ts';
        config.targetNs = 'Samples.Global.Augmentation';

        const rollupNs = new RollupNs();
        rollupNs.run({ config: config })

        const compiler = tsNode.create({
            compilerOptions: {
                target: 'es5',
                module: 'none'
            }
        });

        const generated = fs.readFileSync('tests/Samples/GlobalAugmentation/generated/out.ts', { encoding: 'utf-8' });

        expect(() => {
            //generated code must be compilable
            const compiled = compiler.compile(generated, 'tests/Samples/GlobalAugmentation/generated/out.ts')
        }).not.toThrow('TSError');
    });
});
