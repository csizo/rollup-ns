
import * as ts from 'typescript';
import { Config } from '../../src/Config';
import { RollupNs } from '../../src/RollupNs';

describe('rollup-ns', () => {
    it('Scoped augmentation is compilable', async () => {
        const testName = 'ScopedAugmentation';
        
        const config = new Config();
        config.src = `./tests/${testName}/es6`;
        config.target = `./tests/${testName}/ns/${testName}.ts`;
        config.targetNs = `Samples.${testName}`;

        const rollupNs = new RollupNs();
        await rollupNs.run({ config: config })

        const configFileName = ts.findConfigFile(
            `./tests/${testName}/ns`,
            ts.sys.fileExists,
            "tsconfig.json"
        );
        const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
        const compilerOptions = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            `./tests/${testName}/ns`
        );

        const host = ts.createCompilerHost(compilerOptions.options);
        const program = ts.createProgram({
            host: host,
            options: compilerOptions.options,
            rootNames: [...compilerOptions.fileNames],
        });
        const emitResult = program.emit();
        
        const allDiagnostics = compilerOptions.errors.concat(emitResult.diagnostics).concat(ts.getPreEmitDiagnostics(program));

        allDiagnostics.forEach(diagnostic => {
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
            }
        });

        expect(allDiagnostics.length).toBe(0);
    });
});
