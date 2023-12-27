const yaml = require("js-yaml")
const now = String(Date.now())

module.exports = function (eleventyConfig) {
  
  eleventyConfig.addWatchTarget('./styles/tailwind.config.js')
  eleventyConfig.addWatchTarget('./styles/tailwind.css')
  
  eleventyConfig.addPassthroughCopy({"./styles/tailwind.css": "style.css"})

  eleventyConfig.addShortcode('version', function () {
    return now
  })

  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents))

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      layouts: "_layouts"
    },
  };
};