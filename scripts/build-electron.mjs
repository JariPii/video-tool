import { build } from 'esbuild';

const common = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  external: ['electron'],
};

await Promise.all([
  build(
    {
      ...common,
      entryPoints: ['electron/main.ts'],
      outfile: 'dist-electron/main.js',
      format: 'esm',
    },
    build({
      ...common,
      entryPoints: ['electron/preload.ts'],
      outfile: 'dist-electron/preload.js',
      format: 'cjs',
    }),
  ),
]);

console.log('Electron build complete');
