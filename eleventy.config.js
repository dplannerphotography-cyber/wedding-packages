// Eleventy build for dplanner.com.ng. Source in src/, output in _site/.
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/photography/assets": "photography/assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/llms.txt": "llms.txt" });
  eleventyConfig.addPassthroughCopy({ "src/llms-full.txt": "llms-full.txt" });
  eleventyConfig.addPassthroughCopy({ "src/c4d372e5192842bb90f75a6104eb6a58.txt": "c4d372e5192842bb90f75a6104eb6a58.txt" });

  // ₦180,000
  eleventyConfig.addFilter("naira", (n) => "₦" + Number(n).toLocaleString("en-NG"));

  // WhatsApp link with a pre-filled message
  eleventyConfig.addFilter("wa", function (message) {
    const number = this.ctx.site.whatsapp;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  });

  eleventyConfig.addFilter("absUrl", function (path) {
    return this.ctx.site.url + path;
  });

  // JSON-LD: output as a safe string for a <script type="application/ld+json">
  eleventyConfig.addFilter("jsonld", (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c"));

  eleventyConfig.addFilter("businessSchema", (site) => ({
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService", "Photographer"],
    "@id": site.url + "/#business",
    name: site.name,
    url: site.url + "/",
    image: site.url + "/assets/og/home.png",
    telephone: site.phoneE164,
    email: site.email,
    priceRange: "₦₦",
    founder: { "@type": "Person", name: site.leadPhotographer },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.street}, ${site.address.landmark}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 7.4019,
      longitude: 3.9056
    },
    areaServed: site.areaServed.map((name) => ({ "@type": "City", name })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.rating.value,
      reviewCount: site.rating.count
    },
    // Closing times are not confirmed yet, so only opening times are published.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        description: "2nd and last Sunday of the month",
        opens: "15:00"
      }
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Photography Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Standard Studio Portraits",
            description: "Controlled studio strobes, backdrop choice, natural skin retouching and 24-hour delivery in Yemetu, Ibadan. Same-day express delivery: +₦500 per picture."
          },
          price: "2000",
          priceCurrency: "NGN"
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Creative Concept Sessions",
            description: "Artistic concepts, moodboard styling, bespoke lighting and guided posing."
          },
          price: "3000",
          priceCurrency: "NGN"
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wedding Photography & Film Coverage",
            description: "Full-day photography and cinematic film coverage for traditional and white weddings."
          },
          price: "180000",
          priceCurrency: "NGN"
        }
      ]
    },
    sameAs: [site.social.instagram, site.social.tiktok, site.social.facebook, site.social.x, site.googleUrl]
  }));

  eleventyConfig.addFilter("packageSchema", (pkg, site) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: pkg.fullName,
    serviceType: "Wedding photography",
    description: pkg.description,
    url: `${site.url}/weddings/${pkg.slug}/`,
    provider: { "@id": site.url + "/#business" },
    areaServed: site.areaServed.map((name) => ({ "@type": "City", name })),
    offers: {
      "@type": "Offer",
      price: String(pkg.price),
      priceCurrency: "NGN",
      priceValidUntil: site.promo.ends.slice(0, 10),
      availability: "https://schema.org/InStock",
      url: `${site.url}/weddings/${pkg.slug}/`
    }
  }));

  // Only answered questions go into FAQPage markup; TODO items are left out.
  eleventyConfig.addFilter("faqSchema", (faqs) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .filter((f) => f.a)
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
  }));

  eleventyConfig.addFilter("breadcrumbSchema", (items, site) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: site.url + item.url
    }))
  }));

  // Date filters
  eleventyConfig.addFilter("dateReadable", (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });

  eleventyConfig.addFilter("dateIso", (dateObj) => {
    if (!dateObj) return "";
    return new Date(dateObj).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("dateRfc822", (dateObj) => {
    if (!dateObj || dateObj === "now") return new Date().toUTCString();
    return new Date(dateObj).toUTCString();
  });

  // Reading time estimate
  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  });

  // BlogPosting JSON-LD Schema
  eleventyConfig.addFilter("blogPostingSchema", (postData, site, pageUrl) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: postData.title,
    description: postData.description,
    image: (postData.ogImage || "/assets/og/home.png").startsWith("http")
      ? (postData.ogImage || "/assets/og/home.png")
      : site.url + (postData.ogImage || "/assets/og/home.png"),
    datePublished: postData.date ? new Date(postData.date).toISOString().slice(0, 10) : undefined,
    dateModified: postData.dateModified
      ? new Date(postData.dateModified).toISOString().slice(0, 10)
      : postData.date ? new Date(postData.date).toISOString().slice(0, 10) : undefined,
    author: {
      "@type": "Person",
      name: postData.author || site.leadPhotographer,
      jobTitle: "Lead Photographer",
      url: site.url + "/photography/"
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url + "/",
      logo: {
        "@type": "ImageObject",
        url: site.url + "/assets/og/home.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": site.url + pageUrl
    }
  }));

  // Blog posts collection (sorted newest first, excluding drafts)
  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((item) => !item.data.draft)
      .sort((a, b) => {
        return (b.date || 0) - (a.date || 0);
      });
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
