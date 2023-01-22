import { defineConfig } from 'tsup'

export default defineConfig(({ watch }) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: !watch,
  minify: true,
  noExternal: ['javascript-stringify'],
}))
