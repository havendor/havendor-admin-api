import { relative } from "path";

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => relative(process.cwd(), f)).join(" ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --write --ignore-path .prettierignore ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" ")}`;

const lintStagedConfig = {
  "*.{js,ts}": [buildEslintCommand, buildPrettierCommand],
  "*.{json,md,mdx,yml,yaml,css,scss}": [buildPrettierCommand],
};

export default lintStagedConfig;
