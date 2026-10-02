# Trips app: go online

This folder is the online version of the trip app. Right now it runs in **local mode**. Local mode saves on one device only.

These steps make it save online. Then you and your wife see the same data on both phones.

Plan for about 20 minutes.

## What is in this folder

- `index.html`: the trips list (the home page).
- `outfits.html`, `today.html`, `closet.html`, `budget.html`, `packing.html`: the trip pages.
- `login.html`: the log-in page.
- `store.js`: saves the data. It works on this device, or online with Supabase.
- `private/`: your trip details (flights, where you stay, budget, looks). **This folder never goes to GitHub.**
- `supabase/schema.sql`: sets up the database.

## Step 1. Make the database (Supabase)

1. Go to supabase.com. Make a free account.
2. Click **New project**. Name it "trips". Pick a strong database password and save it.
3. Wait until the project is ready (about 2 minutes).

## Step 2. Set up the tables

1. Open `private/setup.sql`. It holds the database setup, who can log in, and your trip details. It never goes to GitHub.
2. Put your wife's email where it says `MICHAELA_EMAIL_HERE`, and remove the `--` in front of that line.
3. In Supabase, open **SQL Editor**. Paste all of `setup.sql`. Click **Run**. It is safe to run again.

## Step 2b. Make the photo folder

Cut-out clothes are stored as photos in Supabase **Storage**, in a private folder called `closet`.
`private/setup.sql` already creates it. If you ran setup.sql before this folder existed, paste the "Photo folder" part at the bottom of it into the SQL Editor and click **Run**.

## Step 3. Set the web address for log-in emails

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to your GitHub Pages address. Claude gives you this address in Step 5. You can come back to this step.

## Step 4. Connect the app

1. In Supabase, open **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Paste them into `config.js`:

   `window.TRIP_CONFIG={supabaseUrl:'PASTE URL',supabaseAnonKey:'PASTE KEY',trip:'hawaii'};`

The anon key is made to be public. The database rules only let the two emails in `members` see or change anything.

## Step 5. Put it on GitHub

Tell Claude: **"Publish the app folder to GitHub Pages."**

Claude makes the repo, uploads the app (not `private/`), and turns on GitHub Pages. Claude gives you the web address. Then do Step 3.

## Step 6. Make your logins

1. Open the web address on your phone.
2. Type your email and a password (8 characters or more). Tap **Create my login**.
3. Check your email. Tap the link. Then log in.
4. Your wife does the same on her phone, with her email.

If the app says "This email is not on the trip list", the email is not in `members`. Fix it in `private/setup.sql` and run it again.

## Step 7. Put it on your home screen (iPhone)

1. Open the web address in **Safari**.
2. Tap the **Share** button (the square with the arrow).
3. Tap **Add to Home Screen**. Tap **Add**.

Now "Trips" opens full screen, like an app, with its own icon.

## Good to know

- Saving is live. When one of you saves, the other phone updates.
- If you both change the same list at the same moment, the last save wins.
- With no signal, the app shows the last copy on your phone. Changes made with no signal can be lost.
- The photo cut-out on the Closet page downloads an AI model the first time (about 40 MB).
