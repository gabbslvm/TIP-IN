// app.js
// The app shell: PAGES registry, login/logout, navigation, bell and the
// small helpers every page uses (esc, renderCards, renderTable, statusPage,
// toast, STATUS_CLASS).
//
// Needs: api (api.js), currentUser / setUser / clearUser (session.js).
// The page renderers live in student.js and coordinator.js. They are called
// lazily, so it does not matter that those files load after this one.

// =====================================================
// 1. CONSTANTS
// =====================================================
const PAGE_KEY = "tipin.page";

// Portal button -> app role. "api" is the role name the backend expects.
const PORTALS = {
    student: { label: "Student", role: "STUDENT", api: "student" },
    faculty: { label: "Faculty", role: "FACULTY", api: "professor" },
    coordinator: { label: "Program Coordinator", role: "COORDINATOR", api: "coordinator" },
};
PORTALS.professor = PORTALS.faculty;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Every course opens with these three sections first
const INITIAL_SECTIONS = ["IT21S1", "IT21S2", "IT21S3"];

const REASONS = [
    "Course is Fully Enrolled",
    "Schedule Conflict with Existing Sections",
    "High Student Demand",
    "Other",
];

// status word -> css class (colors are in styles.css) and label
const STATUS_CLASS = {
    PENDING: "warn", UNDER_REVIEW: "warn", APPROVED: "ok", REJECTED: "red",
    NEW: "info", FOR_REVIEW: "warn", DECLINED: "red",
    AVAILABLE: "ok", NEAR: "warn", FULL: "red",
};
const STATUS_LABEL = {
    PENDING: "Pending", UNDER_REVIEW: "Under Review", APPROVED: "Approved", REJECTED: "Rejected",
    NEW: "New", FOR_REVIEW: "For Review", DECLINED: "Declined",
    AVAILABLE: "Available", NEAR: "Near Full", FULL: "Full",
};

const ICONS = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    calendar: '<path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    megaphone: '<path d="M3 11v3l12 5V6zM15 8a4 4 0 0 1 0 8M6 15l1 5h3l-1-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9"/>',
};

// =====================================================
// 2. PAGES REGISTRY  (one list of pages per role)
// id      -> used in the URL hash and by showPage(id)
// title   -> text or function(user); sub is the line under it
// render  -> async, returns the page HTML
// mount   -> optional, runs after the HTML is in #view
// when    -> optional, hides the page from the menu unless it returns true
// =====================================================
const PAGES = {
    STUDENT: [
        { id: "dashboard", label: "Dashboard", icon: "home", title: greeting, sub: "Your enrollment at a glance.", render: () => renderStudentDashboard() },
        { id: "petitions", label: "Petitions", icon: "file", title: "Petitions", sub: "Request a new section and track your requests.", render: () => renderStudentPetitions() },
        { id: "demand", label: "Demand", icon: "chart", title: "Course Demand", sub: "Tell us which courses you want to take.", render: () => renderStudentDemand() },
        { id: "sections", label: "Sections", icon: "grid", title: "Sections", sub: "See which sections are available, near full, or full.", render: () => renderStudentSections() },
        { id: "mysections", label: "My Sections", icon: "grid", title: "My Sections", sub: "The sections you added.", render: () => renderMySections() },
        { id: "myschedule", label: "My Schedule", icon: "calendar", title: "My Schedule", sub: "Your weekly class schedule.", render: () => renderMySchedule() },
        { id: "announcements", label: "Announcements", icon: "megaphone", title: "Announcements", sub: "The latest news from the program.", render: () => renderAnnouncements() },
        { id: "settings", label: "Settings", icon: "gear", title: "Settings", sub: "Your account details.", render: () => renderSettings() },
    ],
    FACULTY: [
        { id: "dashboard", label: "Dashboard", icon: "home", title: greeting, sub: "Your teaching overview.", render: () => renderFacultyDashboard() },
        { id: "schedule", label: "My Schedule", icon: "calendar", title: "My Schedule", sub: "The sections you are teaching.", render: () => renderFacultySchedule() },
        { id: "availability", label: "Preferred Vacant Time", icon: "clock", title: "Preferred Vacant Time", sub: "Tell the coordinator when you are free to teach.", render: () => renderFacultyAvailability() },
        { id: "announcements", label: "Announcements", icon: "megaphone", title: "Announcements", sub: "The latest news from the program.", render: () => renderAnnouncements() },
        { id: "settings", label: "Settings", icon: "gear", title: "Settings", sub: "Your account details.", render: () => renderSettings() },
    ],
    COORDINATOR: [
        { id: "dashboard", label: "Dashboard", icon: "home", title: greeting, sub: "Enrollment overview.", render: () => renderCoordDashboard() },
        { id: "petitions", label: "Petition Management", icon: "file", title: "Petition Management", sub: "Review petitions submitted by students.", render: () => renderCoordPetitions() },
        { id: "sections", label: "Sections", icon: "grid", title: "Section Management", sub: "Create sections, assign professors and set schedules.", render: () => renderCoordSections() },
        { id: "courses", label: "Courses", icon: "file", title: "Courses", sub: "Add and view courses.", render: () => renderCoordCourses() },
        { id: "recommendations", label: "Recommendations", icon: "star", title: "Section Recommendations", sub: "Review courses flagged for high demand.", render: () => renderRecommendations() },
        { id: "announcements", label: "Announcements", icon: "megaphone", title: "Announcements", sub: "The latest news from the program.", render: () => renderAnnouncements() },
        { id: "settings", label: "Settings", icon: "gear", title: "Settings", sub: "Your account details.", render: () => renderSettings() },
    ],
};

function isFaculty() {
    return !!currentUser && currentUser.account === "professor";
}

function visiblePages() {
    if (!currentUser || !PAGES[currentUser.role]) return [];
    return PAGES[currentUser.role].filter(function (p) { return !p.when || p.when(currentUser); });
}

// =====================================================
// 3. SMALL HELPERS
// =====================================================
function $(id) { return document.getElementById(id); }

// Escape anything that came from the server or a form before it goes into HTML
function esc(value) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return map[c]; });
}

function prettyKey(key) {
    return String(key).replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function greeting() {
    const hour = new Date().getHours();
    const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const first = currentUser ? String(currentUser.name).trim().split(/\s+/)[0] : "";
    return "Good " + part + (first ? ", " + first : "") + "!";
}

function userRoleLabel(user) {
    if (user.account === "student") return "Student";
    if (user.account === "professor") return "Faculty";
    if (user.account === "coordinator") return "Program Coordinator";
    return user.role === "COORDINATOR" ? "Program Coordinator" : user.role === "FACULTY" ? "Faculty" : "Student";
}

// Account role from the database -> app role (null = unknown role)
function toAppRole(account) {
    const r = String(account || "").toLowerCase();
    if (r === "student") return "STUDENT";
    if (r === "professor" || r === "faculty") return "FACULTY";
    if (r === "coordinator") return "COORDINATOR";
    return null;
}

// Badge for any status word in STATUS_CLASS
function badge(status) {
    return '<span class="status ' + (STATUS_CLASS[status] || "") + '">' + esc(STATUS_LABEL[status] || status) + "</span>";
}

// Available / Near (80% or more) / Full
function sectionState(s) {
    const cap = Number(s.capacity) || 0;
    const n = Number(s.current_enrollees) || 0;
    if (cap <= 0 || n >= cap) return "FULL";
    if (n >= cap * 0.8) return "NEAR";
    return "AVAILABLE";
}

// "12 / 40" with a small bar under it
function meter(value, max, tone) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return '<div class="meter"><span class="' + (tone || "") + '" style="width:' + pct + '%"></span></div>';
}

function formatDate(value) {
    const text = String(value == null ? "" : value).slice(0, 10);
    const d = new Date(text + "T00:00:00");
    if (isNaN(d)) return text;
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function setBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
        button.dataset.label = button.textContent;
        button.textContent = label || "Please wait...";
    } else if (button.dataset.label) {
        button.textContent = button.dataset.label;
    }
    button.disabled = busy;
    button.classList.toggle("busy", busy);
}

// Red outline + message under a form field (cleared as soon as the user types)
function markInvalid(el, message) {
    el.classList.remove("invalid");
    void el.offsetWidth;                       // restart the shake animation
    el.classList.add("invalid");
    const old = el.parentNode.querySelector(".err");
    if (old) old.remove();
    const note = document.createElement("small");
    note.className = "err";
    note.textContent = message;
    el.insertAdjacentElement("afterend", note);
    el.focus();
}

function clearInvalid(el) {
    el.classList.remove("invalid");
    const note = el.parentNode.querySelector(".err");
    if (note) note.remove();
}

// "08:00" or "08:00:00" -> "8:00 AM"
function fmtTime(value) {
    const parts = String(value || "").slice(0, 5).split(":");
    const h = Number(parts[0]), m = parts[1];
    if (isNaN(h) || m == null) return String(value || "");
    return ((h + 11) % 12 + 1) + ":" + m + (h < 12 ? " AM" : " PM");
}

// Mon-Sat overview of time slots [{day_of_week, start_time, end_time}] (read-only, HTML string)
function weekGrid(slots, highlightDay) {
    return '<div class="weekGrid">' + DAYS.map(function (day) {
        const items = (slots || []).filter(function (s) { return s.day_of_week === day; })
            .sort(function (a, b) { return String(a.start_time).localeCompare(String(b.start_time)); });
        return '<div class="dayCol' + (highlightDay === day ? " hot" : "") + '"><b>' + day.slice(0, 3) + "</b>" +
            (items.length ? items.map(function (s) {
                return '<span class="slotPill">' + esc(fmtTime(s.start_time)) + " - " + esc(fmtTime(s.end_time)) + "</span>";
            }).join("") : '<span class="noSlot">-</span>') + "</div>";
    }).join("") + "</div>";
}

// IT21S1..3 for one course, from the full sections list. Uses section_code from the
// server; if the server does not send it yet, the course's first three sections
// (by id) are treated as IT21S1..3.
function initialSections(allSections, courseCode) {
    const mine = (allSections || []).filter(function (s) { return s.course_code === courseCode; })
        .sort(function (a, b) { return a.id - b.id; });
    const coded = mine.some(function (s) { return s.section_code; });
    return INITIAL_SECTIONS.map(function (code, i) {
        const section = coded ? mine.find(function (s) { return s.section_code === code; }) : mine[i];
        return { code: code, section: section || null };
    });
}

// Indicate Interest is allowed only when all three initial sections exist and are full
function allInitialFull(allSections, courseCode) {
    return initialSections(allSections, courseCode).every(function (x) {
        return x.section && sectionState(x.section) === "FULL";
    });
}

// =====================================================
// 4. RENDER HELPERS (return HTML strings)
// =====================================================

// items: [{label, value, hint?, key?}]  or a plain object like {my_petitions: 3}
function renderCards(data) {
    const items = Array.isArray(data) ? data : Object.keys(data).map(function (k) {
        return { label: prettyKey(k), value: data[k], key: k };
    });
    return '<div class="cards">' + items.map(function (c, i) {
        const numeric = typeof c.value === "number" && isFinite(c.value);
        return '<div class="card" style="--i:' + i + '">' +
            '<div class="label">' + esc(c.label) + "</div>" +
            '<div class="number"' + (c.key ? ' data-key="' + esc(c.key) + '"' : "") +
            (numeric ? ' data-count="' + c.value + '">0' : ">" + esc(c.value)) + "</div>" +
            (c.hint ? '<div class="hint">' + esc(c.hint) + "</div>" : "") +
            "</div>";
    }).join("") + "</div>";
}

// columns: [{label, key?, render?(row)}]  render() must return safe HTML (use esc)
// opts: {empty, id, animate:false, rowAttrs(row)}
function renderTable(columns, rows, opts) {
    opts = opts || {};
    if (!rows || rows.length === 0) {
        return statusPage("empty", opts.empty || "Nothing to show yet.");
    }
    const head = columns.map(function (c) { return "<th>" + esc(c.label) + "</th>"; }).join("");
    const body = rows.map(function (r, i) {
        const cells = columns.map(function (c) {
            const inner = c.render ? c.render(r) : esc(r[c.key]);
            return '<td data-label="' + esc(c.label) + '">' + inner + "</td>";
        }).join("");
        return '<tr style="--i:' + Math.min(i, 12) + '" ' + (opts.rowAttrs ? opts.rowAttrs(r) : "") + ">" + cells + "</tr>";
    }).join("");
    return '<div class="tableWrap' + (opts.animate === false ? " noAnim" : "") + '"><table' +
        (opts.id ? ' id="' + opts.id + '"' : "") + "><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
}

// kind: "loading" | "empty" | "error"
function statusPage(kind, message) {
    if (kind === "loading") {
        return '<div class="skeleton" aria-label="Loading"><div class="skelCards"><i></i><i></i><i></i><i></i></div>' +
            '<div class="skelPanel"><i></i><i></i><i></i></div></div>';
    }
    if (kind === "error") {
        return '<div class="state error"><div class="stateIcon">!</div><p>' + esc(message || "Something went wrong.") + "</p>" +
            '<button class="btn" data-act="retry">Try again</button></div>';
    }
    return '<div class="state"><div class="stateIcon">&#9711;</div><p>' + esc(message || "Nothing to show yet.") + "</p></div>";
}

// Centered notification: pops in the middle of the screen, then fades out
function toast(message, type) {
    type = type || "success";
    let stack = $("toasts");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "toasts";
        stack.className = "toastStack";
        stack.setAttribute("aria-live", "polite");
        document.body.appendChild(stack);
    }
    const box = document.createElement("div");
    box.className = "toast " + type;
    box.setAttribute("role", type === "error" ? "alert" : "status");
    const icon = document.createElement("span");
    icon.className = "toastIcon";
    icon.textContent = type === "error" ? "!" : "\u2713";
    const text = document.createElement("span");
    text.className = "toastText";
    text.textContent = message;
    box.appendChild(icon);
    box.appendChild(text);
    stack.appendChild(box);
    while (stack.children.length > 2) stack.firstChild.remove();
    setTimeout(function () {
        box.classList.add("out");
        setTimeout(function () { box.remove(); }, 300);
    }, type === "error" ? 3800 : 2800);
}

function toastError(error) {
    toast(error && error.message ? error.message : "Something went wrong.", "error");
}

// Count a number up (or down) so changes are easy to notice
function countTo(el, target) {
    const from = Number(el.textContent) || 0;
    if (from === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = target;
        return;
    }
    const start = performance.now();
    const duration = 650;
    function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function animateCounts(root) {
    root.querySelectorAll("[data-count]").forEach(function (el) {
        countTo(el, Number(el.dataset.count) || 0);
    });
}

// Change one dashboard/summary card number after the page is already drawn
function setCard(root, key, value) {
    const el = root.querySelector('.number[data-key="' + key + '"]');
    if (el) {
        el.dataset.count = value;
        countTo(el, value);
    }
}

function flashRow(el) {
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
}

// =====================================================
// 5. SHARED PAGES: ANNOUNCEMENTS + SETTINGS
// =====================================================
function renderAnnouncementList(list, emptyText) {
    if (!list || list.length === 0) return statusPage("empty", emptyText || "No announcements yet.");
    return list.map(function (a, i) {
        return '<div class="announce" style="--i:' + i + '"><b>' + esc(a.title) + '</b><span class="muted">' + esc(a.message) + "</span></div>";
    }).join("");
}

async function renderAnnouncements() {
    const list = await api("/api/announcements");
    const form = currentUser.role === "COORDINATOR"
        ? '<div class="panel"><div class="panelHead"><h3>Post Announcement</h3></div>' +
            '<div class="field"><label for="annTitle">Title</label><input id="annTitle" placeholder="Announcement title"></div>' +
            '<div class="field"><label for="annMsg">Message</label><textarea id="annMsg" rows="3" placeholder="Write the announcement..."></textarea></div>' +
            '<button class="btn" data-act="annPost">Post</button></div>'
        : "";
    return form + '<div class="panel"><div class="panelHead"><h3>Announcements</h3>' +
        '<span class="muted" id="annCount">' + list.length + (list.length === 1 ? " item" : " items") + "</span></div>" +
        '<div id="annList">' + renderAnnouncementList(list) + "</div></div>";
}

async function renderSettings() {
    const u = currentUser;
    const rows = [["Name", u.name], ["Email", u.email || "Not available"], ["Role", userRoleLabel(u)]];
    return '<div class="panel"><div class="panelHead"><h3>Account</h3></div><dl class="details">' +
    rows.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
    '</dl><button class="btn" data-act="logout">Log Out</button></div>' +
    '<div class="panel"><div class="panelHead"><h3>Change Password</h3></div>' +
    '<div class="formGrid">' +
    '<div class="field"><label for="curPass">Current Password</label><input id="curPass" type="password" autocomplete="current-password"></div>' +
    '<div class="field"><label for="newPass">New Password</label><input id="newPass" type="password" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
    '<div class="field"><label for="confPass">Confirm New Password</label><input id="confPass" type="password" autocomplete="new-password"></div></div>' +
    '<button class="btn" data-act="changePass">Update Password</button></div>';
}

// =====================================================
// 6. EVENT ACTIONS (data-act / data-change / data-input in the page HTML)
// student.js and coordinator.js add their own handlers to ACTIONS.
// =====================================================
const ACTIONS = {
    go: function (el) { showPage(el.dataset.page); },
    retry: function () { showPage(currentPageId); },
    logout: function () { openLogoutModal(); },
};

ACTIONS.annPost = async function (button) {
    const title = $("annTitle"), msg = $("annMsg");
    if (!title.value.trim()) { markInvalid(title, "Enter a title."); return; }
    if (!msg.value.trim()) { markInvalid(msg, "Enter a message."); return; }

    setBusy(button, true, "Posting...");
    try {
        await api("/api/announcements", "POST", { title: title.value.trim(), message: msg.value.trim() });
        toast("Announcement posted!", "success");
        title.value = ""; msg.value = "";
        const list = await api("/api/announcements");
        $("annList").innerHTML = renderAnnouncementList(list);
        $("annCount").textContent = list.length + (list.length === 1 ? " item" : " items");
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

ACTIONS.changePass = async function (button) {
    const cur = $("curPass"), nw = $("newPass"), cf = $("confPass");
    if (!cur.value) { markInvalid(cur, "Enter your current password."); return; }
    if (nw.value.length < 8) { markInvalid(nw, "Use at least 8 characters."); return; }
    if (nw.value !== cf.value) { markInvalid(cf, "Passwords do not match."); return; }

    setBusy(button, true, "Updating...");
    try {
        await api("/api/auth/password", "POST", {
            user_id: currentUser.id, current_password: cur.value, new_password: nw.value,
        });
        toast("Password updated!", "success");
        cur.value = ""; nw.value = ""; cf.value = "";
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

function bindViewEvents() {
    const view = $("view");
    function dispatch(attr) {
        return function (e) {
            const el = e.target.closest("[" + attr + "]");
            if (!el || el.disabled) return;
            const fn = ACTIONS[el.getAttribute(attr)];
            if (fn) fn(el, e);
        };
    }
    view.addEventListener("click", dispatch("data-act"));
    view.addEventListener("change", dispatch("data-change"));
    view.addEventListener("input", function (e) {
        if (e.target.classList && e.target.classList.contains("invalid")) clearInvalid(e.target);
        dispatch("data-input")(e);
    });

    // menu items
    $("nav").addEventListener("click", function (e) {
        const item = e.target.closest("[data-page],[data-act]");
        if (!item) return;
        if (item.dataset.act === "logout") {
            openLogoutModal();
        } else {
            showPage(item.dataset.page);
        }
    });
}

// =====================================================
// 7. NAVIGATION
// =====================================================
let currentPageId = null;
let navToken = 0;   // lets a slow response notice that the user already moved on

function buildNav() {
    const pages = visiblePages();
    function icon(name) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
    }
    $("nav").innerHTML =
        '<div class="navUser"><div class="navAvatar">' + esc(String(currentUser.name).trim().charAt(0).toUpperCase()) + "</div>" +
        "<div><b>" + esc(currentUser.name) + "</b><small>" + esc(userRoleLabel(currentUser)) + "</small></div></div>" +
        pages.map(function (p, i) {
            return '<button class="navItem" data-page="' + p.id + '" style="--i:' + i + '">' + icon(p.icon) + "<span>" + esc(p.label) + "</span></button>";
        }).join("") +
        '<button class="navItem danger" data-act="logout" style="--i:' + pages.length + '">' + icon("logout") + "<span>Logout</span></button>";
}

async function showPage(id) {
    if (!currentUser) return;
    const pages = visiblePages();
    const page = pages.find(function (p) { return p.id === id; }) || pages[0];
    if (!page) return;

    const token = ++navToken;
    currentPageId = page.id;
    try {
        sessionStorage.setItem(PAGE_KEY, page.id);
        history.replaceState(null, "", "#" + page.id);
    } catch (e) { /* ignore */ }

    // highlight the menu item
    document.querySelectorAll("#nav .navItem").forEach(function (b) {
        b.classList.toggle("active", b.dataset.page === page.id);
    });

    // title + subtitle with a small fade
    const title = typeof page.title === "function" ? page.title(currentUser) : page.title;
    const sub = typeof page.sub === "function" ? page.sub(currentUser) : page.sub;
    const titleBox = document.querySelector(".title");
    titleBox.classList.remove("swap");
    void titleBox.offsetWidth;
    titleBox.classList.add("swap");
    $("pageTitle").textContent = title;
    $("pageSub").textContent = sub;
    document.title = title.replace(/!$/, "") + " | TIP-IN";

    closeSidebar();
    closeNotifPanel();
    refreshNotifs();
    const view = $("view");
    enter(view, statusPage("loading"));
    window.scrollTo(0, 0);

    try {
        const html = await page.render();
        if (token !== navToken) return;               // user already went elsewhere
        enter(view, html);
        animateCounts(view);
        if (page.mount) page.mount(view);
    } catch (error) {
        if (token !== navToken) return;
        enter(view, statusPage("error", error.message));
    }
}

// Replace the view content and replay the entrance animation
function enter(view, html) {
    view.classList.remove("viewEnter");
    view.innerHTML = html;
    void view.offsetWidth;
    view.classList.add("viewEnter");
}

// =====================================================
// 8. HAMBURGER DRAWER
// =====================================================
function openSidebar() {
    $("side").classList.add("open");
    $("side").setAttribute("aria-hidden", "false");
    $("overlay").classList.add("show");
    $("burger").classList.add("open");
    $("burger").setAttribute("aria-expanded", "true");
    $("burger").setAttribute("aria-label", "Close menu");
    document.body.classList.add("navOpen");
    const first = document.querySelector("#nav .navItem.active") || document.querySelector("#nav .navItem");
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 120);
}

function closeSidebar() {
    const side = $("side");
    const wasOpen = side.classList.contains("open");
    side.classList.remove("open");
    side.setAttribute("aria-hidden", "true");
    $("overlay").classList.remove("show");
    $("burger").classList.remove("open");
    $("burger").setAttribute("aria-expanded", "false");
    $("burger").setAttribute("aria-label", "Open menu");
    document.body.classList.remove("navOpen");
    if (wasOpen && document.activeElement && side.contains(document.activeElement)) $("burger").focus();
}

function toggleSidebar() {
    if ($("side").classList.contains("open")) closeSidebar(); else openSidebar();
}

// Swipe: right from the left edge opens, left anywhere on the drawer closes
function bindSwipe() {
    let startX = null, startY = 0;
    document.addEventListener("touchstart", function (e) {
        const t = e.touches[0];
        startX = t.clientX; startY = t.clientY;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
        if (startX === null || document.body.classList.contains("loggedOut")) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
        const open = $("side").classList.contains("open");
        if (dy < 60 && !open && startX < 24 && dx > 70) openSidebar();
        if (dy < 60 && open && dx < -70) closeSidebar();
        startX = null;
    }, { passive: true });
}

// =====================================================
// 9. BELL  (coordinator: dot only when a recommendation is NEW)
// =====================================================
function setupBell() {
    const bell = $("bell");
    bell.hidden = false;
    $("bellDot").classList.remove("show");
    bell.setAttribute("aria-label", "Notifications");
    if (currentUser.role === "COORDINATOR") refreshBell();
}

async function refreshBell() {
    try {
        updateBell(await api("/api/recommendations"));
    } catch (e) { /* the bell is a hint, never block the app on it */ }
}

// Pass the latest recommendations list; the dot shows only for NEW items
function updateBell(list) {
    const dot = $("bellDot");
    if (!currentUser || currentUser.role !== "COORDINATOR") {
        dot.classList.remove("show");
        return;
    }
    const hasNew = Array.isArray(list) && list.some(function (r) { return r.status === "NEW"; });
    dot.classList.toggle("show", hasNew);
    $("bell").setAttribute("aria-label", hasNew ? "Notifications: new section recommendations" : "Notifications");
}

function onBellClick() {
    if (!currentUser) return;
    if (currentUser.role === "COORDINATOR") showPage("recommendations");
    else toggleNotifPanel();
}

// ---- notifications for students and faculty (read state is kept in localStorage)
let notifItems = [];

function seenKey() { return "tipin.seen." + currentUser.id; }

function loadSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey()) || "[]")); } catch (e) { return new Set(); }
}

function saveSeen(set) {
    try { localStorage.setItem(seenKey(), JSON.stringify(Array.from(set))); } catch (e) { /* ignore */ }
}

async function loadNotifs() {
    const tasks = [api("/api/announcements").catch(function () { return []; })];
    if (currentUser.role === "STUDENT") tasks.push(api("/api/petitions?student_id=" + currentUser.id).catch(function () { return []; }));
    if (currentUser.role === "FACULTY") tasks.push(api("/api/sections?professor_id=" + currentUser.id).catch(function () { return []; }));
    const r = await Promise.all(tasks);

    const items = [];
    if (currentUser.role === "STUDENT") {
        r[1].forEach(function (p) {
            if (p.status === "PENDING") return;
            items.push({ key: "pet-" + p.id + "-" + p.status, page: "petitions",
                text: "Your petition for " + p.course_code + " (" + p.desired_section + ") is now " + STATUS_LABEL[p.status] + "." });
        });
    }
    if (currentUser.role === "FACULTY") {
        r[1].forEach(function (s) {
            items.push({ key: "sec-" + s.id, page: "schedule",
                text: "You are assigned to " + s.course_code + " " + String(s.section_code).trim() + "." });
        });
    }
    r[0].forEach(function (a) {
        items.push({ key: "ann-" + (a.id != null ? a.id : a.title), page: "announcements", text: "New announcement: " + a.title });
    });
    return items;
}

async function refreshNotifs() {
    if (!currentUser || currentUser.role === "COORDINATOR") return;
    try { notifItems = await loadNotifs(); } catch (e) { return; }
    const seen = loadSeen();
    const unread = notifItems.some(function (n) { return !seen.has(n.key); });
    $("bellDot").classList.toggle("show", unread);
    $("bell").setAttribute("aria-label", unread ? "Notifications: you have new updates" : "Notifications");
}

function closeNotifPanel() {
    const panel = $("notifPanel");
    if (panel) panel.remove();
}

function toggleNotifPanel() {
    if ($("notifPanel")) { closeNotifPanel(); return; }
    const seen = loadSeen();
    const panel = document.createElement("div");
    panel.id = "notifPanel";
    panel.className = "notifPanel";
    panel.innerHTML = '<div class="notifHead">Notifications</div>' + (notifItems.length
        ? notifItems.slice(0, 15).map(function (n) {
            return '<button class="notifItem' + (seen.has(n.key) ? "" : " unread") + '" data-page="' + n.page + '">' + esc(n.text) + "</button>";
        }).join("")
        : '<div class="notifEmpty">No notifications yet.</div>');
    document.body.appendChild(panel);

    notifItems.forEach(function (n) { seen.add(n.key); });
    saveSeen(seen);
    $("bellDot").classList.remove("show");

    panel.addEventListener("click", function (e) {
        const item = e.target.closest("[data-page]");
        if (item) { closeNotifPanel(); showPage(item.dataset.page); }
    });
}

// =====================================================
// 10. LOGIN / REGISTER
// =====================================================
let selectedPortal = "";

function selectPortal(key) {
    selectedPortal = key;
    $("portalSection").style.display = "none";
    $("loginFormBox").style.display = "block";
    $("loginFormTitle").textContent = PORTALS[key].label + " Portal";
    $("inviteField").style.display = PORTALS[key].api === "student" ? "none" : "block";
    switchAuthTab("login");
}

function backToPortals() {
    $("loginFormBox").style.display = "none";
    $("portalSection").style.display = "block";
}

function switchAuthTab(tab) {
    const isLogin = tab === "login";
    $("loginForm").style.display = isLogin ? "block" : "none";
    $("registerForm").style.display = isLogin ? "none" : "block";
    $("tabLogin").classList.toggle("active", isLogin);
    $("tabRegister").classList.toggle("active", !isLogin);
}

function togglePassword(ids, checkbox) {
    ids.forEach(function (id) { $(id).type = checkbox.checked ? "text" : "password"; });
}

async function doLogin() {
    const portal = PORTALS[selectedPortal];
    if (!portal) { backToPortals(); return; }

    const email = $("loginUsername").value.trim();
    const password = $("loginPassword").value;
    if (!email || !password) {
        toast("Please enter your email and password.", "error");
        return;
    }

    const button = document.querySelector("#loginForm .btn");
    setBusy(button, true, "Logging in...");
    try {
        const account = await api("/api/auth/login", "POST", { email: email, password: password, role: portal.api });

        // the portal must match the account: Faculty -> FACULTY, Program Coordinator -> COORDINATOR, Student -> STUDENT
        const role = toAppRole(account.role);
        if (role !== portal.role) {
            throw new Error("This is not a " + portal.label + " account. Please use the correct portal.");
        }

        setUser({ id: account.id, name: account.name, email: account.email, role: role, account: String(account.role).toLowerCase(), token: account.token });
        $("loginPassword").value = "";
        enterApp(currentUser);
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
}

async function doRegister() {
    const portal = PORTALS[selectedPortal];
    if (!portal) { backToPortals(); return; }

    const name = $("regName").value.trim();
    const email = $("regEmail").value.trim();
    const password = $("regPassword").value;
    const confirm = $("regConfirm").value;

    if (!name || !email || !password) { toast("Please fill out all fields.", "error"); return; }
    if (password.length < 8) { toast("Password must be at least 8 characters.", "error"); return; }
    if (password !== confirm) { toast("Passwords do not match.", "error"); return; }

    if (portal.api !== "student") {
        body.invite_code = $("regInvite").value.trim();
        if (!body.invite_code) { toast("Enter your invitation code.", "error"); return; }
    }

    const button = document.querySelector("#registerForm .btn");
    setBusy(button, true, "Creating account...");
    try {
        await api("/api/auth/register", "POST", body);
        toast("Account created! You can now log in.", "success");
        ["regName", "regPassword", "regConfirm", "regEmail", "regInvite"].forEach(function (id) { $(id).value = ""; });
        $("loginUsername").value = email;
        switchAuthTab("login");
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
}

// =====================================================
// 11. ENTER / LEAVE THE APP
// =====================================================
function enterApp(user) {
    if (!user || !PAGES[user.role]) {          // unknown role: never show the app
        clearUser();
        showLogin();
        return;
    }
    document.body.classList.remove("loggedOut");
    document.body.classList.add("appEnter");
    $("roleTag").textContent = userRoleLabel(user);
    $("userName").textContent = user.name;
    $("userName").title = user.name;
    buildNav();
    setupBell();

    // reopen the page from the URL hash or the last visited page
    const wanted = location.hash.slice(1) || sessionStorage.getItem(PAGE_KEY) || "dashboard";
    showPage(wanted);
}

function showLogin() {
    document.body.classList.add("loggedOut");
    document.body.classList.remove("appEnter");
    $("loginFormBox").style.display = "none";
    $("portalSection").style.display = "block";
    $("loginUsername").value = "";
    $("loginPassword").value = "";
    window.scrollTo(0, 0);
}

function openLogoutModal() {
    closeSidebar();
    $("logoutModal").classList.add("show");
    const cancel = document.querySelector("#logoutModal .btn");
    if (cancel) cancel.focus();
}

function closeLogoutModal() {
    $("logoutModal").classList.remove("show");
}

function confirmLogout() {
    closeLogoutModal();
    logout();
}

function logout(reason) {
    // end the session on the server too (the token is read before clearUser runs)
    if (currentUser && currentUser.token) api("/api/auth/logout", "POST").catch(function () { /* already gone */ });
    clearUser();
    selectedPortal = "";
    currentPageId = null;
    navToken++;
    closeNotifPanel();
    notifItems = [];                                 // drop any request still in flight
    $("view").innerHTML = "";
    $("nav").innerHTML = "";
    $("bell").hidden = true;
    $("bellDot").classList.remove("show");
    $("roleTag").textContent = "";
    $("userName").textContent = "";
    $("pageTitle").textContent = "";
    $("pageSub").textContent = "";
    document.title = "TIP-IN Enrollment Support System";
    history.replaceState(null, "", location.pathname + location.search);
    closeSidebar();
    showLogin();
    if (reason) toast(reason, "error");
}

// =====================================================
// 12. START-UP
// =====================================================
function boot() {
    bindViewEvents();
    bindSwipe();

    // Enter submits the visible login or register form
    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && document.body.classList.contains("loggedOut") &&
            $("loginFormBox").style.display === "block" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
            if ($("loginForm").style.display !== "none") doLogin(); else doRegister();
        }
        if (e.key === "Escape") {
            closeSidebar();
            closeLogoutModal();
        }
    });

    // click outside the logout box closes it
    $("logoutModal").addEventListener("click", function (e) {
        if (e.target === $("logoutModal")) closeLogoutModal();
    });

    // keep the session alive while the person is active
    ["click", "keydown", "touchstart"].forEach(function (name) {
        document.addEventListener(name, touchSession, { passive: true });
    });

    // end the session when it expires (checked every 30s and when the tab becomes visible again)
    function checkExpiry() {
        if (sessionExpired()) logout("Your session expired. Please log in again.");
    }
    setInterval(checkExpiry, 30000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) checkExpiry(); });

    // log in/out in one tab is mirrored in the other tabs
    window.addEventListener("storage", function (e) {
        if (e.key !== SESSION_KEY) return;
        if (!e.newValue && currentUser) {
            currentUser = null;
            logout();
        } else if (e.newValue && !currentUser) {
            currentUser = readStoredUser();
            if (currentUser) enterApp(currentUser);
        }
    });

    // restore the session after a refresh
    // click outside the notification list closes it
    document.addEventListener("click", function (e) {
        if (!e.target.closest("#notifPanel") && !e.target.closest("#bell")) closeNotifPanel();
    });
    if (currentUser) enterApp(currentUser); else showLogin();
}

document.addEventListener("DOMContentLoaded", boot);