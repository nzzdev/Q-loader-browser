## Q loader browser

This is a sample Q loader running in the browser. You need a [Q server](https://nzzdev.github.io/Q-server) running to make use of it.

You can fork this directory to implement your own browser running Q loader if you want. For better user experience consider integrating Q in you render pipeline somehow and load the rendering info before sending your pages to the browser.

### Development

- run `nvm use && npm install && jspm install`.
- change env variable in `./src/loader.js`
- adjust the id in `index.html` to a document that exists in the database your Q server is using
- start a webserver with `jspm-server` in the project root
- see the rendered graphic (hopefully)

### Deployment

- run `npm run build` to generate a static jspm build in `dist/loader.js`
- put this `dist/loader.js` into the `files` folder on your q-server (same folder where the `system.js` lies)
- rename the file to `loader-YOUR_TARGET.js`
- add the file to the `config/targets.js` file on your q-server:

```js
  demo1: {
    label: "Demo 1",
    type: "web",
    context: {
      stylesheets: [],
      background: {
        color: "white"
      }
    },
    browserLoaderUrl: "https://Q_SERVER_BASE_URL/files/loader-demo1.js"
  },
```
- the embed code should now be visible in your q-editor
