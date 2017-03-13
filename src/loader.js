import env from 'env.json!';
import loadCSS from 'fg-loadcss';
import loadJS from 'fg-loadjs';

let insertedElements = {};

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

function loadGraphics() {
  const qItemElements = document.querySelectorAll('[id^="q-"]');

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

    fetch(`${env.Q_SERVER_BASE_URL}/rendering-info/${id}/${env.TARGET}?toolRuntimeConfig=${encodeURI(JSON.stringify(toolRuntimeConfig))}`)
      .then(response => {
        if (!response.ok || response.status >= 400) {
          throw (response);
        }
        return response.json();
      })
      .then(renderingInfo => {
        // remove all previously inserted elements
        if (insertedElements[id]) {
          while(insertedElements[id].length > 0) {
            let element = insertedElements[id].pop();
            element.parentNode.removeChild(element);
          }
        }
        loadStylesheets(renderingInfo.stylesheets, id);
        loadScripts(renderingInfo.scripts, id);
        
        if (renderingInfo.markup) {
          qItemElements.item(i).innerHTML = renderingInfo.markup;
        }
      })
  }
}

function loadStylesheets(stylesheets, id) {
  if (!insertedElements[id]) {
    insertedElements[id] = [];
  }
  if (stylesheets && stylesheets.length) {
    stylesheets
      .map(stylesheet => {
        if (!stylesheet.url && stylesheet.path) {
          stylesheet.url = `${env.Q_SERVER_BASE_URL}${stylesheet.path}`
        }
        return stylesheet;
      })
      .forEach(stylesheet => {
        if (stylesheet.url) {
          let element = loadCSS.loadCSS(stylesheet.url);
          insertedElements[id].push(element);
        } else if (stylesheet.content) {
          let style = document.createElement('style');
          style.type = 'text/css';
          style.appendChild(document.createTextNode(stylesheet.content));
          document.head.appendChild(style);
          insertedElements[id].push(style);
        }
      })
  }
}

function loadScripts(scripts, id) {
  if (!insertedElements[id]) {
    insertedElements[id] = [];
  }
  if (scripts && scripts.length) {
    script
      .map(script => {
        if (!script.url && script.path) {
          script.url = `${env.Q_SERVER_BASE_URL}${script.path}`
        }
        return script;
      })
      .forEach(script => {
        if (script.url) {
          let script = loadJS(script.url);
          insertedElements[id].push(script);
        }
      })
  }
}

const loadGraphicsDebounced = debounce(loadGraphics, 300, true);

domReady.then(() => {
  loadGraphicsDebounced();
  
  window.addEventListener('resize', () => {
    loadGraphicsDebounced();
  });
});
