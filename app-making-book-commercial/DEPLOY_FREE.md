# Deploying on free tiers only

Verified against current pricing pages, not assumed. Every step below costs $0
and none require a credit card at signup.

## 1. Database — Neon (free forever, no expiration)

1. Sign up at neon.tech (no card needed).
2. Create a project. Copy the connection string it gives you.
3. That string is your DATABASE_URL.

Why Neon and not Render's free Postgres: Render's free database auto-deletes
30 days after creation. Neon's free tier doesn't expire.

## 2. Backend — Render (free web service)

1. Push backend/ to a GitHub repo.
2. On render.com, "New +" → "Blueprint", point it at your repo. It reads
   backend/render.yaml automatically.
3. When prompted, paste your Neon connection string as DATABASE_URL, and your
   frontend's URL (once deployed in step 3) as CLIENT_ORIGIN.
4. Render gives you a URL like https://app-making-book-backend.onrender.com.

Reality check: the free instance sleeps after 15 minutes with no traffic and
takes 30-60 seconds to wake up on the next request. Fine for an early launch;
annoying at real scale. That's the honest tradeoff of free.

## 3. Frontend (web learning app) — Vercel or Netlify (free)

Either one:
- Vercel: import the web-learning-app/ folder as a project, it reads vercel.json.
- Netlify: same, reads netlify.toml.

Set the environment variable VITE_API_URL to your Render backend URL from step 2.

## 4. Android app — free distribution, no Play Store account needed

Signing the APK is free regardless of where you distribute it:

    keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias app-making-book

Then in Android Studio: Build → Generate Signed Bundle/APK → APK → point it at
that keystore. This produces a real, signed, installable release APK — the
$25 Play fee is not required for this step.

Where to put the signed APK, free:
- Direct download: host the .apk on GitHub Releases (free) or your own site.
  Users enable "install unknown apps" once. Zero review, zero cost.
- Amazon Appstore: free developer account, 3-5 day review, reaches Fire
  tablets/TV and Android phones with the Amazon Appstore app installed.
- F-Droid: free, but requires your app to be fully open-source with a
  reproducible build — only fits if you're open-sourcing this project.

Before release build, update android-app/app/build.gradle.kts:

    release {
        buildConfigField("String", "BASE_URL", "\"https://app-making-book-backend.onrender.com/api/\"")
    }

and remove `android:usesCleartextTraffic="true"` from AndroidManifest.xml,
since your Render URL is https:// by default.

## What free tiers don't cover

- No custom domain on the free Vercel/Netlify/Render tiers without you owning
  one (a domain itself typically costs ~$10-15/year — the one piece here
  that isn't free anywhere).
- Render's cold start (30-60s) means the first request after idle is slow.
  Not a dealbreaker for a launch; worth knowing.
- Neon's 0.5GB free storage is plenty for early users, not for scale — you'll
  see it coming well before it's a problem.
