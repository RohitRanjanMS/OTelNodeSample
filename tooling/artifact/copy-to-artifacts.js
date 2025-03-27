import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, cpSync } from 'node:fs'
import { join, resolve } from 'node:path'
import chalk from 'chalk'

const appDir = resolve(import.meta.dirname, '../../../')
const targetArtifactsDir = resolve(`${appDir}/.artifacts`)

if (!existsSync(targetArtifactsDir)) {
  mkdirSync(targetArtifactsDir, { recursive: true })
}

// Fetch all packages using `pnpm list`
const packagesJson = execSync('pnpm list --json --recursive --depth=-1', {
  encoding: 'utf8',
})
const packages = JSON.parse(packagesJson)

// Copy all `.artifacts/ci/` content to `.artifacts/`
for (const { name, path } of packages) {
  if (name.startsWith('@gradientedge/keystone-app-')) {
    const appId = name.slice(27)
    const packageArtifactsDir = join(path, '.artifacts/ci')
    const appTargetDir = join(targetArtifactsDir, appId)

    console.log(chalk.blueBright(`Checking for artifacts in: ${packageArtifactsDir}`))

    if (existsSync(packageArtifactsDir)) {
      mkdirSync(appTargetDir, { recursive: true })
      cpSync(packageArtifactsDir, appTargetDir, { recursive: true })
      console.log(chalk.greenBright(`Copied all artifacts for: ${appId}`))
    } else {
      console.warn(chalk.yellow(`No artifacts found for: ${appId}`))
    }
  } else if (name.startsWith('@gradientedge/keystone-openapi-docs-')) {
    const appId = name.slice(23)
    const packageArtifactsDir = join(path, '.artifacts')
    const appTargetDir = join(targetArtifactsDir, appId)
    cpSync(packageArtifactsDir, appTargetDir, { recursive: true })
    console.log(chalk.greenBright(`Copied all artifacts for: ${appId}`))
  }
}

console.log(chalk.greenBright('All CI artifacts copied successfully to .artifacts/'))
