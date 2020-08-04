const {Command, flags} = require('@oclif/command')

const chokidar = require('chokidar')
const browsersync = require('browser-sync')
const {spawn} = require('child_process')
const fs = require('fs-extra')

class DevelopCommand extends Command {
  async run() {
    // Watch src files and sync to dist directory
    const {flags} = this.parse(DevelopCommand)
    const {proxy} = flags

    chokidar.watch('src/**/**.{html,json}').on('all', (event, path) => {
      switch (event) {
      case 'add':
      case 'change':
        fs.ensureDirSync(path.replace('src', 'dist').split('/').slice(0, -1).join('/'))
        fs.copyFileSync(path, path.replace('src', 'dist'))
        break
      default:
        this.log(`Unknown Event: ${event}`)
      }
    })

    const ts = spawn('./node_modules/.bin/tsc', ['--watch'])
    ts.stdout.pipe(process.stdout)

    // SCSS Process
    const scss = spawn('./node_modules/.bin/sass', ['src:dist', '--no-source-map', '--watch', '--style=compressed'])
    scss.stdout.pipe(process.stdout)

    // Browsersync
    if (proxy) {
      const bs = browsersync.create()

      bs.watch('dist/**/**').on('change', () => {
        bs.reload()
      })

      bs.init({
        proxy,
        notify: false,
      })
    }
  }
}

DevelopCommand.description = `Describe the command here
...
Extra documentation goes here
`

DevelopCommand.flags = {
  proxy: flags.string({char: 'p', description: 'URL of page to proxy'}),
}

module.exports = DevelopCommand
