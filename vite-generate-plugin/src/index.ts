import { stringify } from 'javascript-stringify'
import { createServer, Plugin } from 'vite'

export async function createViteGeneratePlugin(): Promise<Plugin> {
  // let server: ViteDevServer

  const loadModule = await createModuleLoader()

  return {
    name: 'vite-generate-plugin',
    enforce: 'pre',
    // configureServer(_server) {
    //   const server = _server

    //   // const { moduleGraph } = server
    //   // const watcher = server.watcher

    //   // const normalGlob = normalizePath(glob)
    //   // const absoluteGlob = join(root, normalGlob)
    //   // const globMatch = picomatch(absoluteGlob)

    //   // watcher.on('all', (eventName, path) => {
    //   //   const filePath = normalizePath(path)
    //   //   if (globMatch(filePath)) {
    //   //     if (eventName === 'add' || eventName === 'addDir') {
    //   //       const module = moduleGraph.getModuleById(virtualImportNameResolved)
    //   //       if (module) moduleGraph.invalidateModule(module)
    //   //     }

    //   //     onUpdateBatched({ filePath, eventName })
    //   //   }
    //   // })
    // },

    //@ts-expect-error
    async load(id) {
      if (id.endsWith('?generate')) {
        const modId = id.slice(0, -'?generate'.length)
        const mod = await loadModule(modId)

        let dataString: string
        try {
          const result = mod.default()
          const data = result.then ? await result : result
          dataString = stringify(data)!
        } catch (e: any) {
          dataString = `(() => { throw ${stringify(e.message)})() }`
        }

        console.log('load', id, dataString)
        return `export default ${dataString}`
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
