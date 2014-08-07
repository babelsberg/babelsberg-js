var browser = require("zombie").create();
browser.visit("file://" + process.cwd() + "/standalone/test.html");
if (browser.errors.length > 0) {
    throw ["Errors:"].concat(browser.errors).join("\n");
}
