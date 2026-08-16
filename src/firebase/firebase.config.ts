// Import the functions you need from the SDKs you need
// ⚠️ DEPRECATED — kept only to avoid breaking stale imports during refactor.
// The single source of truth is `src/firebase/firebase.ts` which
// exports `app`, `auth`, `googleProvider`, and `db` from env vars.
//
// This file is no longer imported anywhere; safe to delete after a
// clean build. Re-exports from the new module for back-compat only.
export { default } from './firebase';
export { auth, googleProvider, db } from './firebase';