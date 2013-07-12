var self = require("sdk/self");
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: [/http:\/\/.*\.?youtube\.com\/watch.*/, /https:\/\/.*\.?youtube\.com\/watch.*/],
  contentScriptFile: [self.data.url("jquery-1.10.2.min.js"), self.data.url("inject.js")]
});