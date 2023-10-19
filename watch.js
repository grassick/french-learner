const fs = require('fs')
const esbuild = require("esbuild")

const entry = "src/index.tsx"

esbuild.context({
  write: false,
  entryPoints: [entry],
  outfile: __dirname + "/assets/index.js",
  sourcemap: true,
  sourcesContent: true,
  bundle: true,
  target: "es2022",
  plugins: [],
  define: {
    "process.env.NODE_ENV": '"development"',
    global: "window",
    "process.env": "{}"
  },
  minify: false,
  loader: {
    ".png": "dataurl"
  }
}).then(
  ctx => {
    ctx.watch()
    
    ctx.serve(
      {
        host: "localhost",
        port: 3012,
        servedir: __dirname + "/assets"
      },
    ).then(result => {
      // Server listening
      console.log("http://localhost:3012/index.html")
    }).catch(err => {
      console.error(err.message)
    })
  },
  err => {
    console.error("Build failed:", err)
  }
).catch(err => {
  console.error("Build failed:", err)
})
