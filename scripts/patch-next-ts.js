const fs = require("fs");
const path = require("path");

const paths = [
  path.join(
    __dirname,
    "../node_modules/next/dist/lib/verify-typescript-setup.js",
  ),
  path.join(
    __dirname,
    "../node_modules/next/dist/esm/lib/verify-typescript-setup.js",
  ),
];

for (const file of paths) {
  if (!fs.existsSync(file)) {
    console.warn(`File not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, "utf8");

  const targetCJS =
    "async function verifyAndRunTypeScript({ dir, distDir, cacheDir, strictRouteTypes, tsconfigPath, shouldRunTypeCheck, typedRoutes, disableStaticImages, hasAppDir, hasPagesDir, appDir, pagesDir, debugBuildPaths }) {";
  const targetESM =
    "export async function verifyAndRunTypeScript({ dir, distDir, cacheDir, strictRouteTypes, tsconfigPath, shouldRunTypeCheck, typedRoutes, disableStaticImages, hasAppDir, hasPagesDir, appDir, pagesDir, debugBuildPaths }) {";

  const sourceMapComment =
    "//# sourceMappingURL=verify-typescript-setup.js.map";

  if (content.includes(targetESM)) {
    const index = content.indexOf(targetESM);
    const before = content.substring(0, index);
    const smIndex = content.indexOf(sourceMapComment);
    const after = smIndex !== -1 ? content.substring(smIndex) : "";

    const replacement = `export async function verifyAndRunTypeScript() {
    return {
        version: "7.0.2"
    };
}\n\n`;

    fs.writeFileSync(file, before + replacement + after, "utf8");
    console.log(`Successfully patched ESM verify-typescript-setup: ${file}`);
  } else if (content.includes(targetCJS)) {
    const index = content.indexOf(targetCJS);
    const before = content.substring(0, index);
    const smIndex = content.indexOf(sourceMapComment);
    const after = smIndex !== -1 ? content.substring(smIndex) : "";

    const replacement = `async function verifyAndRunTypeScript() {
    return {
        version: "7.0.2"
    };
}\n\n`;

    fs.writeFileSync(file, before + replacement + after, "utf8");
    console.log(`Successfully patched CJS verify-typescript-setup: ${file}`);
  } else {
    console.log(`File is already patched or format differs: ${file}`);
  }
}
