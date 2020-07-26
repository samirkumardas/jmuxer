// Rollup plugins
import babel from 'rollup-plugin-babel';
import { eslint } from 'rollup-plugin-eslint';
import replace from 'rollup-plugin-replace';
import {uglify} from 'rollup-plugin-uglify';

export default {
    input: 'src/jmuxer.js',
    output: [
        {
            file: 'example/jmuxer.min.js',
            format: 'iife',
            name: 'JMuxer',
            sourcemap: false // 'inline'
        },
        {
            file: 'dist/jmuxer.min.js',
            format: 'umd',
            name: 'JMuxer',
            sourcemap: false
        }
    ],
    plugins: [
        eslint(),
        babel({
            exclude: 'node_modules/**',
        }),
        replace({
            exclude: 'node_modules/**',
            ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        (process.env.NODE_ENV === 'production' && uglify()),
    ],
};