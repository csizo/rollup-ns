# rollup-ns

The ES6 to global namespace code transformation utility.

**Rollup-ns** is a node command producing a single (rolled-up) Namespace'd source code from the source ES6 modules.

## Why?

To support single-file namespace organized module output from the ES6 modularized solution. While transpiling and module bundling can solve much but this is not addressable by any of these tools. This scenario is not supported by the typescript compiler, and bundle tools like *babel* or *rollup*.

**rollup-ns** solves this scenario with custom source file transformation and module imports aware target namespace source code building. 

## How it works?

* rollup-ns reads all the ES6 modules in the given directory and subdirectories.
* changes original ES6 imports to namespace type imports.
* generates one single file containing the namespace organized modules.

*Note*: rollup-ns never changes the original sources but always rewrite the *single* output file. If you are customizing the generated namespaces use declaration merging and never make changes to the generated file.

## Configuration

some notes about the configuration...

## Source Limitations

1. global module augmentation with ES6 *declare module* is not supported. 

To declare an "*extension*" such as Array or Window extensions the original ES6 module must not export any type or namespace and it must not declare the global module.

Instead define the module as the following:

    interface Array<T>;
    {
        extend():void;
    }

    extend():void
    {

    }

    array.prototype.extend = extend;

2. import * as 'es6-namespace-name' module import is not supported. 
 
**rollup-ns** needs *named* imports like this: 

    import { TypeName } from 'module';

where the imported *module* defines the type like this:

    export type TypeName = 'a' | 'b' | 'c';

3. imports from re-exporting modules are not supported.

