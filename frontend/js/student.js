// student.js
// Student pages: Dashboard, Petitions, Demand, Sections.
// Needs from app.js: api, currentUser, esc, renderCards, renderTable, statusPage,
// toast, toastError, badge, sectionState, initialSections, allInitialFull, meter, ACTIONS ...

const INTEREST_OPTION = "__interest__";   // value of the "Indicate Interest" dropdown option

const studentState = {
    courses: [],
    petitions: [],
    sections: [],
    demand: {},            // course_id -> how many students are interested
    interested: new Set(), // course ids this student already clicked
    sectionFilter: "ALL",
    petitionFilter: "ALL",
};

// =====================================================
// 0. SHARED BITS
// =====================================================
function interestKey() { return "tipin.interest." + currentUser.id; }

function loadInterested() {
    try { return new Set(JSON.parse(localStorage.getItem(interestKey()) || "[]")); } catch (e) { return new Set(); }
}

function saveInterested() {
    try { localStorage.setItem(interestKey(), JSON.stringify(Array.from(studentState.interested))); } catch (e) { /* ignore */ }
}

// Record "I want this course" once. Returns "new" or "existing" (server said 409 = already recorded).
async function postInterest(courseId) {
    let result = "new";
    try {
        await api("/api/demand", "POST", { student_id: currentUser.id, course_id: courseId });
        studentState.demand[courseId] = (studentState.demand[courseId] || 0) + 1;
    } catch (error) {
        if (!/already indicated/i.test(error.message)) throw error;
        result = "existing";
    }
    studentState.interested.add(courseId);
    saveInterested();
    return result;
}

// "IT21S2" for a section row, even when the server does not send section_code yet
function sectionLabel(s) {
    if (s.section_code) return s.section_code;
    const hit = initialSections(studentState.sections, s.course_code).find(function (x) { return x.section && x.section.id === s.id; });
    return hit ? hit.code : "-";
}

// =====================================================
// 1. DASHBOARD
// =====================================================
async function renderStudentDashboard() {
    const results = await Promise.all([
        api("/api/dashboard?role=STUDENT&user_id=" + currentUser.id),
        api("/api/announcements").catch(function () { return []; }),   // news must not break the dashboard
    ]);
    const stats = results[0];
    return renderCards([
        { label: "My Petitions", value: stats.my_petitions || 0 },
        { label: "My Pending Petitions", value: stats.pending || 0 },
        { label: "My Approved Petitions", value: stats.approved || 0 },
        { label: "Courses Interested", value: stats.courses_interested || 0 },
    ]) +
        '<div class="grid">' +
        '<div class="panel quick"><h3>Quick Actions</h3>' +
        '<button data-act="go" data-page="petitions">Submit &amp; Track My Petitions</button>' +
        '<button data-act="go" data-page="demand">Indicate Course Interest</button>' +
        '<button data-act="go" data-page="sections">Browse Sections</button></div>' +
        '<div class="panel"><div class="panelHead"><h3>Announcements</h3>' +
        '<button class="link" data-act="go" data-page="announcements">View All</button></div>' +
        renderAnnouncementList(results[1].slice(0, 3)) + "</div></div>";
}

// =====================================================
// 2. PETITIONS
// =====================================================
async function renderStudentPetitions() {
    const results = await Promise.all([
        api("/api/courses"),
        api("/api/petitions?student_id=" + currentUser.id),
        api("/api/sections").catch(function () { return []; }),
    ]);
    studentState.courses = results[0];
    studentState.petitions = results[1];
    studentState.sections = results[2];
    studentState.interested = loadInterested();
    studentState.petitionFilter = "ALL";

    const courseOptions = studentState.courses.length
        ? studentState.courses.map(function (c) {
            return '<option value="' + c.id + '">' + esc(c.code) + " - " + esc(c.title) + "</option>";
        }).join("")
        : '<option value="">No courses available</option>';

    return '<div class="panel"><div class="panelHead"><h3>Request a New Section</h3></div>' +
        '<div class="formGrid">' +
        '<div class="field"><label for="petCourse">Course</label>' +
        '<select id="petCourse" data-change="petCourseChange">' + courseOptions + "</select></div>" +
        '<div class="field"><label for="petSection">Desired Section</label>' +
        '<select id="petSection" data-change="petSectionChange">' + sectionOptions(studentState.courses[0]) + "</select>" +
        '<small class="hint" id="petSectionHint"></small></div>' +
        '<div class="field"><label for="petReason">Reason for Request</label><select id="petReason">' +
        REASONS.map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("") + "</select></div>" +
        "</div>" +
        '<div class="field"><label for="petDetails">Details</label>' +
        '<textarea id="petDetails" rows="3" placeholder="Explain why a new section should be opened..."></textarea></div>' +
        '<button class="btn" id="petSubmit" data-act="submitPetition">Submit Petition</button></div>' +
        '<div class="panel"><div class="panelHead"><h3>My Petitions</h3><span class="muted" id="petSummary">' + petitionSummary() + "</span></div>" +
        '<div class="toolbar"><div class="chips" id="petChips">' + petitionChips() + "</div></div>" +
        '<div id="myPetitions">' + myPetitionsTable(true) + "</div></div>";
}

// IT21S1..IT21S3 for the chosen course; "Indicate Interest" only when all three are full
function sectionOptions(course) {
    if (!course) return '<option value="">Select a course first</option>';
    const info = initialSections(studentState.sections, course.code);
    let html = '<option value="">Select a section</option>' + info.map(function (x) {
        let note = "not yet open";
        if (x.section) {
            const left = Math.max(0, (Number(x.section.capacity) || 0) - (Number(x.section.current_enrollees) || 0));
            note = sectionState(x.section) === "FULL" ? "Full" : left + (left === 1 ? " seat left" : " seats left");
        }
        return '<option value="' + x.code + '">' + x.code + " (" + note + ")</option>";
    }).join("");

    if (allInitialFull(studentState.sections, course.code)) {
        html += studentState.interested.has(course.id)
            ? '<option value="' + INTEREST_OPTION + '" disabled>Indicate Interest (already recorded)</option>'
            : '<option value="' + INTEREST_OPTION + '">Indicate Interest</option>';
    }
    return html;
}

function chosenCourse() {
    const value = $("petCourse").value;
    return studentState.courses.find(function (c) { return String(c.id) === value; }) || null;
}

// Interest mode: the reason/details are not needed, the button records interest instead
function setInterestMode(on) {
    $("petReason").disabled = on;
    $("petDetails").disabled = on;
    $("petSubmit").textContent = on ? "Indicate Interest" : "Submit Petition";
    $("petSectionHint").textContent = on
        ? "All three sections are full. Your interest helps the coordinator decide whether to open a new one."
        : "";
}

ACTIONS.petCourseChange = function () {
    $("petSection").innerHTML = sectionOptions(chosenCourse());
    clearInvalid($("petSection"));
    setInterestMode(false);
};

ACTIONS.petSectionChange = function (select) {
    setInterestMode(select.value === INTEREST_OPTION);
};

function petitionSummary() {
    const n = studentState.petitions.length;
    return n + (n === 1 ? " petition" : " petitions");
}

function isPendingStatus(status) { return status === "PENDING" || status === "UNDER_REVIEW"; }

function petitionChips() {
    const list = studentState.petitions;
    const counts = {
        ALL: list.length,
        PENDING: list.filter(function (p) { return isPendingStatus(p.status); }).length,
        APPROVED: list.filter(function (p) { return p.status === "APPROVED"; }).length,
    };
    return [["ALL", "All Petitions"], ["PENDING", "My Pending Petitions"], ["APPROVED", "My Approved Petitions"]].map(function (f) {
        return '<button class="chip' + (studentState.petitionFilter === f[0] ? " active" : "") + '" data-act="myPetChip" data-value="' + f[0] + '">' +
            f[1] + " <b>" + counts[f[0]] + "</b></button>";
    }).join("");
}

function myPetitionsTable(animate) {
    const f = studentState.petitionFilter;
    const list = studentState.petitions.filter(function (p) {
        return f === "ALL" || (f === "PENDING" ? isPendingStatus(p.status) : p.status === f);
    });
    const empty = f === "PENDING" ? "You have no pending petitions."
        : f === "APPROVED" ? "You have no approved petitions yet." : "You have no petitions yet.";
    return renderTable([
        { label: "Course", render: function (p) { return esc(p.course_code) + " - " + esc(p.course_title); } },
        { label: "Section", key: "desired_section" },
        { label: "Reason", key: "reason" },
        { label: "Date", render: function (p) { return esc(formatDate(p.date_submitted)); } },
        { label: "Status", render: function (p) { return badge(p.status); } },
    ], list, { empty: empty, animate: animate });
}

ACTIONS.myPetChip = function (chip) {
    studentState.petitionFilter = chip.dataset.value;
    $("petChips").innerHTML = petitionChips();
    $("myPetitions").innerHTML = myPetitionsTable(false);
};

ACTIONS.submitPetition = async function (button) {
    const course = chosenCourse();
    const courseSelect = $("petCourse");
    const section = $("petSection");
    const details = $("petDetails");

    if (!course) { markInvalid(courseSelect, "Choose a course."); return; }
    if (!section.value) { markInvalid(section, "Choose a section."); return; }

    // ---- "Indicate Interest" instead of a petition
    if (section.value === INTEREST_OPTION) {
        setBusy(button, true, "Saving...");
        try {
            const result = await postInterest(course.id);
            toast(result === "new" ? "Interest recorded for " + course.code + "!" : "You already indicated interest in " + course.code + ".", "success");
            section.innerHTML = sectionOptions(course);   // the option now shows as recorded
            setInterestMode(false);
        } catch (error) {
            toastError(error);
        } finally {
            setBusy(button, false);
            button.textContent = "Submit Petition";
        }
        return;
    }

    // ---- normal petition
    if (!details.value.trim()) { markInvalid(details, "Tell us why this section should open."); return; }

    const duplicate = studentState.petitions.some(function (p) {
        return String(p.course_code) === String(course.code) &&
            String(p.desired_section).toLowerCase() === section.value.toLowerCase() &&
            isPendingStatus(p.status);
    });
    if (duplicate) { markInvalid(section, "You already have an open petition for this course and section."); return; }

    setBusy(button, true, "Submitting...");
    try {
        await api("/api/petitions", "POST", {
            student_id: currentUser.id,
            course_id: course.id,
            reason: $("petReason").value,
            desired_section: section.value,
            details: details.value.trim(),
        });
        toast("Petition submitted for " + course.code + " " + section.value + "!", "success");
        section.value = "";
        details.value = "";

        studentState.petitions = await api("/api/petitions?student_id=" + currentUser.id);
        $("petChips").innerHTML = petitionChips();
        $("myPetitions").innerHTML = myPetitionsTable(false);
        $("petSummary").textContent = petitionSummary();
        flashRow(document.querySelector("#myPetitions tbody tr"));
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

// =====================================================
// 3. DEMAND (course interest)
// =====================================================
async function renderStudentDemand() {
    const results = await Promise.all([
        api("/api/courses"),
        api("/api/demand").catch(function () { return []; }),
        api("/api/sections").catch(function () { return []; }),
    ]);
    studentState.courses = results[0];
    studentState.sections = results[2];
    studentState.demand = {};
    results[1].forEach(function (d) { studentState.demand[d.course_id] = Number(d.count) || 0; });
    studentState.interested = loadInterested();

    return '<div class="panel"><div class="panelHead"><h3>Course Demand</h3></div>' +
        '<p class="muted" style="margin-bottom:12px">You can indicate interest in a course once its three sections ' +
        "(IT21S1, IT21S2 and IT21S3) are all full. This helps the coordinator see which courses need a new section.</p>" +
        '<div class="toolbar"><input id="demandSearch" type="search" placeholder="Search by code or title..." data-input="filterDemand"></div>' +
        '<div id="demandTable">' + demandTable("", true) + "</div></div>";
}

// Last column: interest recorded / button (all 3 full) / which sections are still open
function interestCell(course) {
    if (studentState.interested.has(course.id)) return '<span class="status ok">&#10003; Interested</span>';
    if (allInitialFull(studentState.sections, course.code)) {
        return '<button class="btn" data-act="interest" data-id="' + course.id + '">Indicate Interest</button>';
    }
    const open = initialSections(studentState.sections, course.code).filter(function (x) {
        return x.section && sectionState(x.section) !== "FULL";
    }).map(function (x) { return x.code; });
    return '<span class="muted">' + (open.length ? "Still open: " + esc(open.join(", ")) : "Sections not yet available") + "</span>";
}

function demandTable(query, animate) {
    const q = String(query || "").toLowerCase();
    const list = studentState.courses.filter(function (c) {
        return (c.code + " " + c.title).toLowerCase().indexOf(q) !== -1;
    });
    return renderTable([
        { label: "Code", key: "code" },
        { label: "Title", key: "title" },
        { label: "Units", key: "units" },
        { label: "Interested", render: function (c) { return String(studentState.demand[c.id] || 0); } },
        { label: "", render: interestCell },
    ], list, { empty: q ? "No courses match your search." : "No courses available yet.", animate: animate, rowAttrs: function (c) { return 'data-course="' + c.id + '"'; } });
}

ACTIONS.filterDemand = function (input) {
    $("demandTable").innerHTML = demandTable(input.value, false);
};

ACTIONS.interest = async function (button) {
    const id = Number(button.dataset.id);
    const course = studentState.courses.find(function (c) { return c.id === id; });
    setBusy(button, true, "Saving...");
    try {
        const result = await postInterest(id);
        const code = course ? course.code : "this course";
        toast(result === "new" ? "Interest recorded for " + code + "!" : "You already indicated interest in " + code + ".", "success");
    } catch (error) {
        toastError(error);
        setBusy(button, false);
        return;
    }
    $("demandTable").innerHTML = demandTable($("demandSearch").value, false);
    flashRow(document.querySelector('#demandTable tr[data-course="' + id + '"]'));
};

// =====================================================
// 4. SECTIONS
// =====================================================
async function renderStudentSections() {
    studentState.sections = await api("/api/sections");
    studentState.sectionFilter = "ALL";
    return '<div class="panel"><div class="panelHead"><h3>Sections</h3><span class="muted">' + studentState.sections.length + " total</span></div>" +
        '<div class="toolbar"><input id="sectionSearch" type="search" placeholder="Search course, section, professor or schedule..." data-input="filterSections">' +
        '<div class="chips" id="sectionChips">' + sectionChips() + "</div></div>" +
        '<div id="sectionTable">' + sectionsTable("", true) + "</div></div>";
}

function sectionChips() {
    const counts = { ALL: studentState.sections.length, AVAILABLE: 0, NEAR: 0, FULL: 0 };
    studentState.sections.forEach(function (s) { counts[sectionState(s)]++; });
    return [["ALL", "All"], ["AVAILABLE", "Available"], ["NEAR", "Near Full"], ["FULL", "Full"]].map(function (f) {
        return '<button class="chip' + (studentState.sectionFilter === f[0] ? " active" : "") + '" data-act="sectionFilter" data-value="' + f[0] + '">' +
            f[1] + " <b>" + counts[f[0]] + "</b></button>";
    }).join("");
}

function sectionsTable(query, animate) {
    const q = String(query || "").toLowerCase();
    const list = studentState.sections.filter(function (s) {
        const text = (s.course_code + " " + s.course_title + " " + sectionLabel(s) + " " + s.professor_name + " " + s.schedule).toLowerCase();
        return text.indexOf(q) !== -1 &&
            (studentState.sectionFilter === "ALL" || sectionState(s) === studentState.sectionFilter);
    });
    return renderTable([
        { label: "Course", render: function (s) { return esc(s.course_code) + " - " + esc(s.course_title); } },
        { label: "Section", render: function (s) { return esc(sectionLabel(s)); } },
        { label: "Professor", key: "professor_name" },
        { label: "Schedule", key: "schedule" },
        {
            label: "Enrolled", render: function (s) {
                const st = sectionState(s);
                return esc(s.current_enrollees) + " / " + esc(s.capacity) + meter(s.current_enrollees, s.capacity, STATUS_CLASS[st]);
            },
        },
        { label: "Status", render: function (s) { return badge(sectionState(s)); } },
    ], list, { empty: "No sections match.", animate: animate });
}

ACTIONS.filterSections = function (input) {
    $("sectionTable").innerHTML = sectionsTable(input.value, false);
};

ACTIONS.sectionFilter = function (chip) {
    studentState.sectionFilter = chip.dataset.value;
    $("sectionChips").innerHTML = sectionChips();
    $("sectionTable").innerHTML = sectionsTable($("sectionSearch").value, false);
};
