# Deploy Privacy Policy to GitHub Pages

Follow these steps to host the Tila privacy policy at `https://tila-app.github.io/privacy/`.

## Step 1: Create the GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. If you want an organization: create org "tila-app" first at [github.com/account/organizations/new](https://github.com/account/organizations/new)
3. Create a new repository named **`tila-app.github.io`**
   - Owner: `tila-app` (org) or your personal account
   - Visibility: **Public** (required for free GitHub Pages)
   - Initialize with a README: optional

## Step 2: Add the Privacy Policy

1. In the repo, create a folder structure: `privacy/index.html`
2. Copy the contents of `docs/github-pages/index.html` from this repo into `privacy/index.html`

**Using the GitHub web UI:**
- Click "Add file" > "Create new file"
- Type `privacy/index.html` as the filename (this creates the folder automatically)
- Paste the HTML content
- Click "Commit changes"

**Using git CLI:**
```bash
git clone https://github.com/tila-app/tila-app.github.io.git
cd tila-app.github.io
mkdir privacy
cp /path/to/tila-mobile/docs/github-pages/index.html privacy/index.html
git add .
git commit -m "Add privacy policy"
git push
```

## Step 3: Enable GitHub Pages

1. Go to your repo's **Settings** tab
2. In the left sidebar, click **Pages**
3. Under "Source", select **Deploy from a branch**
4. Branch: **main**, folder: **/ (root)**
5. Click **Save**

GitHub Pages will deploy within 1-2 minutes.

## Step 4: Verify

1. Visit: **https://tila-app.github.io/privacy/**
2. Confirm the privacy policy loads with Tila branding (dark green header, warm cream background)
3. Check that all links work (PostHog, Sentry, RevenueCat, Apple, Google privacy policy links)

## Troubleshooting

- **404 error:** Wait 2-3 minutes for GitHub Pages to build. Check Settings > Pages shows "Your site is live."
- **Wrong styling:** Make sure you copied the complete `index.html` file including the `<style>` block.
- **Custom domain:** If you want to use `tila.app/privacy` instead, configure a custom domain in Settings > Pages > Custom domain. You'll need DNS records pointing to GitHub Pages.

## What This URL Is Used For

The privacy policy URL (`https://tila-app.github.io/privacy/`) is referenced in:
- App Store Connect app listing (required field)
- Google Play Console app content declaration (required field)
- The Tila app's Progress tab (links users to the policy)
