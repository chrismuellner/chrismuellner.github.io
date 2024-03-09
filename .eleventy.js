const yaml = require("js-yaml")
const now = String(Date.now())
const markdownIt = require("markdown-it");
const markdownItClass = require('@toycode/markdown-it-class');
const dayjs = require('dayjs')

module.exports = function (eleventyConfig) {
  
  eleventyConfig.addWatchTarget('./styles/tailwind.config.js')
  eleventyConfig.addWatchTarget('./styles/tailwind.css')
  
  eleventyConfig.addPassthroughCopy({"./styles/tailwind.css": "style.css"})

  eleventyConfig.addShortcode('version', function () {
    return now
  })
  // human readable date
  eleventyConfig.addFilter("isoDate", (date) => dayjs(date).format())
  eleventyConfig.addFilter("readableDate", (date) => dayjs(date).format("MMMM D, YYYY"))

  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents))

  // markdown configuration
  const md = new markdownIt({
    linkify: true,
    html: true,
    code: false
  });

  // reference: https://matthewtole.com/articles/eleventy-markdown-tailwind/
  const mapping = {
    a: ["underline", "hover:decoration-pink-500"],
  };
  md.use(markdownItClass, mapping);

  // reference: https://www.aleksandrhovhannisyan.com/blog/custom-markdown-components-in-11ty/
  eleventyConfig.addPairedShortcode("markdown", (content) => {
    return md.render(content);
  });
  eleventyConfig.setLibrary('md', md);

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      layouts: "_layouts"
    },
  };
};