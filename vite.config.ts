import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function packageName(id: string): string | null {
  const match = id.replace(/\\/g, '/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//)
  return match ? match[1] : null
}

function licenseText(name: string): string {
  const dir = path.resolve('node_modules', name)
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const file = fs.readdirSync(dir).find((f) => /^(licen[sc]e|copying)(\.|$)/i.test(f))
  const body = file ? fs.readFileSync(path.join(dir, file), 'utf8').trim() : `License: ${pkg.license ?? 'n/a'}`
  const title = `${name}@${pkg.version}`
  return `${title}\n${'='.repeat(title.length)}\n${body}`
}

function thirdPartyLicenses(): Plugin {
  return {
    name: 'third-party-licenses',
    apply: 'build',
    generateBundle(_, bundle) {
      const names = new Set<string>()
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of Object.keys(output.modules)) {
          const name = packageName(id)
          if (name) names.add(name)
        }
      }
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      for (const name of Object.keys(pkg.dependencies ?? {})) names.add(name)
      const sections = [...names].sort().map(licenseText)
      this.emitFile({
        type: 'asset',
        fileName: 'third-party-licenses.txt',
        source: `Avenge - nyílt forráskódú összetevők és licenceik\n\n${sections.join('\n\n\n')}\n`
      })
    }
  }
}

export default defineConfig(() => ({
  plugins: [react(), thirdPartyLicenses()],
  base: '/',
  build: {
    sourcemap: false
  },
  server: {
    proxy: {
      '/avenge': {
        target: 'https://api.avenge.hu:25573',
        changeOrigin: true,
        secure: true,
        ws: true
      }
    }
  }
}))
