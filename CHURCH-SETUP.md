# Electric City Baptist Church: Website Setup Notes

This website was made as a gift for Electric City Baptist Church. Everything works as it is, and a few quick steps let the church connect it to the accounts it already uses.

## 1. Connect the forms to Breeze (about 10 minutes)

The site has three forms:

| Form | Where it is | What it does today |
|---|---|---|
| **Contact** ("Get in Touch") | Contact page (`contact.html`) | Opens the visitor's email app, addressed to Pastor Stafford |
| **Prayer Request** | Pop-up from the homepage "Pray" card and the Contact page | Same as above |
| **Plan Your Visit** | Plan a Visit page (`visit.html`) | Same as above |

Visitors can use all three forms right away. Connecting them to Breeze sends the answers straight into Breeze, so the visitor doesn't need an email app and staff can follow up from Breeze.

**Steps (someone with Breeze admin access):**

1. In Breeze, open **Forms** and create a form for each one you want (for example "Website Contact," "Prayer Request," "Plan a Visit").
   - Contact form fields: Name, Email, Phone (optional), Topic, Message
   - Prayer form fields: Name (optional), Prayer request, "Keep private?" checkbox
   - Plan a Visit fields: Name, Email, Which Sunday, Who's coming, Notes
2. In each form's settings, turn on **email notifications** so the right person is emailed whenever someone fills it out.
3. Use the form's **Share** option to copy its link. It looks like `https://ecbc.breezechms.com/form/abc123`, the same format as the TTBI application form.
4. Open `js/app.js` and paste each link at the very top:

   ```js
   const BREEZE_FORMS = {
     contact: "https://ecbc.breezechms.com/form/abc123",
     prayer:  "https://ecbc.breezechms.com/form/def456",
     visit:   "",   // left empty = keeps the built-in version
   };
   ```

5. Save and publish. Each form with a link now shows the Breeze form right on the page. Forms left empty keep working as they do now.

Breeze's help center has more detail under "Sharing a Breeze Form."

## 2. Already connected

- **Giving:** uses the church's existing Tithe.ly form (church ID 289665), which opens right on the page.
- **Podcast:** plays the Old Lion / Young Lion episodes from the church's current site.
- **Quarterly:** links to the PDF newsletters on the current site.
- **Blog:** The Jesus Place Substack.
- **Bible Institute (TTBI):** the TTBI page shows the existing Breeze application form right on the page.

## 3. The pages

| Page | File | What it covers |
|---|---|---|
| Home | `index.html` | Service countdown, mission, 3 ways to take part, highlights, map |
| About | `about.html` | Mission, the Stafford family (with photo), story timeline, Schenectady |
| Beliefs | `beliefs.html` | Full statement of faith with Scripture references |
| Plan a Visit | `visit.html` | What to expect, visit form, directions |
| Media | `media.html` | Podcast player, video, Quarterly, blog. Link to a tab with `media.html#quarterly`, `#video` or `#blog` |
| Bible Institute | `ttbi.html` | Timothy & Titus Bible Institute details and application |
| Give | `give.html` | Tithe.ly giving |
| Contact | `contact.html` | Contact form, prayer requests, map |

**When editing:** every page has its own copy of the menu and footer, so a change there (for example a new menu link) needs to be made in all 8 files.

**Each TTBI term:** update the term dates and the three class names under "This Term's Classes" in `ttbi.html`.

## 4. Please double-check

- **"What to Expect" text** on Plan a Visit (worship, "no dress code," "kids welcome"). It was written as a friendly starting point, so please adjust it to fit.
- **Phone number** 661.236.9420 (taken from the current Contact page).
- **Podcast list** shows the 10 most recent episodes as of October 2026. New episodes need to be added to `EPISODES` in `js/app.js` until the list is connected to the podcast feed.
- **Family photo** on the About page is the one from the church's current About page.

## 5. Publishing

The site is plain HTML, CSS and JavaScript, with no build step. Upload the whole folder (all 8 `.html` pages plus `css/`, `js/` and `assets/`) to any web host, or replace the current site's files. Free hosts like Netlify, Vercel, Cloudflare Pages and GitHub Pages all work.
