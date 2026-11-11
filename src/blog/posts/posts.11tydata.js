module.exports = {
  layout: "layouts/post.njk",
  tags: ["post"],
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/blog/${data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => Boolean(data.draft)
  }
};
