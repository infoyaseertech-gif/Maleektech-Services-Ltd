# Project Manager — Setup Guide

This connects a private admin page (`admin.html`) to your Firebase project so you can
upload project images/videos, and have them appear automatically on the public
**Projects** page (`projects.html`). Visitors only ever see the finished result — the
admin page is not linked anywhere in the public site, and its Upload/Delete actions are
blocked by Firebase Security Rules unless you're signed in as an admin.

Do this once. It takes about 10–15 minutes.

---

## 1. Enable the Firebase services you need

Go to the [Firebase Console](https://console.firebase.google.com), open the project
behind `maleek-tech.web.app`, and turn on:

- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → Create database → start in **production mode**
- **Storage** → Get started → keep the default bucket

## 2. Create your admin login

In **Authentication → Users → Add user**, create an account with the email/password
you'll use to sign in to `admin.html`. This is the only account that will be able to
upload or delete — anyone without these credentials cannot.

## 3. Get your web app config

**Project Settings** (gear icon) → **General** tab → scroll to **Your apps**.
If there's no web app yet, click the `</>` icon to register one (no need to add
Firebase Hosting SDK snippets — you already have hosting set up).

Copy the `firebaseConfig` object shown there, and paste the values into
`js/firebase-config.js` in this project, replacing the placeholder strings:

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

These values are safe to expose publicly — Firebase's real security boundary is the
rules you set up in the next step, not this config.

## 4. Set Firestore rules

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

This lets anyone **read** project data (so the public Projects page works), but only
a **signed-in** user (you) can create, edit, or delete entries.

## 5. Set Storage rules

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

Same idea: public can view uploaded files, only a signed-in user can upload or delete them.

## 6. Deploy and test

Deploy the site as usual (same way you deploy to `maleek-tech.web.app`). Then:

1. Visit `yoursite.com/admin.html` directly (bookmark it — it's not in any menu)
2. Sign in with the account you created in step 2
3. Upload a test project with an image
4. Open `projects.html` in a normal/incognito browser tab — it should appear there automatically

## Notes

- **Extra obscurity (optional):** the real security comes from Authentication + Rules
  above, not the filename. But if you'd like the admin URL itself to be harder to
  stumble on, you can rename `admin.html` to something less guessable
  (e.g. `mt-console-8842.html`) — just remember your own URL.
- **Adding more admins:** add their email under Authentication → Users. Anyone not
  listed there can never sign in, no matter what URL they find.
- **Video files:** large videos will take longer to upload depending on file size and
  connection speed — the progress bar on the admin page shows upload progress.
