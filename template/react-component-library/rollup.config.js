import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json'));

import postcss from "rollup-plugin-postcss";


export default [
  {
    input: "./src/index.ts",
    output: [

      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file:  pkg.module,
        // file: "./dist/index.mjs",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json"}),
      postcss(),
    ],
  },
  {
    input: "./dist/esm/index.d.ts",
    output: [{ file: "./dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.(css|less|scss)$/],
  },
];