// Selected portal role
let selectedRole = "";
const API_URL = "https://tip-in.onrender.com";

// Show login form for chosen portal
function selectPortal(role) {
    selectedRole = role;
    document.getElementById("portalGrid").style.display = "none";
    document.getElementById("loginFormBox").style.display = "block";
    document.getElementById("loginFormTitle").textContent = role + " Login";
}

// Return to portal selection
function backToPortals() {
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("portalGrid").style.display = "grid";
}

// Complete login and enter the system
function doLogin() {
    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    fetch(API_URL + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Invalid email or password");
        }
        return response.json();
    })
    .then(function (user) {
        document.getElementById("loginScreen").style.display = "none";
        document.body.classList.remove("loggedOut");
        document.getElementById("roleTag").textContent = user.role;

        pageInfo.dashboard[0] = "Good Day, " + user.name + "!";
        document.getElementById("pageTitle").textContent = pageInfo.dashboard[0];
    })
    .catch(function (error) {
        alert(error.message);
    });
}

// Open logout confirmation
function openLogoutModal() {
    document.getElementById("logoutModal").classList.add("show");
}

// Close logout confirmation without logging out
function closeLogoutModal() {
    document.getElementById("logoutModal").classList.remove("show");
}

// User confirmed — close the modal and actually log out
function confirmLogout() {
    closeLogoutModal();
    logout();
}

// Log out and return to the login screen
function logout() {
    document.getElementById("loginScreen").style.display = "flex";
    document.body.classList.add("loggedOut");
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("portalGrid").style.display = "grid";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("roleTag").textContent = "";
    pageInfo.dashboard[0] = "Good morning! 👋";
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
        "Good morning! 👋",
        "Enrollment Support System • 1st Semester 2026–2027",
    ],
    petitions: [
        "Petition Management",
        "Request the opening of a new section and track the status of your requests.",
    ],
    announcements: ["Announcements", "Manage system announcements."],
    settings: ["Settings", "Configure basic system settings."],
};

// Show selected page
function showPage(pageId, button) {
        document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

        document.querySelectorAll(".nav button").forEach(function (navButton) {
        navButton.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    document.getElementById("pageTitle").textContent = pageInfo[pageId][0];
    document.getElementById("pageSub").textContent = pageInfo[pageId][1];

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
            p.status === "Pending" ? "warn" :
            p.status === "Denied" ? "red" : "";

        const row = table.insertRow(-1);
        row.innerHTML =
            "<td>" + p.id + "</td>" +
            "<td>" + p.reason + "</td>" +
            "<td>" + p.subject + "</td>" +
            "<td>" + p.date + "</td>" +
            "<td><span class=\"status " + statusClass + "\">" + p.status + "</span></td>";
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
    const courseOther = document.getElementById("petitionCourseOther").value.trim();
    const section = document.getElementById("petitionSection").value.trim();
    const details = document.getElementById("petitionDetails").value.trim();

    const course = courseSelect === "Other" ? courseOther : courseSelect;

    if (!course || !section || !details) {
        alert("Please fill out the course, desired section, and details before submitting.");
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
    let pending = 0, approved = 0, denied = 0;

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