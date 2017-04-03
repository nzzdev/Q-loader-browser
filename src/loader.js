import env from 'env.json!';
import loadCSS from 'fg-loadcss';
import loadJS from 'fg-loadjs';
import { getLoaderConfig, getStylesheetsToLoad, getScriptsToLoadOnce, getScriptsToLoadPerItem } from './helpers.js'

let domReady = new Promise((resolve) => {
  if (document.readyState && (document.readyState === 'interactive' || document.readyState === 'complete')) {
    resolve();
  } else {
    function onReady() {
      resolve();
      document.removeEventListener('DOMContentLoaded', onReady, true);
    }
    document.addEventListener('DOMContentLoaded', onReady, true);
    document.onreadystatechange = () => {
      if (document.readyState === "interactive") {
        resolve();
      }
    }
  }
});

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function loadGraphics(qItemElements) {
  let renderingInfoPromises = [];
  for (let i = 0; i < qItemElements.length; i++) {
    const id = qItemElements.item(i).getAttribute('id').replace('q-','');

    const toolRuntimeConfig = {
      size: {
        width: [
          {
            value: qItemElements.item(i).getBoundingClientRect().width,
            comparison: '='
          }
        ]
      }
    }

    let renderingInfoPromise = fetch(`${env.Q_SERVER_BASE_URL}/rendering-info/${id}/${env.TARGET}?toolRuntimeConfig=${encodeURI(JSON.stringify(toolRuntimeConfig))}`)
      .then(response => {
        if (!response.ok || response.status >= 400) {
          throw (response);
        }
        return response.json();
      });
    renderingInfoPromises.push(renderingInfoPromise);
  }

  let scriptsToLoadOnce = [];
  let scriptsToLoadPerItem = [];

  Promise.all(renderingInfoPromises)
    .then(renderingInfos => {
      let loaderConfig = getLoaderConfig(renderingInfos, env);
      if (loaderConfig.loadSystemJs) {
        let script;
        if (loaderConfig.loadSystemJs === 'full') {
          script = {
            url: `${env.SYSTEMJS_BASE_URL}/system.js`
          };
        } else if (loaderConfig.loadSystemJs === 'production') {
          script = {
            url: `${env.SYSTEMJS_BASE_URL}/system-production.js`
          };
        }
        if (script) {
          scriptsToLoadOnce.push(script);
        }
      }
      if (Array.isArray(loaderConfig.polyfills)) {
        scriptsToLoadOnce.push({
          url: `https://cdn.polyfill.io/v2/polyfill.min.js?features=${loaderConfig.polyfills.join(',')}`
        });
      }
      return renderingInfos
    })
    .then(renderingInfos => {
      let stylesheetsToLoad = getStylesheetsToLoad(renderingInfos, env);
      loadStylesheets(stylesheetsToLoad);
      return renderingInfos;
    })
    .then(renderingInfos => {
      scriptsToLoadOnce = scriptsToLoadOnce.concat(getScriptsToLoadOnce(renderingInfos, env));
      return renderingInfos;
    })
    .then(renderingInfos => {
      scriptsToLoadPerItem = getScriptsToLoadPerItem(renderingInfos);
      return renderingInfos;
    })
    .then(renderingInfos => {
      loadScripts(scriptsToLoadOnce)
        .then(() => {
          renderingInfos.forEach((renderingInfo, index) => {
            if (typeof renderingInfo.markup === 'string') {
              qItemElements.item(index).innerHTML = renderingInfo.markup;
              loadScripts(scriptsToLoadPerItem[index]);
            }
          })
        })
    })
}

function loadStylesheets(stylesheets) {
  if (stylesheets && stylesheets.length) {
    stylesheets
      .forEach(stylesheet => {
        if (stylesheet.url) {
          let element = loadCSS.loadCSS(stylesheet.url);
        } else if (stylesheet.content) {
          let style = document.createElement('style');
          style.type = 'text/css';
          style.appendChild(document.createTextNode(stylesheet.content));
          document.head.appendChild(style);
        }
      })
  }
}

function loadScripts(scripts) {
  return new Promise((resolve, reject) => {
    if (scripts === undefined || scripts.length < 1) {
      resolve();
    }
    let script = scripts.shift();
    if (script.url !== undefined) {
      let element = loadJS(script.url, () => {
        // load next scripts
        resolve(loadScripts(scripts));
      })
    } else if (script.content) {
      let scriptElement = document.createElement('script');
      scriptElement.text = script.content;
      let head = document.head || document.body || document.documentElement;
      head.appendChild(scriptElement);
      // head.removeChild(scriptElement);

      // load next scripts
      resolve(loadScripts(scripts));
    }
  })
}

const loadGraphicsDebounced = debounce(loadGraphics, 300, true);

const qItemElements = document.querySelectorAll('[id^="q-"]');

domReady.then(() => {
  loadGraphics(qItemElements);
  
  window.addEventListener('resize', () => {
    loadGraphicsDebounced(qItemElements);
  });
});
