import yaml from "js-yaml";
import { DateTime } from "luxon";
import markdownItAnchor from "markdown-it-anchor";
import markdownIt from "markdown-it";
import markdownItClass from '@toycode/markdown-it-class';

import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginBundle from "@11ty/eleventy-plugin-bundle";
import pluginNavigation from "@11ty/eleventy-navigation";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import pluginIcons from "eleventy-plugin-icons";

export default async function (eleventyConfig) {
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

  eleventyConfig.addPlugin(pluginIcons, {
    // icon: {
    //   class: (name, source) => 'icon icon-'+ name,
    // },
    sources: [
      { name: 'simple', path: 'node_modules/simple-icons/icons' },
      { name: 'lucide', path: 'node_modules/lucide-static/icons', default: true }
    ],
  });

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
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
      level: [1, 2, 3, 4],
      slugify: eleventyConfig.getFilter("slugify"),
      // linkify: true,
      // html: true,
      code: false
    });
  });

  // reference: https://www.aleksandrhovhannisyan.com/blog/custom-markdown-components-in-11ty/
  eleventyConfig.addPairedShortcode("markdown", (content) => {
    const md = new markdownIt({
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