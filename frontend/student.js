// student.js
// Student pages: Dashboard, Petitions, Demand, Sections.
//
// From web.js:     getJson, postJson, esc, currentUser
// From helpers.js: toast, toastError, statusBadge, renderCards

// =====================================================
// 1. DASHBOARD
// =====================================================
function loadStudentDashboard() {
    // Cards (for example: my petitions, pending, approved)
    getJson("/api/dashboard?role=STUDENT&user_id=" + currentUser.id)
        .then(function (data) {
            renderCards("dashboardCards", data);
        })
        .catch(toastError);

    // Announcements list
    getJson("/api/announcements")
        .then(function (list) {
            let html = "";
            list.forEach(function (a) {
                html +=
                    '<div class="announce">' +
                    "<b>" + esc(a.title) + "</b>" +
                    '<span class="muted">' + esc(a.message) + "</span>" +
                    "</div>";
            });
            // only replace the page text if the server sent something
            if (html !== "") {
                document.getElementById("dashboardAnnouncements").innerHTML = html;
            }
        })
        .catch(toastError);
}

// The "quick action to Petitions" is the button in the Quick Actions panel
// in index.html: onclick="showPage('studentPetitions')"

// =====================================================
// 2. PETITIONS
// =====================================================
function loadStudentPetitions() {
    loadPetitionCourses();
    loadMyPetitions();
}

// Fill the course dropdown from /courses
function loadPetitionCourses() {
    getJson("/api/courses")
        .then(function (courses) {
            let options = "";
            courses.forEach(function (c) {
                options +=
                    '<option value="' + c.id + '">' +
                    esc(c.code) + " - " + esc(c.title) +
                    "</option>";
            });
            document.getElementById("petCourse").innerHTML = options;
        })
        .catch(toastError);
}

// Fill the table of this student's petitions
function loadMyPetitions() {
    getJson("/api/petitions?student_id=" + currentUser.id)
        .then(function (petitions) {
            const table = document.getElementById("petTable");

            // delete every row except the header row
            while (table.rows.length > 1) table.deleteRow(1);

            if (petitions.length === 0) {
                table.insertRow(-1).innerHTML =
                    '<td colspan="5" class="muted">You have no petitions yet.</td>';
                return;
            }

            petitions.forEach(function (p) {
                table.insertRow(-1).innerHTML =
                    "<td>" + esc(p.course_code) + " - " + esc(p.course_title) + "</td>" +
                    "<td>" + esc(p.desired_section) + "</td>" +
                    "<td>" + esc(p.reason) + "</td>" +
                    "<td>" + esc(String(p.date_submitted).slice(0, 10)) + "</td>" +
                    "<td>" + statusBadge(p.status) + "</td>";
            });
        })
        .catch(toastError);
}

// Send a new petition to the server
function submitStudentPetition() {
    const courseId = document.getElementById("petCourse").value;
    const reason = document.getElementById("petReason").value;
    const section = document.getElementById("petSection").value.trim();
    const details = document.getElementById("petDetails").value.trim();

    // simple check: nothing may be empty
    if (!courseId || !section || !details) {
        toast("Please fill out the course, desired section, and details.", "error");
        return;
    }

    postJson("/api/petitions", {
        student_id: currentUser.id,
        course_id: Number(courseId),
        reason: reason,
        desired_section: section,
        details: details,
    })
        .then(function () {
            toast("Petition submitted!", "success");

            // clear the form
            document.getElementById("petSection").value = "";
            document.getElementById("petDetails").value = "";

            // draw the table again so the new petition appears
            loadMyPetitions();
        })
        .catch(toastError);
}

// =====================================================
// 3. DEMAND (course interest)
// =====================================================
function loadStudentDemand() {
    getJson("/api/courses")
        .then(function (courses) {
            const table = document.getElementById("demandTable");
            while (table.rows.length > 1) table.deleteRow(1);

            courses.forEach(function (c) {
                table.insertRow(-1).innerHTML =
                    "<td>" + esc(c.code) + "</td>" +
                    "<td>" + esc(c.title) + "</td>" +
                    "<td>" + c.units + "</td>" +
                    '<td><button class="btn" onclick="indicateInterest(' + c.id + ')">' +
                    "Indicate Interest</button></td>";
            });
        })
        .catch(toastError);
}

function indicateInterest(courseId) {
    postJson("/api/demand", {
        student_id: currentUser.id,
        course_id: courseId,
    })
        .then(function () {
            toast("Interest recorded!", "success");
        })
        // If the student already clicked this course, the server answers 409
        // with "You already indicated interest in this course".
        // toastError shows that message.
        .catch(toastError);
}

// =====================================================
// 4. SECTIONS
// =====================================================

// Available = plenty of seats, Near = 80% full or more, Full = no seats left
function sectionBadge(section) {
    if (section.current_enrollees >= section.capacity) {
        return '<span class="status red">Full</span>';
    }
    if (section.current_enrollees >= section.capacity * 0.8) {
        return '<span class="status warn">Near</span>';
    }
    return '<span class="status">Available</span>';
}

function loadStudentSections() {
    getJson("/api/sections")
        .then(function (sections) {
            const table = document.getElementById("sectionTable");
            while (table.rows.length > 1) table.deleteRow(1);

            sections.forEach(function (s) {
                table.insertRow(-1).innerHTML =
                    "<td>" + esc(s.course_code) + " - " + esc(s.course_title) + "</td>" +
                    "<td>" + esc(s.professor_name) + "</td>" +
                    "<td>" + esc(s.schedule) + "</td>" +
                    "<td>" + s.current_enrollees + " / " + s.capacity + "</td>" +
                    "<td>" + sectionBadge(s) + "</td>";
            });
        })
        .catch(toastError);
}
