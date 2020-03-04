const expect = require("chai").expect;
const NodeESModuleLoader = require("node-es-module-loader");

const loader = new NodeESModuleLoader();

const env = {
  Q_SERVER_BASE_URL: "http://q-server.st.nzz.ch",
  TARGET: "nzz_ch"
};

const renderingInfosMock = {
  "1": {
    stylesheets: [
      {
        url:
          "https://service.sophie.nzz.ch/bundle/sophie-q@^1,sophie-color@^1.css"
      }
    ],
    scripts: [
      {
        content: "load once script",
        loadOnce: true
      },
      {
        content: "load for every item script"
      }
    ]
  },
  "2": {
    loaderConfig: {
      polyfills: ["Promise", "Object.assign"],
      loadSystemJs: "production"
    },
    stylesheets: [
      {
        path: "/foo/bar.css"
      },
      {
        url:
          "https://service.sophie.nzz.ch/bundle/sophie-q@^1,sophie-color@^1.css"
      }
    ]
  },
  "3": {
    loaderConfig: {
      polyfills: ["Promise"],
      loadSystemJs: "full"
    },
    scripts: [
      {
        content: "load once script",
        loadOnce: true
      },
      {
        content: "load for every item script"
      }
    ]
  }
};

const helpersImported = loader.import("./src/helpers.js");

describe("helpers.getLoaderConfig", () => {
  it("should merge loadSystemJs with precendence for full", function() {
    return helpersImported.then(helpers => {
      let loaderConfig = helpers.getLoaderConfig(renderingInfosMock, env);
      expect(loaderConfig.loadSystemJs).to.be.equal("full");
    });
  });

  it("should merge polyfills into one and make them unique", function() {
    return helpersImported.then(helpers => {
      let loaderConfig = helpers.getLoaderConfig(renderingInfosMock, env);
      expect(loaderConfig.polyfills.length).to.be.equal(2);
      expect(loaderConfig.polyfills[1]).to.be.equal("Object.assign");
    });
  });
});

describe("helpers.getStylesheetsToLoad", () => {
  it("should merge and unique the stylesheet configs", function() {
    return helpersImported.then(helpers => {
      let stylesheetsToLoad = helpers.getStylesheetsToLoad(
        renderingInfosMock,
        env
      );
      expect(stylesheetsToLoad.length).to.be.equal(2);
      expect(stylesheetsToLoad[0].url).to.be.equal(
        "https://service.sophie.nzz.ch/bundle/sophie-q@^1,sophie-color@^1.css"
      );
      expect(stylesheetsToLoad[1].url).to.be.equal(
        "http://q-server.st.nzz.ch/foo/bar.css"
      );
    });
  });
});

describe("helpers.getScriptsToLoadOnce", () => {
  it("should merge and unique the script configs", function() {
    return helpersImported.then(helpers => {
      let scriptsToLoadOnce = helpers.getScriptsToLoadOnce(
        renderingInfosMock,
        env
      );
      expect(scriptsToLoadOnce.length).to.be.equal(1);
      expect(scriptsToLoadOnce[0].content).to.be.equal("load once script");
    });
  });
});

describe("helpers.getScriptsToLoadPerItem", () => {
  it("should remove scripts from item scripts that should load only once per page", function() {
    return helpersImported.then(helpers => {
      let scriptsToLoadPerItem = helpers.getScriptsToLoadPerItem(
        renderingInfosMock,
        env
      );
      expect(Object.keys(scriptsToLoadPerItem).length).to.be.equal(2);
      expect(scriptsToLoadPerItem["1"].length).to.be.equal(1);
    });
  });
  it("should keep equal scripts if they should get loaded/executed per item", function() {
    return helpersImported.then(helpers => {
      let scriptsToLoadPerItem = helpers.getScriptsToLoadPerItem(
        renderingInfosMock,
        env
      );
      expect(Object.keys(scriptsToLoadPerItem).length).to.be.equal(2);
      expect(scriptsToLoadPerItem["1"][0].content).to.be.equal(
        "load for every item script"
      );
      expect(scriptsToLoadPerItem["3"][0].content).to.be.equal(
        "load for every item script"
      );
    });
  });
});
