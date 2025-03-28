import { packageArtifact } from './esbuild.js'

const appDir = process.cwd()

// The INIT_CWD environment variable is set by pnpm and represents the directory
// from which the original pnpm command was executed. This will be the package that
// we're building the artifact for.
const packageDir = process.env.INIT_CWD

await packageArtifact(appDir, packageDir.slice(appDir.length + 1))
