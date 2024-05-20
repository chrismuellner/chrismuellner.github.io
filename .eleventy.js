const yaml = require("js-yaml")
const { DateTime } = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");
const markdownIt = require("markdown-it");
const markdownItClass = require('@toycode/markdown-it-class');

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    // "./public/": "/",
    "./public/img/": "/img/",
	});

  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	// Official plugins
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
	eleventyConfig.addPlugin(pluginBundle);

  	// Filters
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});

  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents))

	// Customize Markdown library settings:
	eleventyConfig.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "#",
				ariaHidden: false,
			}),
			level: [1,2,3,4],
			slugify: eleventyConfig.getFilter("slugify"),
      // linkify: true,
      // html: true,
      code: false
		});
	});

  // reference: https://www.aleksandrhovhannisyan.com/blog/custom-markdown-components-in-11ty/
  eleventyConfig.addPairedShortcode("markdown", (content) => {
    md = new markdownIt({
      linkify: true,
      html: true,
      code: false
    })

    // reference: https://matthewtole.com/articles/eleventy-markdown-tailwind/
    const mapping = {
      a: ["underline", "hover:decoration-pink-500"],
    };
    md.use(markdownItClass, mapping);

    return md.render(content);
  });

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	})

  return {
    templateFormats: [
			"md",
			"njk",
			"html",
			"liquid",
		],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
			input: "content",          // default: "."
			includes: "../_includes",  // default: "_includes"
			data: "../_data",          // default: "_data"
			output: "_site"
		},
    pathPrefix: "/",
  };
};