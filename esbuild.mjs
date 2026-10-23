import esbuild from 'esbuild'

// @nextcloud/files bundles a webdav/stream path that top-level-imports Node builtins
// (string_decoder, stream, …). The code paths we use never touch it, so stub them for the browser.
const NODE_BUILTINS = /^(node:)?(string_decoder|stream|buffer|util|events|path|crypto|url|http|https|zlib|assert|os|tty|net|fs|querystring|punycode|process|constants)$/
const stubNodeBuiltins = {
    name: 'stub-node-builtins',
    setup(build) {
        build.onResolve({ filter: NODE_BUILTINS }, (args) => ({ path: args.path, namespace: 'node-stub' }))
        build.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => ({
            contents: 'const h={get:()=>()=>{}}; const s=new Proxy(function(){}, h); export default s;'
                + ' export const StringDecoder=function(){this.write=()=>"";this.end=()=>"";}; export const Buffer=undefined;',
            loader: 'js',
        }))
    },
}

const common = {
    bundle: true, format: 'esm', minify: true, target: ['es2020'], platform: 'browser',
    conditions: ['browser', 'import', 'default'], mainFields: ['browser', 'module', 'main'],
    legalComments: 'none', loader: { '.b64': 'text' }, plugins: [stubNodeBuiltins],
    define: { 'process.env.NODE_ENV': '"production"' },
}

await esbuild.build({ ...common, entryPoints: ['src/main.js'], outfile: 'js/wordcraft-main.mjs' })
await esbuild.build({ ...common, entryPoints: ['src/directedit.js'], outfile: 'js/wordcraft-directedit.mjs' })
console.log('built wordcraft-main.mjs + wordcraft-directedit.mjs')
