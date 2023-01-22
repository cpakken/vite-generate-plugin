import { stringify } from 'javascript-stringify'
import { createServer, Plugin } from 'vite'

export async function createViteGeneratePlugin(): Promise<Plugin> {
  const loadModule = await createModuleLoader()

  const modCache = new WeakMap<object, string | Promise<string>>()

  const transform = (result: any) => {
    return `export default ${stringify(result)}`
  }

  return {
    name: 'vite-generate-plugin',
    enforce: 'pre',

    async load(id) {
      if (id.endsWith('?generate')) {
        const modId = id.slice(0, -'?generate'.length)

        try {
          const mod = await loadModule(modId)
          if (modCache.has(mod)) return modCache.get(mod)

          const result = mod.default()
          const data = result.then ? result.then(transform) : transform(result)
          modCache.set(mod, data)

          return data
        } catch (e: any) {
          return `export default (() => { throw ${stringify(e.message)})() }`
        }
      }
    },
  }
}

export default createViteGeneratePlugin

export async function createModuleLoader() {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    // logLevel: 'info',
    clearScreen: false,
    cacheDir: 'node_modules/.vite-generate',
    optimizeDeps: { disabled: true },

    server: { hmr: false },

    // plugins: [virutalImportGlob(glob, { root, onUpdate: globUpdate }), proxyNull(glob)],
    plugins: [],
    appType: 'custom',

    //@ts-ignore
    // ssr: { noExternal: true }, //so proxyNull can convert all imports that are not in the glob to proxyNull
  })

  //Since this plugin starts a self contained ViteServer to process routes, manually close ws
  server.ws.close()

  return async (moduleId: string) => {
    try {
      return await server.ssrLoadModule(moduleId)
    } catch (e) {
      const { moduleGraph } = server
      moduleGraph.invalidateAll()

      //Why do we need to do this to reevaluate ssrLoadModule? (invalidateAll() is not enough)

      moduleGraph.idToModuleMap.clear()
      moduleGraph.urlToModuleMap.clear()
      moduleGraph.fileToModulesMap.clear()
      moduleGraph.safeModulesPath.clear()
      throw e
    }
  }
}
