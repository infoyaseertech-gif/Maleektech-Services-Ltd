# Project Manager — Setup Guide

This connects a private upload page (`project-manager.html`) to **its own, brand-new
Firebase project** — completely separate from `maleek-tech.web.app` (the ERP, built
and managed by a different developer). Nothing here touches that project, and you
don't need any access to it.

Once set up, you upload project images/videos through `project-manager.html`, and
they appear automatically on the public **Projects** page (`projects.html`).
Visitors never see the upload page — it isn't linked anywhere in the site's menus,
and its Upload/Delete actions are blocked by Firebase Security Rules unless you're
signed in.

Takes about 10–15 minutes.

---

## 1. Create a new, dedicated Firebase project

Go to the [Firebase Console](https://console.firebase.google.com) → **Add project**.
Give it any name you like (e.g. "Maleektech Projects Gallery") — this is a fresh
project with nothing in it, unrelated to the ERP.

## 2. Enable the services you need

Inside this new project, turn on:

- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → Create database → start in **production mode**
- **Storage** → Get started → keep the default bucket

## 3. Create your login

**Authentication → Users → Add user** — create the email/password you'll use to sign
in to `project-manager.html`. This is the only account that can upload or delete.

## 4. Get your web app config

**Project Settings** (gear icon) → **General** tab → **Your apps** → click `</>` to
register a new web app (name it anything, e.g. "Website"). No need to add Hosting.

Copy the `firebaseConfig` object shown, and paste the values into
`js/firebase-config.js`, replacing the placeholders:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

These values are safe to expose publicly — the real security boundary is the rules
below, not this config.

## 5. Set Firestore rules

**Firestore Database → Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Anyone can **read** (so the public Projects page works); only a **signed-in** user
(you) can create, edit, or delete entries.

## 6. Set Storage rules

**Storage → Rules**, replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 7. Where to host the site files

This is a set of static files (HTML/CSS/JS) — they can be hosted anywhere: this new
Firebase project's own Hosting (free), Netlify, cPanel, or wherever you'd like the
main marketing site to live. It does **not** need to be on `maleek-tech.web.app` and
is entirely independent of the ERP.

If you'd like to use this new Firebase project's Hosting too, that's a separate
optional step — ask if you want help with that.

## 8. Test it

1. Visit `yoursite.com/project-manager.html` directly (bookmark it — it's in no menu)
2. Sign in with the account from step 3
3. Upload a test project with an image
4. Open `projects.html` in a normal or incognito tab — it should appear automatically

## Notes

- **Extra obscurity (optional):** real security is Authentication + Rules above, not
  the filename. If you'd like the URL itself to be harder to stumble on, rename
  `project-manager.html` to something less guessable — just remember it.
- **Adding more admins:** add their email under Authentication → Users. Anyone not
  listed can never sign in, regardless of the URL.
- **Completely isolated from the ERP:** this uses its own Firebase project, its own
  login system, and its own database — nothing here can affect or interfere with
  `maleek-tech.web.app` or the other developer's work.
