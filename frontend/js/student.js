// student.js
// Student pages: Dashboard, Petitions, Demand, Sections, My Sections, My Schedule.
// Needs from app.js: api, currentUser, esc, renderCards, renderTable, statusPage,
// toast, toastError, badge, sectionState, initialSections, allInitialFull, meter, ACTIONS ...

const INTEREST_OPTION = "__interest__";   // value of the "Indicate Interest" dropdown option

const studentState = {
    courses: [],
    petitions: [],
    sections: [],
    mine: [],              // sections this student added
    demand: {},            // course_id -> how many students are interested
    interested: new Set(), // course ids this student already clicked
    sectionFilter: "ALL",
    petitionFilter: "ALL",
    picked: {},
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
        '<p class="muted" style="margin-bottom:12px">Indicate interest in the courses you want to take. ' +
        "This helps the coordinator see which courses need a new section.</p>" +
        '<div class="toolbar"><input id="demandSearch" type="search" placeholder="Search by code or title..." data-input="filterDemand"></div>' +
        '<div id="demandTable">' + demandTable("", true) + "</div></div>";
}

// Last column: interest recorded / button (all 3 full) / which sections are still open
function interestCell(course) {
    const list = studentState.sections.filter(function (s) { return s.course_code === course.code; })
        .sort(function (a, b) { return secNum(a) - secNum(b); });
    const open = list.filter(function (s) { return sectionState(s) !== "FULL"; }).map(sectionLabel);
    const note = '<span class="muted">' + (!list.length ? "Sections not yet available"
        : open.length ? "Still open: " + esc(open.join(", ")) : "Waiting for IT21S1-3 to open") + "</span>";

    const small = "padding:7px 14px;font-size:13px";
    const action = studentState.interested.has(course.id)
        ? '<span class="status ok">&#10003; Interested</span>'
        : canIndicateInterest(course.code)
            ? '<button class="btn" style="' + small + '" data-act="interest" data-id="' + course.id + '">Indicate Interest</button>'
            : '<button class="btn" style="' + small + ';cursor:not-allowed" disabled title="Available once all sections are full">Indicate Interest</button>';

    return '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' + action + note + "</div>";
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
        { label: "Action", render: interestCell },
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
    const r = await Promise.all([
        api("/api/sections"),
        api("/api/sections?student_id=" + currentUser.id),
    ]);
    studentState.sections = r[0];
    studentState.mine = r[1];
    studentState.sectionFilter = "ALL";
    studentState.picked = {};   // section_id -> true if the student clicked "Add" (to show a flash effect)
    return '<div class="panel"><div class="panelHead"><h3>Sections</h3><span class="muted">' + studentState.sections.length + " total</span></div>" +
        '<div class="toolbar"><input id="sectionSearch" type="search" placeholder="Search course, section, professor or schedule..." data-input="filterSections">' +
        '<div class="chips" id="sectionChips">' + sectionChips() + "</div></div>" +
        '<div id="sectionTable">' + sectionsTable("", true) + "</div></div>";
}

// "IT21S4" -> 4 (used for ordering)
function secNum(s) {
    const m = /(\d+)\s*$/.exec(String(s.section_code));
    return m ? Number(m[1]) : s.id;
}

// Interest is allowed only when IT21S1-3 exist and every section of the course is full
function canIndicateInterest(code) {
    const list = studentState.sections.filter(function (s) { return s.course_code === code; });
    return allInitialFull(studentState.sections, code) &&
        list.every(function (s) { return sectionState(s) === "FULL"; });
}

// "Mon 10:30 AM - 12:30 PM" per line, instead of the server's 24-hour text
function scheduleText(s) {
    const slots = (s.slots || []).slice().sort(function (a, b) {
        return DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week) ||
            String(a.start_time).localeCompare(String(b.start_time));
    });
    if (!slots.length) return "TBA";
    return slots.map(function (sl) {
        return esc(sl.day_of_week.slice(0, 3)) + " " + esc(fmtTime(sl.start_time)) + " - " + esc(fmtTime(sl.end_time));
    }).join("<br>");
}

// One entry per course: {code, title, list: its sections}
function courseGroups() {
    const map = {};
    studentState.sections.forEach(function (s) {
        const g = map[s.course_code] || (map[s.course_code] = { code: s.course_code, title: s.course_title, list: [] });
        g.list.push(s);
    });
    return Object.keys(map).sort().map(function (k) {
        map[k].list.sort(function (a, b) { return secNum(a) - secNum(b); });
        return map[k];
    });
}

// Dropdown entries: IT21S1-3 always, plus any extra (S4, S5...) that exist
function courseOptions(g) {
    const extra = g.list.filter(function (s) {
        return INITIAL_SECTIONS.indexOf(String(s.section_code).trim()) === -1;
    }).map(function (s) { return { code: String(s.section_code).trim(), section: s }; });
    return initialSections(studentState.sections, g.code).concat(extra);
}

// The section currently displayed for a course
function shownSection(g) {
    const open = courseOptions(g).filter(function (x) { return x.section; }).map(function (x) { return x.section; });
    return open.find(function (s) { return s.id === studentState.picked[g.code]; })
        || open.find(function (s) { return studentState.mine.some(function (m) { return m.id === s.id; }); })
        || open.find(function (s) { return sectionState(s) !== "FULL"; })
        || open[0] || null;
}

function sectionPicker(g, shown) {
    return '<select data-change="pickSection" data-course="' + esc(g.code) + '" aria-label="Choose section" ' +
        'style="width:110px;padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px">' +
        courseOptions(g).map(function (x) {
            if (!x.section) return '<option disabled>' + esc(x.code) + " (not yet open)</option>";
            const full = sectionState(x.section) === "FULL";
            return '<option value="' + x.section.id + '"' + (x.section.id === shown.id ? " selected" : "") +
                (full ? " disabled" : "") + ">" + esc(x.code) + (full ? " (Full)" : "") + "</option>";
        }).join("") + "</select>";
}

function sectionChips() {
    const counts = { ALL: 0, AVAILABLE: 0, NEAR: 0, FULL: 0 };
    courseGroups().forEach(function (g) {
        const s = shownSection(g);
        if (s) { counts.ALL++; counts[sectionState(s)]++; }
    });
    return [["ALL", "All"], ["AVAILABLE", "Available"], ["NEAR", "Near Full"], ["FULL", "Full"]].map(function (f) {
        return '<button class="chip' + (studentState.sectionFilter === f[0] ? " active" : "") + '" data-act="sectionFilter" data-value="' + f[0] + '">' +
            f[1] + " <b>" + counts[f[0]] + "</b></button>";
    }).join("");
}

function sectionsTable(query, animate) {
    const q = String(query || "").toLowerCase();
    const rows = courseGroups().map(function (g) { return { g: g, s: shownSection(g) }; }).filter(function (r) {
        if (!r.s) return false;
        const text = (r.g.code + " " + r.g.title + " " + sectionLabel(r.s) + " " + r.s.professor_name + " " + r.s.schedule).toLowerCase();
        return text.indexOf(q) !== -1 &&
            (studentState.sectionFilter === "ALL" || sectionState(r.s) === studentState.sectionFilter);
    });
    return renderTable([
        { label: "Course", render: function (r) { return esc(r.g.code) + " - " + esc(r.g.title); } },
        { label: "Section", render: function (r) { return sectionPicker(r.g, r.s); } },
        { label: "Professor", render: function (r) { return esc(r.s.professor_name); } },
        { label: "Schedule", render: function (r) { return scheduleText(r.s); } },
        { label: "Enrolled", render: function (r) {
            return esc(r.s.current_enrollees) + " / " + esc(r.s.capacity) + meter(r.s.current_enrollees, r.s.capacity, STATUS_CLASS[sectionState(r.s)]);
        } },
        { label: "Status", render: function (r) { return badge(sectionState(r.s)); } },
        { label: "", render: function (r) { return sectionAction(r.s); } },
    ], rows, { empty: "No sections match.", animate: animate });
}

ACTIONS.filterSections = function (input) {
    $("sectionTable").innerHTML = sectionsTable(input.value, false);
};

ACTIONS.sectionFilter = function (chip) {
    studentState.sectionFilter = chip.dataset.value;
    $("sectionChips").innerHTML = sectionChips();
    $("sectionTable").innerHTML = sectionsTable($("sectionSearch").value, false);
};

ACTIONS.pickSection = function (select) {
    studentState.picked[select.dataset.course] = Number(select.value);
    $("sectionChips").innerHTML = sectionChips();
    $("sectionTable").innerHTML = sectionsTable($("sectionSearch").value, false);
};

// =====================================================
// 5. MY SECTIONS + MY SCHEDULE (add / drop)
// =====================================================
function sectionAction(s) {
    const mine = studentState.mine.some(function (m) { return m.id === s.id; });
    if (mine) return '<button class="btn ghost" data-act="secDrop" data-id="' + s.id + '">Drop</button>';
    if (sectionState(s) === "FULL") return '<span class="muted">Full</span>';
    return '<button class="btn" data-act="secEnroll" data-id="' + s.id + '">Add</button>';
}

async function reloadStudentSections() {
    const r = await Promise.all([
        api("/api/sections"),
        api("/api/sections?student_id=" + currentUser.id),
    ]);
    studentState.sections = r[0];
    studentState.mine = r[1];
    $("sectionChips").innerHTML = sectionChips();
    $("sectionTable").innerHTML = sectionsTable($("sectionSearch").value, false);
}

ACTIONS.secEnroll = async function (button) {
    setBusy(button, true, "Adding...");
    try {
        await api("/api/enrollments", "POST", { student_id: currentUser.id, section_id: Number(button.dataset.id) });
        toast("Section added to My Sections!", "success");
        await reloadStudentSections();
    } catch (error) {
        toastError(error);
        setBusy(button, false);
    }
};

ACTIONS.secDrop = async function (button) {
    if (!confirm("Drop this section?")) return;
    setBusy(button, true, "Dropping...");
    try {
        await api("/api/enrollments?student_id=" + currentUser.id + "&section_id=" + button.dataset.id, "DELETE");
        toast("Section dropped.", "success");
        if ($("mineTable")) {
            studentState.mine = await api("/api/sections?student_id=" + currentUser.id);
            $("mineTable").innerHTML = mineTable(false);
            $("mineCount").textContent = studentState.mine.length + " enrolled";
        } else {
            await reloadStudentSections();
        }
    } catch (error) {
        toastError(error);
        setBusy(button, false);
    }
};

async function renderMySections() {
    studentState.mine = await api("/api/sections?student_id=" + currentUser.id);
    return '<div class="panel"><div class="panelHead"><h3>My Sections</h3>' +
        '<span class="muted" id="mineCount">' + studentState.mine.length + " enrolled</span></div>" +
        '<div id="mineTable">' + mineTable(true) + "</div></div>";
}

function mineTable(animate) {
    return renderTable([
        { label: "Course", render: function (s) { return esc(s.course_code) + " - " + esc(s.course_title); } },
        { label: "Section", render: function (s) { return esc(String(s.section_code).trim() || "-"); } },
        { label: "Professor", key: "professor_name" },
        { label: "Schedule", render: scheduleText },
        { label: "", render: function (s) { return '<button class="btn ghost" data-act="secDrop" data-id="' + s.id + '">Drop</button>'; } },
    ], studentState.mine, { empty: "You have not added any sections yet. Go to Sections to add one.", animate: animate });
}

async function renderMySchedule() {
    studentState.mine = await api("/api/sections?student_id=" + currentUser.id);
    const grid = '<div class="weekGrid">' + DAYS.map(function (day) {
        const items = [];
        studentState.mine.forEach(function (s) {
            (s.slots || []).forEach(function (sl) {
                if (sl.day_of_week === day) items.push({ s: s, sl: sl });
            });
        });
        items.sort(function (a, b) { return String(a.sl.start_time).localeCompare(String(b.sl.start_time)); });
        return '<div class="dayCol"><b>' + day.slice(0, 3) + "</b>" +
            (items.length ? items.map(function (x) {
                return '<span class="slotPill">' + esc(x.s.course_code) + "<br>" +
                    esc(fmtTime(x.sl.start_time)) + " - " + esc(fmtTime(x.sl.end_time)) + "</span>";
            }).join("") : '<span class="noSlot">-</span>') + "</div>";
    }).join("") + "</div>";

    return '<div class="panel"><div class="panelHead"><h3>My Schedule</h3>' +
        '<span class="muted">' + studentState.mine.length + (studentState.mine.length === 1 ? " section" : " sections") + "</span></div>" +
        (studentState.mine.length ? grid : statusPage("empty", "No sections yet. Add sections from the Sections page.")) + "</div>";
}
