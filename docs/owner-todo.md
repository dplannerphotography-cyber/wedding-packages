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

## 6. Search Engine Verification & Sitemap Submission Guide

Follow these steps once you are ready to verify ownership in Google Search Console and Bing Webmaster Tools.

### Step 1: Google Search Console Verification

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Sign in with your Google / Gmail account.
3. You will be prompted to select a property type:
   - **Method A: Domain property (Recommended)**
     1. Enter `dplanner.com.ng` in the **Domain** box.
     2. Google will provide a **DNS TXT record** (e.g. `google-site-verification=abc123xyz...`).
     3. Log into your domain registrar / DNS provider where `dplanner.com.ng` is hosted.
     4. Add a new DNS Record:
        - **Type**: `TXT`
        - **Name / Host**: `@` (or leave blank)
        - **Value**: Paste the exact `google-site-verification=...` string from Google.
        - **TTL**: 3600 (or Default).
     5. Wait 5–15 minutes for DNS propagation, then click **Verify** in Search Console.
   - **Method B: URL-Prefix property (HTML Tag)**
     1. If you cannot edit DNS records directly, enter `https://dplanner.com.ng` in the **URL prefix** box.
     2. Choose **HTML tag** as the verification method.
     3. Copy the `content` code provided (e.g. `dZ_4x8y9...`).
     4. Open `src/_data/site.json` in this repository and paste the code into:
        ```json
        "googleSiteVerification": "YOUR_CODE_HERE"
        ```
     5. Commit, push, and let the GitHub Actions deploy finish.
     6. Return to Search Console and click **Verify**.

4. **Submit your Sitemap to Google**:
   - In Search Console, click **Sitemaps** in the left sidebar.
   - Under "Add a new sitemap", enter:
     ```text
     https://dplanner.com.ng/sitemap.xml
     ```
   - Click **Submit**. Status should show **Success**.

---

### Step 2: Bing Webmaster Tools Verification

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Sign in with your Microsoft or Google account.
3. Under "Add a site", click **Import from Google Search Console**.
   - This automatically verifies your site and imports your sitemap without needing any DNS edits or meta tags!
4. *(Optional manual method)*: If importing is not used, copy the Bing meta tag code and paste it into `src/_data/site.json`:
   ```json
   "bingSiteVerification": "YOUR_BING_CODE_HERE"
   ```
5. Confirm your sitemap is submitted in Bing under **Sitemaps**:
   ```text
   https://dplanner.com.ng/sitemap.xml
   ```

---

### Step 3: IndexNow Instant Indexing (Already Active!)

- **Status**: **Fully implemented and automated.**
- **Key**: `c4d372e5192842bb90f75a6104eb6a58`
- **Key File**: `https://dplanner.com.ng/c4d372e5192842bb90f75a6104eb6a58.txt`
- **Automation**: Every time code is merged into `main`, GitHub Actions automatically pushes your updated URLs directly to Bing and Yandex search engines via the IndexNow API. You do not need to do anything manually.
