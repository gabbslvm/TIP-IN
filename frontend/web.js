// STATE
let selectedRole = ""; // student | professor | coordinator
let currentUser = null;
const API_URL = "https://tip-in.onrender.com";

const ROLE_LABELS = {
    student: "Student",
    professor: "Professor",
    coordinator: "Program Coordinator",
};

const RECOMMENDATION_STATUSES = ["NEW", "FOR_REVIEW", "APPROVED", "DECLINED"];
const PETITION_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

// API HELPERS
function postJson(path, body) {
    return fetch(API_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then(function (response) {
        return response.json().then(function (data) {
            if (!response.ok) {
                throw new Error(data.error || "Request failed");
            }
            return data;
        });
    });
}

function getJson(path) {
    return fetch(API_URL + path).then(function (response) {
        return response.json().then(function (data) {
            if (!response.ok) {
                throw new Error(data.error || "Request failed");
            }
            return data;
        });
    });
}

function showError(error) {
    if (error.message === "Failed to fetch") {
        alert("Cannot reach the server. It may be waking up, try again in a minute.");
    } else {
        alert(error.message);
    }
}

// SMALL HELPERS

// Escape text before putting it into HTML
function esc(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Build <option> tags from a list; the item equal to "selected" is pre-selected
function buildOptions(items, selected) {
    let html = "";
    for (let i = 0; i < items.length; i++) {
        if (items[i] === selected) {
            html += "<option selected>" + items[i] + "</option>";
        } else {
            html += "<option>" + items[i] + "</option>";
        }
    }
    return html;
}

// Show or hide password fields
function togglePassword(ids, checkbox) {
    for (let i = 0; i < ids.length; i++) {
        const field = document.getElementById(ids[i]);
        if (checkbox.checked) {
            field.type = "text";
        } else {
            field.type = "password";
        }
    }
}

// Search a table by keyword (skips the header row)
function filterTable(tableId, searchText) {
    const rows = document.querySelectorAll("#" + tableId + " tr");
    const text = searchText.toLowerCase();

    for (let i = 1; i < rows.length; i++) {
        const rowText = rows[i].innerText.toLowerCase();
        if (rowText.includes(text)) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}

// KEYBOARD AND WINDOW EVENTS

// Press Enter to submit the visible form (only on the login screen)
document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") {
        return;
    }
    if (!document.body.classList.contains("loggedOut")) {
        return;
    }
    if (document.getElementById("loginFormBox").style.display !== "block") {
        return;
    }

    if (document.getElementById("loginForm").style.display !== "none") {
        doLogin();
    } else {
        doRegister();
    }
});

// Esc closes the sidebar
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeSidebar();
    }
});

// Close the sidebar when the screen grows back to desktop size
window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
        closeSidebar();
    }
});

// Close the logout modal when clicking outside it
window.onclick = function (event) {
    const modal = document.getElementById("logoutModal");
    if (event.target === modal) {
        closeLogoutModal();
    }
};

// PORTAL / LOGIN / REGISTER
function selectPortal(role) {
    selectedRole = role;
    document.getElementById("portalSection").style.display = "none";
    document.getElementById("loginFormBox").style.display = "block";
    document.getElementById("loginFormTitle").textContent = ROLE_LABELS[role] + " Portal";
    switchAuthTab("login");
}

function backToPortals() {
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("portalSection").style.display = "block";
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");

    if (tab === "login") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
    }
}

function doLogin() {
    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (email === "" || password === "") {
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

    if (name === "" || email === "" || password === "") {
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

    let roleLabel = ROLE_LABELS[user.role];
    if (!roleLabel) {
        roleLabel = user.role;
    }
    document.getElementById("roleTag").textContent = roleLabel;

    pageInfo.dashboard[0] = "Good Day, " + user.name + "!";
    applyRole(user.role);
    showPage("dashboard");
}

// Show only the elements allowed for this role
function applyRole(role) {
    const elements = document.querySelectorAll("[data-roles]");

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const allowedRoles = element.dataset.roles.split(" ");

        if (allowedRoles.includes(role)) {
            element.style.display = "";
        } else {
            element.style.display = "none";
        }
    }
}

// MOBILE SIDEBAR
function toggleSidebar() {
    document.querySelector(".side").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("show");
}

function closeSidebar() {
    document.querySelector(".side").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
}

// LOGOUT
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

// PAGE NAVIGATION

// Page titles: [title, subtitle]
const pageInfo = {
    dashboard: [
        "Good morning!",
        "Enrollment Support System • 1st Semester 2026–2027",
    ],
    petitions: [
        "Petition Management",
        "Review petitions submitted by students.",
    ],
    recommendations: [
        "Section Recommendations",
        "Review courses flagged for high demand.",
    ],
    announcements: ["Announcements", "Manage system announcements."],
    settings: ["Settings", "Configure basic system settings."],
    studentPetitions: ["Petitions", "Request a new section and track your requests."],
    studentDemand: ["Course Demand", "Tell us which courses you want to take."],
    studentSections: ["Sections", "See which sections are available, near full, or full."],
    profSchedule: ["My Schedule", "The sections you are teaching."],
    profAvailability: ["My Availability", "Set the days and times you can teach."],
};

function showPage(pageId, button) {
    // Hide every page, then show the chosen one
    const pages = document.querySelectorAll(".page");
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }
    document.getElementById(pageId).classList.add("active");

    // Remove "active" from every sidebar button
    const navButtons = document.querySelectorAll(".nav button");
    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active");
    }

    // Highlight the sidebar button of this page
    let navButton = button;
    if (!navButton) {
        navButton = document.querySelector(".nav button[onclick*=\"'" + pageId + "'\"]");
    }
    if (navButton) {
        navButton.classList.add("active");
    }

    // Page title and subtitle
    document.getElementById("pageTitle").textContent = pageInfo[pageId][0];
    document.getElementById("pageSub").textContent = pageInfo[pageId][1];

    // Load the data of the chosen page
    if (pageId === "dashboard") {
        if (currentUser.role === "student") {
            loadStudentDashboard();
        }
        if (currentUser.role === "professor") {
            loadProfessorDashboard();
        }
    }
    if (pageId === "petitions") {
        loadCoordinatorPetitions();
    }
    if (pageId === "recommendations") {
        loadRecommendations();
    }
    if (pageId === "studentPetitions") {
        loadStudentPetitions();
    }
    if (pageId === "studentDemand") {
        loadStudentDemand();
    }
    if (pageId === "studentSections") {
        loadStudentSections();
    }
    if (pageId === "profSchedule") {
        loadProfessorSchedule();
    }
    if (pageId === "profAvailability") {
        loadProfessorAvailability();
    }

    closeSidebar();
    window.scrollTo(0, 0);
}

// Go to the Announcements page when the bell icon is clicked
function goToAnnouncements() {
    showPage("announcements", document.getElementById("navAnnouncements"));
}

// COORDINATOR: RECOMMENDATIONS
function loadRecommendations() {
    getJson("/api/recommendations")
        .then(function (list) {
            const table = document.getElementById("recTable");

            // Delete every row except the header row
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }

            if (list.length === 0) {
                table.insertRow(-1).innerHTML =
                    '<td colspan="6" class="muted">No recommendations yet.</td>';
                return;
            }

            for (let i = 0; i < list.length; i++) {
                const r = list[i];
                const options = buildOptions(RECOMMENDATION_STATUSES, r.status);

                table.insertRow(-1).innerHTML =
                    "<td>" + esc(r.course_code) + " - " + esc(r.course_title) + "</td>" +
                    "<td>" + r.demand_count + "</td>" +
                    "<td>" + r.petition_count + "</td>" +
                    "<td>" + r.capacity + "</td>" +
                    "<td>" + esc(r.suggested_action) + "</td>" +
                    '<td><select onchange="updateRecommendation(' + r.id + ', this.value)">' +
                    options +
                    "</select></td>";
            }
        })
        .catch(showError);
}

function updateRecommendation(id, status) {
    putJson("/api/recommendations/" + id, { status: status })
        .then(function () {
            toast("Status updated", "success");
        })
        .catch(toastError);
}

// COORDINATOR: PETITIONS
function loadCoordinatorPetitions() {
    getJson("/api/petitions")
        .then(function (list) {
            const table = document.getElementById("petitionTable");

            // Delete every row except the header row
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }

            if (list.length === 0) {
                table.insertRow(-1).innerHTML =
                    '<td colspan="5" class="muted">No petitions yet.</td>';
            }

            let pending = 0;
            let approved = 0;
            let rejected = 0;

            for (let i = 0; i < list.length; i++) {
                const p = list[i];

                // Count for the summary cards
                if (p.status === "PENDING" || p.status === "UNDER_REVIEW") {
                    pending = pending + 1;
                } else if (p.status === "APPROVED") {
                    approved = approved + 1;
                } else if (p.status === "REJECTED") {
                    rejected = rejected + 1;
                }

                const options = buildOptions(PETITION_STATUSES, p.status);

                table.insertRow(-1).innerHTML =
                    "<td>PET-" + p.id + "</td>" +
                    "<td>" + esc(p.reason) + "</td>" +
                    "<td>" + esc(p.course_code) + " - " + esc(p.course_title) +
                    " (" + esc(p.desired_section) + ")<br>" +
                    '<span class="muted">' + esc(p.student_name) + "</span></td>" +
                    "<td>" + esc(p.date_submitted.substring(0, 10)) + "</td>" +
                    '<td><select onchange="updatePetitionStatus(' + p.id + ', this.value)">' +
                    options +
                    "</select></td>";
            }

            document.getElementById("totalPetitionsCount").textContent = list.length;
            document.getElementById("pendingPetitionsCount").textContent = pending;
            document.getElementById("approvedPetitionsCount").textContent = approved;
            document.getElementById("deniedPetitionsCount").textContent = rejected;
        })
        .catch(toastError);
}

function updatePetitionStatus(id, status) {
    putJson("/api/petitions/" + id, { status: status })
        .then(function () {
            toast("Status updated", "success");
            loadCoordinatorPetitions();
        })
        .catch(toastError);
}