function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError("array-unique expects an array.");
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
}

function getUniqueResources(resources) {
  const stringifiedResources = resources.map(resource => {
    return JSON.stringify(resource);
  });
  const uniqueResources = unique(stringifiedResources);
  return uniqueResources.map(stringifiedResource => {
    return JSON.parse(stringifiedResource);
  });
}

function resolvePath(resource, env) {
  if (!resource.url && resource.path) {
    resource.url = `${env.Q_SERVER_BASE_URL}${resource.path}`;
  }
  delete resource.path;
  return resource;
}

export function getLoaderConfig(renderingInfos, env) {
  let loaderConfig = {};
  Object.keys(renderingInfos).forEach(itemId => {
    const renderingInfo = renderingInfos[itemId];
    if (renderingInfo.loaderConfig === undefined) {
      return;
    }
    if (
      renderingInfo.loaderConfig.loadSystemJs === "production" ||
      renderingInfo.loaderConfig.loadSystemJs === "full"
    ) {
      if (loaderConfig.loadSystemJs !== "full") {
        loaderConfig.loadSystemJs = renderingInfo.loaderConfig.loadSystemJs;
      }
    }

    if (Array.isArray(renderingInfo.loaderConfig.polyfills)) {
      if (!Array.isArray(loaderConfig.polyfills)) {
        loaderConfig.polyfills = [];
      }
      loaderConfig.polyfills = loaderConfig.polyfills.concat(
        renderingInfo.loaderConfig.polyfills
      );
    }
  });

  if (Array.isArray(loaderConfig.polyfills)) {
    loaderConfig.polyfills = unique(loaderConfig.polyfills);
  }

  return loaderConfig;
}

export function getStylesheetsToLoad(renderingInfos, env) {
  let stylesheets = [];
  Object.keys(renderingInfos).forEach(itemId => {
    const renderingInfo = renderingInfos[itemId];
    if (
      renderingInfo.stylesheets === undefined ||
      !Array.isArray(renderingInfo.stylesheets)
    ) {
      return;
    }
    const stylesheetsForItem = renderingInfo.stylesheets.map(stylesheet =>
      resolvePath(stylesheet, env)
    );

    stylesheets = stylesheets.concat(stylesheetsForItem);
  });
  return getUniqueResources(stylesheets);
}

export function getScriptsToLoadOnce(renderingInfos, env) {
  let scripts = [];
  Object.keys(renderingInfos).forEach(itemId => {
    const renderingInfo = renderingInfos[itemId];
    if (
      renderingInfo.scripts === undefined ||
      !Array.isArray(renderingInfo.scripts)
    ) {
      return;
    }
    const scriptsForItem = renderingInfo.scripts
      .filter(script => {
        return script.loadOnce === true;
      })
      .map(script => resolvePath(script, env));

    scripts = scripts.concat(scriptsForItem);
  });
  return getUniqueResources(scripts);
}

export function getScriptsToLoadPerItem(renderingInfos, env) {
  let scriptsPerItem = {};
  Object.keys(renderingInfos).forEach(itemId => {
    const renderingInfo = renderingInfos[itemId];
    if (
      renderingInfo.scripts === undefined ||
      !Array.isArray(renderingInfo.scripts)
    ) {
      return;
    }
    const scriptsForItem = renderingInfo.scripts
      .filter(script => {
        return !script.loadOnce;
      })
      .map(script => resolvePath(script, env));

    scriptsPerItem[itemId] = scriptsForItem;
  });
  return scriptsPerItem;
}
