# Q loader browser

This is a sample Q loader running in the browser. You need a [Q server](https://nzzdev.github.io/Q-server) running to make use of it.

You can fork this directory to implement your own browser running Q loader if you want. For better user experience consider integrating Q in you render pipeline somehow and load the rendering info before sending your pages to the browser.

## development
- run `npm install && jspm install`.
- rename the file `env-example.json` to `env.json` and adjust the settings.
- adjust the id in `index.html` to a document that exists in the database your Q server is using
- start a webserver with `jspm-server` in the project root
- see the rendered graphic (hopefully)
- run `npm run build` to generate a static jspm build in `dist/loader.js`
- deploy this loader to the location configured as `browserLoaderUrl` in your Q server target config
