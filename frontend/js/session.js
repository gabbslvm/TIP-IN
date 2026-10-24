// session.js
// Who is logged in. The login is kept in localStorage, so it survives a page
// refresh, closing the tab, and opening the site in a new tab. It ends when:
//   - the user logs out, or
//   - the session expires (SESSION_TTL_MS after the last activity).
//
// A stored user looks like:
//   { id, name, email, role: "STUDENT" | "COORDINATION", account: "student" | "professor" | "coordinator" }
// "role" decides which pages exist, "account" is the raw role from the database.

const SESSION_KEY = "tipin.user";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;   // 8 hours of inactivity

function isValidUser(user) {
    return !!user && user.id != null && !!user.name && !!user.role;
}

// Returns { user, expiresAt } or null (missing, corrupted or expired)
function readSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !isValidUser(data.user) || !(data.expiresAt > Date.now())) return null;
        return data;
    } catch (e) {
        return null;
    }
}

function writeSession(user) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: user, expiresAt: Date.now() + SESSION_TTL_MS }));
    } catch (e) { /* storage blocked: the login still works until refresh */ }
}

function readStoredUser() {
    const session = readSession();
    if (session) return session.user;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }   // drop expired/corrupt data
    return null;
}

let currentUser = readStoredUser();

function setUser(user) {
    currentUser = user;
    writeSession(user);
}

function clearUser() {
    currentUser = null;
    try {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("tipin.page");
    } catch (e) { /* ignore */ }
}

// True when the stored session has run out (checked while the app is open)
function sessionExpired() {
    return !!currentUser && readSession() === null;
}

// Push the expiry forward while the person is actively using the app
let lastTouch = 0;
function touchSession() {
    const now = Date.now();
    if (!currentUser || now - lastTouch < 60000) return;   // at most once a minute
    lastTouch = now;
    if (readSession()) writeSession(currentUser);
}