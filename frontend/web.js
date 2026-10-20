// State
let selectedRole = ""; // student | professor | coordinator
let currentUser = null;
const API_URL = "https://tip-in.onrender.com";

const ROLE_LABELS = {
    student: "Student",
    professor: "Professor",
    coordinator: "Program Coordinator",
};

// ---------- API helpers ----------
function postJson(path, body) {
    return fetch(API_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then(function (response) {
        return response.json().then(function (data) {
            if (!response.ok) throw new Error(data.error || "Request failed");
            return data;
        });
    });
}

function getJson(path) {
    return fetch(API_URL + path).then(function (response) {
        return response.json().then(function (data) {
            if (!response.ok) throw new Error(data.error || "Request failed");
            return data;
        });
    });
}

function showError(error) {
    alert(
        error.message === "Failed to fetch"
            ? "Cannot reach the server. It may be waking up, try again in a minute."
            : error.message,
    );
}

// Escape text before putting it into HTML
function esc(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Show or hide password fields
function togglePassword(ids, checkbox) {
    ids.forEach(function (id) {
        document.getElementById(id).type = checkbox.checked ? "text" : "password";
    });
}

// Press Enter to submit the visible form (only on the login screen)
document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (!document.body.classList.contains("loggedOut")) return;
    if (document.getElementById("loginFormBox").style.display !== "block") return;

    const isLogin = document.getElementById("loginForm").style.display !== "none";
    if (isLogin) doLogin();
    else doRegister();
});

// ---------- Portal / login / register ----------
function selectPortal(role) {
    selectedRole = role;
    document.getElementById("portalSection").style.display = "none";
    document.getElementById("loginFormBox").style.display = "block";
    document.getElementById("loginFormTitle").textContent =
        ROLE_LABELS[role] + " Portal";
    switchAuthTab("login");
}

function backToPortals() {
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("portalSection").style.display = "block";
}

function switchAuthTab(tab) {
    const isLogin = tab === "login";
    document.getElementById("loginForm").style.display = isLogin
        ? "block"
        : "none";
    document.getElementById("registerForm").style.display = isLogin
        ? "none"
        : "block";
    document.getElementById("tabLogin").classList.toggle("active", isLogin);
    document.getElementById("tabRegister").classList.toggle("active", !isLogin);
}

function doLogin() {
    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    postJson("/api/auth/login", {
        email: email,
        password: password,
        role: selectedRole,
    })
        .then(enterSystem)
        .catch(showError);
}

function doRegister() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!name || !email || !password) {
        alert("Please fill out all fields.");
        return;
    }
    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }
    if (password !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    postJson("/api/auth/register", {
        name: name,
        email: email,
        password: password,
        role: selectedRole,
    })
        .then(function () {
            alert("Account created! You can now log in.");
            document.getElementById("regName").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("regConfirm").value = "";
            document.getElementById("loginUsername").value = email;
            document.getElementById("regEmail").value = "";
            switchAuthTab("login");
        })
        .catch(showError);
}

// Enter the system after a successful login
function enterSystem(user) {
    currentUser = user;
    document.getElementById("loginScreen").style.display = "none";
    document.body.classList.remove("loggedOut");
    document.getElementById("roleTag").textContent =
        ROLE_LABELS[user.role] || user.role;

    pageInfo.dashboard[0] = "Good Day, " + user.name + "!";
    applyRole(user.role);
    showPage("dashboard");
}

// Show only the elements allowed for this role
function applyRole(role) {
    document.querySelectorAll("[data-roles]").forEach(function (el) {
        const allowed = el.dataset.roles.split(" ");
        el.style.display = allowed.includes(role) ? "" : "none";
    });

    pageInfo.petitions[1] =
        role === "coordinator"
            ? "Review petitions submitted by students."
            : "Request the opening of a new section and track the status of your requests.";
}

// ---------- Mobile sidebar ----------
function toggleSidebar() {
    document.querySelector(".side").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("show");
}

function closeSidebar() {
    document.querySelector(".side").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
}

// Esc closes the sidebar
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSidebar();
});

// Reset when the screen grows back to desktop size
window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeSidebar();
});

// ---------- Logout ----------
function openLogoutModal() {
    closeSidebar();
    document.getElementById("logoutModal").classList.add("show");
}

function closeLogoutModal() {
    document.getElementById("logoutModal").classList.remove("show");
}

function confirmLogout() {
    closeLogoutModal();
    logout();
}

function logout() {
    currentUser = null;
    selectedRole = "";
    closeSidebar();
    document.getElementById("loginScreen").style.display = "flex";
    document.body.classList.add("loggedOut");
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("portalSection").style.display = "block";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("roleTag").textContent = "";
    pageInfo.dashboard[0] = "Good morning!";
    window.scrollTo(0, 0);
}

// Close the logout modal when clicking outside it
window.onclick = function (event) {
    const modal = document.getElementById("logoutModal");

    if (event.target === modal) {
        closeLogoutModal();
    }
};

// Page titles
const pageInfo = {
    dashboard: [
        "Good morning!",
        "Enrollment Support System • 1st Semester 2026–2027",
    ],
    petitions: [
        "Petition Management",
        "Request the opening of a new section and track the status of your requests.",
    ],
    interest: ["Course Interest", "Tell us which courses you want to take."],
    availability: ["My Availability", "Set the days and times you can teach."],
    recommendations: [
        "Section Recommendations",
        "Review courses flagged for high demand.",
    ],
    announcements: ["Announcements", "Manage system announcements."],
    settings: ["Settings", "Configure basic system settings."],
};

function showPage(pageId, button) {
    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav button").forEach(function (navButton) {
        navButton.classList.remove("active");
    });
    const navButton =
        button ||
        document.querySelector(".nav button[onclick*=\"'" + pageId + "'\"]");
    if (navButton) navButton.classList.add("active");

    document.getElementById("pageTitle").textContent = pageInfo[pageId][0];
    document.getElementById("pageSub").textContent = pageInfo[pageId][1];

    if (pageId === "interest") loadCourses();
    if (pageId === "recommendations") loadRecommendations();

    closeSidebar();
    window.scrollTo(0, 0);
}

// Redirect to the Announcements tab when the bell icon is clicked
function goToAnnouncements() {
    showPage("announcements", document.getElementById("navAnnouncements"));
}

// Search a table by keyword (skips the header row)
function filterTable(tableId, searchText) {
    const rows = document.querySelectorAll("#" + tableId + " tr");
    const text = searchText.toLowerCase();

    for (let i = 1; i < rows.length; i++) {
        rows[i].style.display = rows[i].innerText.toLowerCase().includes(text)
            ? ""
            : "none";
    }
}

// Petition data (hardcoded for demo — replace with data fetched from
// the backend once a petitions API exists, e.g. via fetch())
let petitions = [
    {
        id: "PET-2026-0028",
        reason: "Course is Fully Enrolled",
        subject: "CS 201 (Data Structures & Algorithms) - IT21S6",
        date: "May 16, 2026",
        status: "Pending",
    },
];

// Petition ID counter for new submissions (demo only)
let petitionCounter = 29;

// Rebuild the petition table from the current `petitions` array
function renderPetitions() {
    const table = document.getElementById("petitionTable");

    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    petitions.forEach(function (p) {
        const statusClass =
            p.status === "Pending" ? "warn" : p.status === "Denied" ? "red" : "";

        const row = table.insertRow(-1);
        row.innerHTML =
            "<td>" + esc(p.id) + "</td>" +
            "<td>" + esc(p.reason) + "</td>" +
            "<td>" + esc(p.subject) + "</td>" +
            "<td>" + esc(p.date) + "</td>" +
            '<td><span class="status ' + statusClass + '">' +
            esc(p.status) +
            "</span></td>";
    });

    updatePetitionCounts();
}

// Show/hide the free-text course field when "Other" is picked
function toggleOtherCourseInput() {
    const course = document.getElementById("petitionCourse").value;
    const otherInput = document.getElementById("petitionCourseOther");
    otherInput.style.display = course === "Other" ? "block" : "none";
    if (course !== "Other") {
        otherInput.value = "";
    }
}

// Submit a new petition and add it to the tracking table
function submitPetition() {
    const reason = document.getElementById("petitionType").value;
    const courseSelect = document.getElementById("petitionCourse").value;
    const courseOther = document
        .getElementById("petitionCourseOther")
        .value.trim();
    const section = document.getElementById("petitionSection").value.trim();
    const details = document.getElementById("petitionDetails").value.trim();

    const course = courseSelect === "Other" ? courseOther : courseSelect;

    if (!course || !section || !details) {
        alert(
            "Please fill out the course, desired section, and details before submitting.",
        );
        return;
    }

    const subject = course + " - " + section;

    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    petitions.unshift({
        id: "PET-2026-" + String(petitionCounter++).padStart(4, "0"),
        reason: reason,
        subject: subject,
        date: today,
        status: "Pending",
    });

    document.getElementById("petitionCourse").selectedIndex = 0;
    document.getElementById("petitionCourseOther").value = "";
    document.getElementById("petitionCourseOther").style.display = "none";
    document.getElementById("petitionSection").value = "";
    document.getElementById("petitionDetails").value = "";

    renderPetitions();
    alert("Request submitted successfully! Track its status below.");
}

// Recalculate the summary cards from the current `petitions` array
function updatePetitionCounts() {
    let pending = 0,
        approved = 0,
        denied = 0;

    petitions.forEach(function (p) {
        if (p.status === "Pending") pending++;
        else if (p.status === "Approved") approved++;
        else if (p.status === "Denied") denied++;
    });

    document.getElementById("totalPetitionsCount").textContent = petitions.length;
    document.getElementById("pendingPetitionsCount").textContent = pending;
    document.getElementById("approvedPetitionsCount").textContent = approved;
    document.getElementById("deniedPetitionsCount").textContent = denied;
}

// Draw the initial (demo) petition list on load
renderPetitions();

// ---------- STUDENT: course interest ----------
function loadCourses() {
    getJson("/api/courses")
        .then(function (courses) {
            const table = document.getElementById("interestTable");
            while (table.rows.length > 1) table.deleteRow(1);

            courses.forEach(function (c) {
                const row = table.insertRow(-1);
                row.innerHTML =
                    "<td>" + esc(c.code) + "</td>" +
                    "<td>" + esc(c.title) + "</td>" +
                    "<td>" + c.units + "</td>" +
                    '<td><button class="btn" onclick="markInterest(' +
                    c.id +
                    ")\">I'm Interested</button></td>";
            });
        })
        .catch(showError);
}

function markInterest(courseId) {
    postJson("/api/demand", { student_id: currentUser.id, course_id: courseId })
        .then(function () {
            alert("Interest recorded!");
        })
        .catch(showError);
}

// ---------- COORDINATOR: recommendations ----------
function loadRecommendations() {
    getJson("/api/recommendations")
        .then(function (list) {
            const table = document.getElementById("recTable");
            while (table.rows.length > 1) table.deleteRow(1);

            if (list.length === 0) {
                table.insertRow(-1).innerHTML =
                    '<td colspan="6" class="muted">No recommendations yet.</td>';
                return;
            }

            list.forEach(function (r) {
                const options = ["NEW", "FOR_REVIEW", "APPROVED", "DECLINED"]
                    .map(function (s) {
                        return (
                            "<option" +
                            (s === r.status ? " selected" : "") +
                            ">" +
                            s +
                            "</option>"
                        );
                    })
                    .join("");

                table.insertRow(-1).innerHTML =
                    "<td>" + esc(r.course_code) + " - " + esc(r.course_title) + "</td>" +
                    "<td>" + r.demand_count + "</td>" +
                    "<td>" + r.petition_count + "</td>" +
                    "<td>" + r.capacity + "</td>" +
                    "<td>" + esc(r.suggested_action) + "</td>" +
                    '<td><select onchange="updateRecommendation(' +
                    r.id +
                    ', this.value)">' +
                    options +
                    "</select></td>";
            });
        })
        .catch(showError);
}

function updateRecommendation(id, status) {
    fetch(API_URL + "/api/recommendations/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status }),
    })
        .then(function (response) {
            if (!response.ok) throw new Error("Update failed");
        })
        .catch(showError);
}

// ---------- PROFESSOR: availability (demo only, no backend yet) ----------
let availability = [];

function addAvailability() {
    const day = document.getElementById("availDay").value;
    const start = document.getElementById("availStart").value;
    const end = document.getElementById("availEnd").value;

    if (!start || !end || start >= end) {
        alert("Enter a valid start and end time.");
        return;
    }

    availability.push({ day: day, start: start, end: end });
    renderAvailability();
}

function renderAvailability() {
    const table = document.getElementById("availTable");
    while (table.rows.length > 1) table.deleteRow(1);

    availability.forEach(function (a) {
        table.insertRow(-1).innerHTML =
            "<td>" + esc(a.day) + "</td><td>" + esc(a.start) + "</td><td>" + esc(a.end) + "</td>";
    });
}