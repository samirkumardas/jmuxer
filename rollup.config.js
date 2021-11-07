// Rollup plugins
import babel from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
export default {
    input: 'src/jmuxer.js',
    output: [
        {
            file: 'example/jmuxer.min.js',
            format: 'umd',
            name: 'JMuxer',
            sourcemap: false, // 'inline'
            globals: {
                stream: 'stream',
                fs: 'fs'
            }
        },
        {
            file: 'dist/jmuxer.min.js',
            format: 'umd',
            name: 'JMuxer',
            sourcemap: false,
            globals: {
                stream: 'stream',
                fs: 'fs'
            }
        }
    ],
    onwarn: function ( message ) {
        if (message.code === 'MISSING_NODE_BUILTINS') {
            return;
        }
        console.error(message);
    },
    plugins: [
        eslint(),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        replace({
            exclude: 'node_modules/**',
            preventAssignment: true,
            ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        (process.env.NODE_ENV === 'production' && terser()),
    ],
    external: [ 'stream', 'fs' ],
};