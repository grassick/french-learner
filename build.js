const esbuild = require("esbuild")

const entry = "src/index.tsx"

// Also copy all files from assets to dist
const { execSync } = require('child_process')

execSync('rsync -r assets/ dist/')

esbuild.build({
  entryPoints: [entry],
  bundle: true,
  minify: false,
  outdir: "dist",
  target: "es2022",
  metafile: true,
  format: "esm",
  sourcemap: true,
}).catch(err => {
  console.error("Build failed:", err)
})
