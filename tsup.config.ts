import { defineConfig } from 'tsup'

export default defineConfig([
  // ✅ Node build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    outDir: 'dist',
    platform: 'node', // <--- important
    target: 'node18',
  },

  // ✅ Browser build
  {
    entry: {
      // you can reuse same entry if it’s isomorphic
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: false, // or separate .d.ts if you want
    splitting: false,
    sourcemap: true,
    treeshake: true,
    minify: false,
    outDir: 'dist/browser',
    platform: 'browser', // <--- THIS
    target: 'es2020',
    shims: true, // adds minimal process/Buffer shims, helps in browser
  },
])
