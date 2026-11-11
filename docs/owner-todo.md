# Owner Action Items & Integration Checklist for Samuel

This document tracks all remaining business inputs needed from Samuel Damilare to finalise production features, along with exact file locations and a complete guide for search engine verification.

---

## 1. Studio Closing Times
- **Status**: Currently hidden from public view. The live site and schema only publish the confirmed opening time (**9:00 AM** Monday–Saturday, and **3:00 PM** on the 2nd and last Sunday of each month).
- **What is needed from Samuel**:
  - Official evening closing time for Monday to Saturday (e.g., 6:00 PM, 7:00 PM, or by appointment).
  - Official closing time for Sunday afternoon sessions.
- **Where it goes in the code**:
  1. `src/_data/site.json` (line 46): Add `"closesWeekday": "18:00"` and `"closesSunday": "18:00"`.
  2. `eleventy.config.js` (lines 56–75): Add `"closes": site.closesWeekday` to the schema `OpeningHoursSpecification`.
  3. `src/blog/posts/graduation-photoshoot-prices-ideas-ibadan.md` (line 70): Update the commented hours note in Section 4.

---

## 2. Reviewer Names and Months
- **Status**: Testimonials with unconfirmed client details are currently withheld from live publication.
- **What is needed from Samuel**:
  - Real client first names (e.g., "Tunde & Bisola", "Adeola O.").
  - Real month and year of the shoot (e.g., "October 2025").
  - Optional short client quote about their experience with DPlanner.
- **Where it goes in the code**:
  1. `src/_data/wedding_stories.json` (lines 35–39):
     ```json
     "testimonial": {
       "quote": "DPlanner handled our traditional and church wedding coverage with great care...",
       "author": "Bisola & Tunde",
       "month": "October 2025"
     }
     ```
  2. `src/photography/index.njk`: The testimonials and wedding story card will activate once real names are populated.

---

## 3. Crew Size per Wedding Package
- **Status**: The website currently states "a trained crew sized to your package" with backup equipment and dual-card slots. Specific crew counts are withheld.
- **What is needed from Samuel**:
  - Exact crew breakdown for each package:
    * **Essential**: Number of shooters (e.g., 1 lead photographer + 1 cinematographer, or 1 hybrid shooter).
    * **Classic**: Number of shooters (e.g., 2 photographers + 1 cinematographer + 1 assistant).
    * **Signature Album**: Number of shooters (e.g., 2 lead photographers + 2 cinematographers + lighting assistant).
- **Where it goes in the code**:
  1. `src/_data/packages.json`: Add `"crew": "..."` or insert the shooter bullet into `features` for Essential (line 16), Classic (line 46), and Signature (line 74).
  2. `src/blog/posts/how-much-does-wedding-photography-cost-in-ibadan-2026.md`: Update Section 1 tier breakdowns with confirmed team sizes.

---

## 4. Real Wedding Story (Featured Couple)
- **Status**: The "Wedding Stories" section in `/photography/` and the template in `/blog/` are marked as drafts and hidden from the live site until a real couple's story is provided.
- **What is needed from Samuel**:
  - Couple's first names (e.g., "Kehinde & Femi").
  - Wedding date or season (e.g., "December 2025").
  - Venue/reception hall in Ibadan or Oyo State (e.g., "Jogor Centre, Ibadan" or "The Civic Centre, Ibadan").
  - Package booked (Essential, Classic, or Signature).
  - 3–5 real high-resolution photos from their wedding to place in `src/assets/portfolio/`.
  - A brief 2–3 sentence narrative of how the day went.
- **Where it goes in the code**:
  1. `src/_data/wedding_stories.json`: Replace the placeholder object with the real story details and image file paths.
  2. `src/photography/index.njk`: Uncomment the Wedding Stories section container.
  3. `src/blog/posts/wedding-story-template.md`: Update frontmatter, change `draft: true` to `draft: false`, and publish as a full editorial post.

---

## 5. 2027 Wedding Package Rates
- **Status**: Fully configured! From 1 January 2027, the site automatically switches to post-promo mode: all strike-throughs, promo countdowns, and promo text disappear cleanly, displaying "2027 prices coming soon — message us on WhatsApp for a quote".
- **What is needed from Samuel**:
  - Official 2027 prices in Naira whenever set (e.g., Essential ₦220,000, Classic ₦320,000, Signature ₦550,000, Album Add-on ₦200,000).
- **Where it goes in the code**:
  - `src/_data/packages.json`: Simply replace `null` with the number in each package object:
    * Essential (line 9): `"price2027": 220000`
    * Classic (line 39): `"price2027": 320000`
    * Signature Album (line 69): `"price2027": 550000`
    * Album Collection Add-on (line 97): `"price2027": 200000`
  *(No template editing or design changes required—the site handles the rest automatically).*

---

## 6. Search Engine Verification & Indexing Status (COMPLETED & ACTIVE)

Both Google Search Console and Bing Webmaster Tools are officially verified, and your XML sitemap is active and processing.

### Google Search Console (COMPLETED & VERIFIED)
- **Status**: **Verified & Sitemap Processed Successfully**
- **Property**: `https://dplanner.com.ng/`
- **Verification Methods Active**:
  * HTML Meta Tag: `<meta name="google-site-verification" content="GNhd6TdC0hGKcocZM1d3khWfFkQnAgLLOqgl-1Ayqdw">` (in `src/_data/site.json`)
  * HTML File: `https://dplanner.com.ng/google2288fffd4948a57b.html` (in `src/google2288fffd4948a57b.html`)
- **Sitemap**: `/sitemap.xml` (`https://dplanner.com.ng/sitemap.xml`)
- **Sitemap Status**: **Success** (13 discovered pages indexed)
- **Dashboard Access**: [Google Search Console](https://search.google.com/search-console?resource_id=https%3A%2F%2Fdplanner.com.ng%2F)

---

### Bing Webmaster Tools (COMPLETED & VERIFIED)
- **Status**: **Verified & Sitemap Submitted**
- **Property**: `https://dplanner.com.ng/`
- **Verification Method Active**:
  * HTML Meta Tag: `<meta name="msvalidate.01" content="014850FA57EFD70B1FC17D6E6E6C42C7">` (in `src/_data/site.json`)
- **Sitemap**: `https://dplanner.com.ng/sitemap.xml`
- **Sitemap Status**: **Processing** (1 known sitemap, 0 errors, 0 warnings)
- **Dashboard Access**: [Bing Webmaster Tools](https://www.bing.com/webmasters/home?siteUrl=https://dplanner.com.ng/)

---

### IndexNow Instant Indexing (COMPLETED & AUTOMATED)
- **Status**: **Active on Every Deploy**
- **Key**: `c4d372e5192842bb90f75a6104eb6a58`
- **Key File**: `https://dplanner.com.ng/c4d372e5192842bb90f75a6104eb6a58.txt`
- **Workflow**: Automated in `.github/workflows/deploy.yml` — every merge to `main` instantly pings Bing and Yandex with changed URLs. No manual action required.
