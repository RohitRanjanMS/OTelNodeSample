import { subscribe } from '@parcel/watcher'
import { execSync } from 'node:child_process'
import { PackageTracer } from '../packages.js'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'
import fs from 'node:fs'

const cliArgs = yargs(hideBin(process.argv))
  .option('app', {
    alias: 'a',
    type: 'string',
    description: 'App name',
    required: false,
  })
  .version(false)
  .wrap(Math.min(100, yargs.terminalWidth))
  .parse()

const packageDir = process.env.INIT_CWD
const appDir = process.cwd()

let appName
if (packageDir) {
  const packageJson = fs.readFileSync(`${packageDir}/package.json`, 'utf8')
  const tmpAppName = JSON.parse(packageJson).name
  if (tmpAppName.startsWith('@gradientedge/keystone-app-')) {
    appName = tmpAppName
    console.log('Watching application package:', appName)
  }
}

const tracer = new PackageTracer({ appsOnly: true })

await subscribe(
  appDir,
  async (err, events) => {
    const filteredEvents = events.filter((event) => {
      return (
        (event.path.includes('/src/') && event.path.endsWith('.ts')) ||
        event.path.endsWith('/package.json') ||
        event.path.endsWith('/tsconfig.json')
      )
    })
    if (filteredEvents.length) {
      const affectedPackages = tracer.getAffectedPackagesForPaths(
        filteredEvents.map((event) => event.path.slice(appDir.length + 1)),
      )
      console.log('Affected packages:', affectedPackages)
      if (affectedPackages.length) {
        if (appName) {
          if (affectedPackages.find((pkg) => pkg.name === appName)) {
            execSync(`pnpm exec turbo run package:code --filter ${appName}`, {
              stdio: 'inherit',
              cwd: appDir,
            })
          } else {
            console.log('No changes affect watched package')
          }
        } else {
          execSync('pnpm package:code', {
            stdio: 'inherit',
            cwd: appDir,
          })
        }
      }
    }
  },
  {
    ignore: ['**/node_modules/**', '**/.git/**', '**/.artifacts/**', '**/.turbo/**'],
  },
)
