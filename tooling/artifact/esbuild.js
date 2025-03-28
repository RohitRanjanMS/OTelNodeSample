import esbuild from "esbuild";
import fs from "node:fs";
import chalk from "chalk";

export async function packageArtifact(appDir, packagePath) {
  // The directory in which this script is located

  let isCI = false;

  const packageDir = `${appDir}/${packagePath}`;

  // The cloud provider that we're building the artifact for - either `azure` or `aws`
  const cloudProvider = process.env.KEYSTONE_CLOUD_PROVIDER ?? "aws";

  const packageJsonPath = `${packageDir}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  let sourceFileName = "index";
  if (
    !isCI &&
    cloudProvider === "aws" &&
    packageJson.name.startsWith("@gradientedge/keystone-app-int-")
  ) {
    if (fs.existsSync(`${packageDir}/src/local.ts`)) {
      sourceFileName = "local";
    }
  }

  const bannerJs = [
    // "const __dirname = import.meta.dirname;",
    // 'const __filename=(await import("node:url")).fileURLToPath(import.meta.url);',
    // 'import { createRequire as topLevelCreateRequire } from "module";',
    // "const require = topLevelCreateRequire(import.meta.url);",
  ].join("");

  const appId = packageJson.name.replace("@gradientedge/keystone-app-", "");

  let srcFile = `dist/${sourceFileName}.js`;

  if (
    fs.existsSync(`${packageDir}/src/${sourceFileName}-${cloudProvider}.ts`)
  ) {
    srcFile = `src/${sourceFileName}-${cloudProvider}.ts`;
  }

  let outDir;
  if (isCI) {
    outDir = `${packageDir}/.artifacts/ci`;
  } else {
    outDir = `${packageDir}/.artifacts/local`;
  }
  const outfile = `${outDir}/index.cjs`;

  console.log("Building package:", chalk.greenBright(packageJson.name));
  console.log(
    "Entry point:",
    chalk.blueBright(`${packageDir.slice(appDir.length + 1)}/${srcFile}`),
  );
  console.log("Output file:", chalk.yellow(outfile.slice(appDir.length)));

  await esbuild.build({
    entryPoints: [`${packageDir}/${srcFile}`],
    bundle: true,
    sourcemap: true,
    sourcesContent: true,
    minify: false,
    keepNames: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    banner: {
      js: bannerJs,
    },
    external: ["@azure/functions-core"],
    outfile,
  });

  await esbuild.build({
    entryPoints: [`${packageDir}/dist/functions/httpTrigger1.js`],
    bundle: true,
    sourcemap: true,
    sourcesContent: true,
    minify: false,
    keepNames: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    banner: {
      js: bannerJs,
    },
    external: ["@azure/functions-core"],
    outfile: `${outDir}/functions/httpTrigger1.cjs`,
  });

  await esbuild.build({
    entryPoints: [`${packageDir}/dist/functions/httpTrigger2.js`],
    bundle: true,
    sourcemap: true,
    sourcesContent: true,
    minify: false,
    keepNames: false,
    platform: "node",
    target: "node20",
    format: "cjs",
    banner: {
      js: bannerJs,
    },
    external: ["@azure/functions-core"],
    outfile: `${outDir}/functions/httpTrigger2.cjs`,
  });

  if (isCI && cloudProvider === "azure") {
    if (fs.existsSync(`${packageDir}/host.json`)) {
      fs.cpSync(`${packageDir}/host.json`, `${outDir}/host.json`, {
        force: true,
        preserveTimestamps: true,
      });
      fs.writeFileSync(
        `${outDir}/package.json`,
        JSON.stringify({
          name: packageJson.name,
          version: packageJson.version,
          main: "./index.mjs",
        }),
        { flag: "w+" },
      );
    }
  }

  console.log(chalk.greenBright("Code packaging completed"));
}
