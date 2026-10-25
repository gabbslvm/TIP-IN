// coordinator.js
// COORDINATION role (Faculty + Admin):
//   everyone: Dashboard, Petition Management, Recommendations
//   faculty only: My Schedule, Availability
// Needs from app.js: api, currentUser, esc, renderCards, renderTable, statusPage,
// toast, toastError, badge, meter, setCard, updateBell, ACTIONS, STATUS_CLASS ...

const PETITION_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
const RECOMMENDATION_STATUSES = ["NEW", "FOR_REVIEW", "APPROVED", "DECLINED"];

const coordState = {
    petitions: [],
    recs: [],
    filter: { q: "", reason: "", status: "" },
    recFilter: "ALL",
    avail: [],                              // every professor's slots (admin view)
    availFilter: { q: "", day: "", time: "" },
};

// <select> of statuses, tinted by the current status
function statusSelect(list, current, action, id) {
    return '<select class="statusSelect ' + (STATUS_CLASS[current] || "") + '" data-change="' + action + '" data-id="' + id + '" aria-label="Change status">' +
        list.map(function (s) {
            return '<option value="' + s + '"' + (s === current ? " selected" : "") + ">" + esc(STATUS_LABEL[s] || s) + "</option>";
        }).join("") + "</select>";
}

function tint(select) {
    select.className = "statusSelect " + (STATUS_CLASS[select.value] || "");
}

function petitionCounts(list) {
    const c = { total: list.length, pending: 0, approved: 0, rejected: 0 };
    list.forEach(function (p) {
        if (p.status === "PENDING" || p.status === "UNDER_REVIEW") c.pending++;
        else if (p.status === "APPROVED") c.approved++;
        else if (p.status === "REJECTED") c.rejected++;
    });
    return c;
}

// =====================================================
// 1. DASHBOARD
// =====================================================
async function renderCoordDashboard() {
    const results = await Promise.all([
        api("/api/petitions"),
        api("/api/recommendations"),
        api("/api/announcements").catch(function () { return []; }),
        api("/api/availability").then(function (list) { return { ok: true, list: list }; }).catch(function (e) { return { ok: false, error: e.message }; }),
    ]);
    const c = petitionCounts(results[0]);
    const newRecs = results[1].filter(function (r) { return r.status === "NEW"; }).length;
    const avail = results[3];
    updateBell(results[1]);

    const cards = [
        { label: "Total Petitions", value: c.total },
        { label: "Pending", value: c.pending, hint: "Pending + under review" },
        { label: "Approved", value: c.approved },
        { label: "Rejected", value: c.rejected },
        { label: "New Recommendations", value: newRecs },
    ];
    if (avail.ok) {
        const ids = {};
        avail.list.forEach(function (s) { ids[s.professor_id] = true; });
        cards.push({ label: "Professors With Vacant Time", value: Object.keys(ids).length });
    }

    const quick = '<div class="panel quick"><h3>Quick Actions</h3>' +
        '<button data-act="go" data-page="petitions">Review Petitions</button>' +
        '<button data-act="go" data-page="recommendations">View Section Recommendations</button></div>';
    const news = '<div class="panel"><div class="panelHead"><h3>Announcements</h3>' +
        '<button class="link" data-act="go" data-page="announcements">View All</button></div>' +
        renderAnnouncementList(results[2].slice(0, 3)) + "</div>";

    return renderCards(cards) + profAvailPanel(avail) + '<div class="grid">' + quick + news + "</div>";
}

async function renderFacultyDashboard() {
    const results = await Promise.all([
        api("/api/dashboard?role=PROFESSOR&user_id=" + currentUser.id).catch(function () { return null; }),
        api("/api/availability/" + currentUser.id).then(function (list) { return { ok: true, list: list }; }).catch(function (e) { return { ok: false, error: e.message }; }),
        api("/api/announcements").catch(function () { return []; }),
    ]);
    const stats = results[0];
    const avail = results[1];

    const cards = [
        { label: "My Sections", value: stats ? stats.my_sections || 0 : 0 },
        { label: "Vacant Time Slots", value: avail.ok ? avail.list.length : 0 },
    ];

    const quick = '<div class="panel quick"><h3>Quick Actions</h3>' +
        '<button data-act="go" data-page="schedule">View My Schedule</button>' +
        '<button data-act="go" data-page="availability">Set My Preferred Vacant Time</button></div>';
    const news = '<div class="panel"><div class="panelHead"><h3>Announcements</h3>' +
        '<button class="link" data-act="go" data-page="announcements">View All</button></div>' +
        renderAnnouncementList(results[2].slice(0, 3)) + "</div>";

    return renderCards(cards) + myVacantPanel(avail) + '<div class="grid">' + quick + news + "</div>";
}

// ---- faculty dashboard: my preferred vacant time (read-only week view)
function myVacantPanel(avail) {
    const body = !avail.ok
        ? statusPage("empty", "Could not load your vacant time: " + avail.error)
        : avail.list.length
            ? weekGrid(avail.list)
            : statusPage("empty", "You have not set any preferred vacant time yet.");
    return '<div class="panel"><div class="panelHead"><h3>My Preferred Vacant Time</h3>' +
        '<button class="btn" data-act="go" data-page="availability">' + (avail.ok && avail.list.length ? "Edit" : "Set Vacant Time") + "</button></div>" +
        body + "</div>";
}

// ---- admin dashboard: every professor's available time slots
function profAvailPanel(avail) {
    const head = '<div class="panelHead"><h3>Professor Availability</h3><span class="muted" id="availShown"></span></div>';
    if (!avail.ok) {
        return '<div class="panel">' + head + statusPage("empty", "Professor availability could not be loaded: " + avail.error) + "</div>";
    }
    coordState.avail = avail.list;
    coordState.availFilter = { q: "", day: "", time: "" };
    const days = '<option value="">Any day</option>' + DAYS.map(function (d) { return "<option>" + d + "</option>"; }).join("");
    return '<div class="panel" id="profAvailPanel">' + head +
        '<p class="muted" style="margin-bottom:12px">Check who is free before approving a petition or setting a schedule.</p>' +
        '<div class="toolbar"><input type="search" placeholder="Search professor..." data-input="availFilter" data-key="q">' +
        '<select data-change="availFilter" data-key="day" aria-label="Filter by day">' + days + "</select>" +
        '<label class="inlineLabel">Free at <input type="time" data-change="availFilter" data-key="time"></label></div>' +
        '<div id="profAvail">' + profCards() + "</div></div>";
}

function profCards() {
    const f = coordState.availFilter;
    const q = f.q.toLowerCase();
    const byProf = {};
    coordState.avail.forEach(function (s) {
        const p = byProf[s.professor_id] || (byProf[s.professor_id] = { id: s.professor_id, name: s.professor_name, slots: [] });
        p.slots.push(s);
    });
    function matches(s) {
        const start = String(s.start_time).slice(0, 5), end = String(s.end_time).slice(0, 5);
        return (!f.day || s.day_of_week === f.day) && (!f.time || (start <= f.time && f.time < end));
    }
    let profs = Object.keys(byProf).map(function (id) { return byProf[id]; }).filter(function (p) {
        return (!q || String(p.name).toLowerCase().indexOf(q) !== -1) && (!(f.day || f.time) || p.slots.some(matches));
    });
    const total = Object.keys(byProf).length;
    const shown = $("availShown");
    if (shown) shown.textContent = "Showing " + profs.length + " of " + total + (total === 1 ? " professor" : " professors");
    if (!profs.length) {
        return statusPage("empty", total ? "No professor is free for that search." : "No professor has set vacant time yet.");
    }
    return '<div class="profGrid">' + profs.map(function (p, i) {
        return '<div class="profCard" style="--i:' + Math.min(i, 10) + '"><div class="profHead">' +
            '<span class="navAvatar sm">' + esc(String(p.name).trim().charAt(0).toUpperCase()) + "</span>" +
            "<div><b>" + esc(p.name) + "</b><small>" + p.slots.length + (p.slots.length === 1 ? " time slot" : " time slots") + "</small></div></div>" +
            weekGrid(p.slots, f.day) + "</div>";
    }).join("") + "</div>";
}

// search box (input) and the day/time filters (change) share one handler
ACTIONS.availFilter = function (el) {
    coordState.availFilter[el.dataset.key] = el.value.trim();
    $("profAvail").innerHTML = profCards();
};

// =====================================================
// 2. PETITION MANAGEMENT
// =====================================================
async function renderCoordPetitions() {
    coordState.petitions = await api("/api/petitions");
    coordState.filter = { q: "", reason: "", status: "" };
    const c = petitionCounts(coordState.petitions);

    const reasonOptions = '<option value="">All Reasons</option>' +
        REASONS.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + "</option>"; }).join("");
    const statusOptions = '<option value="">All Statuses</option>' +
        PETITION_STATUSES.map(function (s) { return '<option value="' + s + '">' + esc(STATUS_LABEL[s]) + "</option>"; }).join("");

    return '<div id="petCards">' + renderCards([
        { label: "Total Petitions", value: c.total, key: "total" },
        { label: "Pending", value: c.pending, key: "pending" },
        { label: "Approved", value: c.approved, key: "approved" },
        { label: "Rejected", value: c.rejected, key: "rejected" },
    ]) + "</div>" +
        '<div class="panel"><div class="panelHead"><h3>Student Petitions</h3><span class="muted" id="petShown"></span></div>' +
        '<div class="toolbar"><input id="petitionSearch" type="search" placeholder="Search ID, course, section or student..." data-input="petFilter" data-key="q">' +
        '<select data-change="petFilter" data-key="reason" aria-label="Filter by reason">' + reasonOptions + "</select>" +
        '<select data-change="petFilter" data-key="status" aria-label="Filter by status">' + statusOptions + "</select></div>" +
        '<div id="petitionTable">' + petitionTable(true) + "</div></div>";
}

function filteredPetitions() {
    const f = coordState.filter;
    const q = f.q.toLowerCase();
    return coordState.petitions.filter(function (p) {
        const text = ("pet-" + p.id + " " + p.id + " " + p.course_code + " " + p.course_title + " " + p.desired_section + " " + p.student_name).toLowerCase();
        return (!q || text.indexOf(q) !== -1) &&
            (!f.reason || p.reason === f.reason) &&
            (!f.status || p.status === f.status);
    });
}

function petitionTable(animate) {
    const list = filteredPetitions();
    const shown = $("petShown");
    if (shown) shown.textContent = "Showing " + list.length + " of " + coordState.petitions.length;
    return renderTable([
        { label: "Petition ID", render: function (p) { return "PET-" + esc(p.id); } },
        { label: "Reason", key: "reason" },
        {
            label: "Course / Section", render: function (p) {
                return esc(p.course_code) + " - " + esc(p.course_title) + " (" + esc(p.desired_section) + ")" +
                    '<br><span class="muted">' + esc(p.student_name) + "</span>" +
                    (p.details ? '<br><span class="muted clamp" title="' + esc(p.details) + '">' + esc(p.details) + "</span>" : "");
            },
        },
        { label: "Date", render: function (p) { return esc(formatDate(p.date_submitted)); } },
        { label: "Status", render: function (p) { return statusSelect(PETITION_STATUSES, p.status, "petStatus", p.id); } },
    ], list, { empty: "No petitions match.", animate: animate, rowAttrs: function (p) { return 'data-id="' + p.id + '"'; } });
}

function refreshPetitionCards() {
    const c = petitionCounts(coordState.petitions);
    const root = $("petCards");
    if (!root) return;
    Object.keys(c).forEach(function (k) { setCard(root, k, c[k]); });
}

// search box (input) and the two selects (change) share one handler
ACTIONS.petFilter = function (el) {
    coordState.filter[el.dataset.key] = el.value.trim();
    $("petitionTable").innerHTML = petitionTable(false);
};

ACTIONS.petStatus = async function (select) {
    const id = Number(select.dataset.id);
    const petition = coordState.petitions.find(function (p) { return p.id === id; });
    if (!petition || petition.status === select.value) return;

    const previous = petition.status;
    petition.status = select.value;          // update the screen first, undo if the server says no
    tint(select);
    refreshPetitionCards();
    select.disabled = true;
    try {
        await api("/api/petitions/" + id, "PUT", { status: select.value });
        toast("PET-" + id + " marked " + STATUS_LABEL[select.value], "success");
        flashRow(select.closest("tr"));
    } catch (error) {
        petition.status = previous;
        select.value = previous;
        tint(select);
        refreshPetitionCards();
        toastError(error);
    } finally {
        select.disabled = false;
    }
};

// =====================================================
// 3. RECOMMENDATIONS
// =====================================================
async function renderRecommendations() {
    coordState.recs = await api("/api/recommendations");
    coordState.recFilter = "ALL";
    updateBell(coordState.recs);
    return '<div class="panel"><div class="panelHead"><h3>Section Recommendations</h3></div>' +
        '<div class="toolbar"><div class="chips" id="recChips">' + recChips() + "</div></div>" +
        '<div id="recTable">' + recTable(true) + "</div></div>";
}

function recChips() {
    const counts = { ALL: coordState.recs.length };
    RECOMMENDATION_STATUSES.forEach(function (s) { counts[s] = 0; });
    coordState.recs.forEach(function (r) { if (counts[r.status] != null) counts[r.status]++; });
    return [["ALL", "All"]].concat(RECOMMENDATION_STATUSES.map(function (s) { return [s, STATUS_LABEL[s]]; })).map(function (f) {
        return '<button class="chip' + (coordState.recFilter === f[0] ? " active" : "") + '" data-act="recFilter" data-value="' + f[0] + '">' +
            f[1] + " <b>" + counts[f[0]] + "</b></button>";
    }).join("");
}

function recTable(animate) {
    const list = coordState.recs.filter(function (r) {
        return coordState.recFilter === "ALL" || r.status === coordState.recFilter;
    });
    return renderTable([
        {
            label: "Course", render: function (r) {
                return (r.status === "NEW" ? '<span class="newDot" title="New"></span>' : "") + esc(r.course_code) + " - " + esc(r.course_title);
            },
        },
        {
            label: "Demand", render: function (r) {
                return esc(r.demand_count) + (r.capacity > 0 ? meter(r.demand_count, r.capacity, r.demand_count >= r.capacity ? "red" : "ok") : "");
            },
        },
        { label: "Petitions", key: "petition_count" },
        { label: "Capacity", render: function (r) { return r.capacity > 0 ? esc(r.capacity) : '<span class="muted">No sections</span>'; } },
        { label: "Suggestion", key: "suggested_action" },
        { label: "Status", render: function (r) { return statusSelect(RECOMMENDATION_STATUSES, r.status, "recStatus", r.id); } },
        { label: "", render: function (r) {
            return r.status === "APPROVED"
            ? '<button class="btn ghost" data-act="recCreateSection" data-course="' + r.course_id + '">Create Section</button>'
            : "";
        } },
    ], list, { empty: "No recommendations here.", animate: animate, rowAttrs: function (r) { return 'data-id="' + r.id + '"'; } });
}

ACTIONS.recFilter = function (chip) {
    coordState.recFilter = chip.dataset.value;
    $("recChips").innerHTML = recChips();
    $("recTable").innerHTML = recTable(false);
};

ACTIONS.recStatus = async function (select) {
    const id = Number(select.dataset.id);
    const rec = coordState.recs.find(function (r) { return r.id === id; });
    if (!rec || rec.status === select.value) return;

    const previous = rec.status;
    rec.status = select.value;
    tint(select);
    $("recChips").innerHTML = recChips();
    updateBell(coordState.recs);             // the bell dot clears once nothing is NEW
    select.disabled = true;
    try {
        await api("/api/recommendations/" + id, "PUT", { status: select.value });
        toast("Recommendation marked " + STATUS_LABEL[select.value], "success");
        $("recTable").innerHTML = recTable(false);
        flashRow(document.querySelector('#recTable tr[data-id="' + id + '"]'));
    } catch (error) {
        rec.status = previous;
        select.value = previous;
        tint(select);
        $("recChips").innerHTML = recChips();
        updateBell(coordState.recs);
        toastError(error);
    } finally {
        select.disabled = false;
    }
};

ACTIONS.recCreateSection = function (button) {
    coordState.prefillCourse = Number(button.dataset.course);
    showPage("sections");
};

// =====================================================
// 4. FACULTY: MY SCHEDULE
// =====================================================
async function renderFacultySchedule() {
    const sections = await api("/api/sections?professor_id=" + currentUser.id);
    return '<div class="panel"><div class="panelHead"><h3>My Schedule</h3><span class="muted">' + sections.length + " sections</span></div>" +
        '<p class="muted" style="margin-bottom:12px">The sections assigned to you. To set when you are free to teach, use Preferred Vacant Time.</p>' +
        renderTable([
            { label: "Course", render: function (s) { return esc(s.course_code) + " - " + esc(s.course_title); } },
            { label: "Section", render: function (s) { return esc(s.section_code || "-"); } },
            { label: "Schedule", key: "schedule" },
            {
                label: "Enrolled", render: function (s) {
                    return esc(s.current_enrollees) + " / " + esc(s.capacity) + meter(s.current_enrollees, s.capacity, STATUS_CLASS[sectionState(s)]);
                },
            },
        ], sections, { empty: "No sections assigned to you yet." }) + "</div>";
}

// =====================================================
// 5. FACULTY: PREFERRED VACANT TIME (editable rows + live week overview)
// =====================================================
const TIME_PRESETS = [
    { label: "Morning", from: "07:30", to: "12:00" },
    { label: "Afternoon", from: "13:00", to: "17:30" },
    { label: "Evening", from: "18:00", to: "21:00" },
];

async function renderFacultyAvailability() {
    const slots = await api("/api/availability/" + currentUser.id);
    const dayOptions = DAYS.map(function (d) { return "<option>" + d + "</option>"; }).join("");
    const normalized = slots.map(function (s) {
        return { day_of_week: s.day_of_week, start_time: String(s.start_time).slice(0, 5), end_time: String(s.end_time).slice(0, 5) };
    });

    return '<div class="panel"><div class="panelHead"><h3>Preferred Vacant Time</h3></div>' +
        '<p class="muted" style="margin-bottom:12px">Pick the days and times you are free to teach. The coordinator uses this when reviewing petitions and building schedules.</p>' +
        '<div class="toolbar quickAdd"><label class="inlineLabel">Quick add <select id="presetDay">' + dayOptions + "</select></label>" +
        '<div class="chips">' + TIME_PRESETS.map(function (p) {
            return '<button class="chip" data-act="addPreset" data-from="' + p.from + '" data-to="' + p.to + '">' +
                p.label + " <b>" + fmtTime(p.from) + " - " + fmtTime(p.to) + "</b></button>";
        }).join("") + "</div>" +
        '<button class="btn ghost" data-act="addSlot">+ Custom Slot</button></div>' +
        '<div class="tableWrap"><table class="availTable"><thead><tr><th>Day</th><th>Start</th><th>End</th><th></th></tr></thead>' +
        '<tbody id="availBody">' + normalized.map(function (s) { return slotRow(s.day_of_week, s.start_time, s.end_time); }).join("") + "</tbody></table></div>" +
        '<div id="availEmpty">' + statusPage("empty", "No vacant time yet. Use Quick add or Custom Slot to get started.") + "</div>" +
        '<button class="btn" id="availSave" style="margin-top:14px" data-act="saveAvail">Confirm &amp; Save Vacant Time</button></div>' +
        '<div class="panel"><div class="panelHead"><h3>Weekly Overview</h3><span class="muted">Updates as you edit</span></div>' +
        '<div id="weekPreview">' + weekGrid(normalized) + "</div></div>";
}

// Valid rows only (both times filled and end later than start)
function collectSlots() {
    const out = [];
    $("availBody").querySelectorAll("tr.slotRow:not(.leaving)").forEach(function (row) {
        const start = row.querySelector(".availStart").value, end = row.querySelector(".availEnd").value;
        if (start && end && end > start) out.push({ day_of_week: row.querySelector(".availDay").value, start_time: start, end_time: end });
    });
    return out;
}

function drawWeekPreview() {
    const box = $("weekPreview");
    if (box) box.innerHTML = weekGrid(collectSlots());
}

// show the empty message only while there are no rows
function syncAvailEmpty() {
    const empty = $("availEmpty");
    if (empty) empty.style.display = $("availBody").children.length ? "none" : "";
}

function slotRow(day, start, end) {
    const options = DAYS.map(function (d) { return "<option" + (d === day ? " selected" : "") + ">" + d + "</option>"; }).join("");
    return '<tr class="slotRow">' +
        '<td data-label="Day"><select class="availDay" data-change="slotChange">' + options + "</select></td>" +
        '<td data-label="Start"><input type="time" class="availStart" data-change="slotChange" value="' + esc(start) + '"></td>' +
        '<td data-label="End"><input type="time" class="availEnd" data-change="slotChange" value="' + esc(end) + '"></td>' +
        '<td data-label=""><button class="btn ghost" data-act="removeSlot">Remove</button></td></tr>';
}

function addSlotRow(day, start, end) {
    const body = $("availBody");
    body.insertAdjacentHTML("beforeend", slotRow(day, start, end));
    flashRow(body.lastElementChild);
    syncAvailEmpty();
    drawWeekPreview();
}

ACTIONS.addSlot = function () { addSlotRow("Monday", "08:00", "10:00"); };

ACTIONS.addPreset = function (chip) {
    addSlotRow($("presetDay").value, chip.dataset.from, chip.dataset.to);
};

ACTIONS.slotChange = function () { drawWeekPreview(); };

ACTIONS.removeSlot = function (button) {
    const row = button.closest("tr");
    row.classList.add("leaving");
    drawWeekPreview();
    setTimeout(function () { row.remove(); syncAvailEmpty(); }, 250);
};

ACTIONS.saveAvail = async function (button) {
    const rows = Array.from($("availBody").querySelectorAll("tr.slotRow:not(.leaving)"));
    const slots = [];

    for (let i = 0; i < rows.length; i++) {
        const day = rows[i].querySelector(".availDay").value;
        const startEl = rows[i].querySelector(".availStart");
        const endEl = rows[i].querySelector(".availEnd");
        if (!startEl.value || !endEl.value) { markInvalid(startEl.value ? endEl : startEl, "Row " + (i + 1) + ": fill in the start and end time."); return; }
        if (endEl.value <= startEl.value) { markInvalid(endEl, "Row " + (i + 1) + ": end time must be later than the start time."); return; }
        slots.push({ day_of_week: day, start_time: startEl.value, end_time: endEl.value, row: rows[i] });
    }

    // two slots on the same day may not overlap
    for (let a = 0; a < slots.length; a++) {
        for (let b = a + 1; b < slots.length; b++) {
            if (slots[a].day_of_week === slots[b].day_of_week &&
                slots[a].start_time < slots[b].end_time && slots[b].start_time < slots[a].end_time) {
                markInvalid(slots[b].row.querySelector(".availStart"), "Rows " + (a + 1) + " and " + (b + 1) + " overlap on " + slots[a].day_of_week + ".");
                return;
            }
        }
    }

    setBusy(button, true, "Saving...");
    try {
        await api("/api/availability/" + currentUser.id, "PUT", {
            slots: slots.map(function (s) { return { day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time }; }),
        });
        toast(slots.length ? "Schedule confirmed! Your preferred vacant time was saved." : "Your vacant time list is now empty.", "success");
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

// =====================================================
// 6. COORDINATOR: SECTIONS (create, edit, conflicts)
// =====================================================
async function renderCoordSections() {
    const r = await Promise.all([
        api("/api/sections"),
        api("/api/courses"),
        api("/api/professors"),
        api("/api/conflicts").catch(function () { return []; }),
    ]);
    coordState.sections = r[0];
    coordState.courses = r[1];
    coordState.profs = r[2];
    coordState.conflicts = r[3];
    coordState.editingSection = null;

    return '<div id="secConflicts">' + conflictsPanel() + "</div>" +
        '<div id="secFormBox"></div>' +
        '<div class="panel"><div class="panelHead"><h3>Sections</h3>' +
        '<button class="btn" data-act="secNew">+ Add Section</button></div>' +
        '<div id="secTable">' + sectionsAdminTable(true) + "</div></div>";
}

function profName(id) {
    const p = coordState.profs.find(function (x) { return x.id === id; });
    return p ? p.name : "Professor #" + id;
}

function secLabel(id) {
    const s = coordState.sections.find(function (x) { return x.id === id; });
    return s ? s.course_code + " " + String(s.section_code).trim() : "#" + id;
}

function conflictsPanel() {
    const list = coordState.conflicts || [];
    const head = '<div class="panelHead"><h3>Schedule Conflicts</h3><span class="status ' + (list.length ? "red" : "ok") + '">' +
        (list.length ? list.length + " found" : "None") + "</span></div>";
    if (!list.length) return '<div class="panel">' + head + '<p class="muted">No overlapping classes for the same professor.</p></div>';
    return '<div class="panel">' + head + renderTable([
        { label: "Professor", render: function (c) { return esc(profName(c.professor_id)); } },
        { label: "Day", key: "day_of_week" },
        { label: "Sections", render: function (c) { return esc(secLabel(c.section_id_1) + " / " + secLabel(c.section_id_2)); } },
        { label: "Overlap", render: function (c) {
            return esc(fmtTime(c.start_1) + " - " + fmtTime(c.end_1)) + "<br>" + esc(fmtTime(c.start_2) + " - " + fmtTime(c.end_2));
        } },
    ], list, { animate: false }) + "</div>";
}

function sectionsAdminTable(animate) {
    return renderTable([
        { label: "Course", render: function (s) { return esc(s.course_code) + " - " + esc(s.course_title); } },
        { label: "Section", render: function (s) { return esc(String(s.section_code).trim() || "-"); } },
        { label: "Professor", key: "professor_name" },
        { label: "Schedule", key: "schedule" },
        { label: "Enrolled", render: function (s) {
            return esc(s.current_enrollees) + " / " + esc(s.capacity) + meter(s.current_enrollees, s.capacity, STATUS_CLASS[sectionState(s)]);
        } },
        { label: "", render: function (s) {
        return '<button class="btn ghost" data-act="secEdit" data-id="' + s.id + '">Edit</button> ' +
            '<button class="btn ghost" data-act="secDelete" data-id="' + s.id + '">Delete</button>';
        } },
    ], coordState.sections, { empty: "No sections yet.", animate: animate });
}

// IT21S + (highest number used by that course + 1)
function nextSectionCode(courseId) {
    const course = coordState.courses.find(function (c) { return c.id === Number(courseId); });
    let max = 0;
    coordState.sections.forEach(function (s) {
        if (course && s.course_code === course.code) {
            const m = /(\d+)\s*$/.exec(String(s.section_code));
            if (m) max = Math.max(max, Number(m[1]));
        }
    });
    return "IT21S" + (max + 1);
}

function secSlotRow(day, start, end) {
    const options = DAYS.map(function (d) { return "<option" + (d === day ? " selected" : "") + ">" + d + "</option>"; }).join("");
    return '<tr class="slotRow">' +
        '<td data-label="Day"><select class="secDay">' + options + "</select></td>" +
        '<td data-label="Start"><input type="time" class="secStart" value="' + esc(start) + '"></td>' +
        '<td data-label="End"><input type="time" class="secEnd" value="' + esc(end) + '"></td>' +
        '<td data-label=""><button class="btn ghost" data-act="secRemoveSlot">Remove</button></td></tr>';
}

// s = section to edit, or null for a new one
function secForm(s) {
    const edit = !!s;
    const profOptions = '<option value="">Select professor</option>' + coordState.profs.map(function (p) {
        return '<option value="' + p.id + '"' + (edit && s.professor_id === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>";
    }).join("");
    const slots = edit && s.slots.length ? s.slots : [{ day_of_week: "Monday", start_time: "08:00", end_time: "10:00" }];

    const top = edit
        ? '<div class="field"><label>Course</label><input disabled value="' + esc(s.course_code + " - " + s.course_title) + '"></div>' +
          '<div class="field"><label>Section Code</label><input disabled value="' + esc(String(s.section_code).trim()) + '"></div>'
        : '<div class="field"><label for="secCourse">Course</label><select id="secCourse" data-change="secCourseChange">' +
          coordState.courses.map(function (c) { return '<option value="' + c.id + '">' + esc(c.code) + " - " + esc(c.title) + "</option>"; }).join("") + "</select></div>" +
          '<div class="field"><label for="secCode">Section Code</label><input id="secCode" value="' + esc(nextSectionCode(coordState.courses[0] && coordState.courses[0].id)) + '"></div>';

    return '<div class="panel"><div class="panelHead"><h3>' + (edit ? "Edit Section" : "New Section") + "</h3></div>" +
        '<div class="formGrid">' + top +
        '<div class="field"><label for="secProf">Professor</label><select id="secProf">' + profOptions + "</select></div>" +
        '<div class="field"><label for="secCap">Capacity</label><input id="secCap" type="number" min="1" value="' + (edit ? s.capacity : 40) + '"></div>' +
        (edit ? '<div class="field"><label for="secEnr">Enrolled Students</label><input id="secEnr" type="number" min="0" value="' + s.current_enrollees + '"></div>' : "") + "</div>" +
        '<div class="toolbar"><button class="btn ghost" data-act="secAddSlot">+ Add Time Slot</button></div>' +
        '<div class="tableWrap"><table class="availTable"><thead><tr><th>Day</th><th>Start</th><th>End</th><th></th></tr></thead>' +
        '<tbody id="secBody">' + slots.map(function (x) { return secSlotRow(x.day_of_week, x.start_time, x.end_time); }).join("") + "</tbody></table></div>" +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" data-act="secSave">' + (edit ? "Save Changes" : "Create Section") + "</button>" +
        '<button class="btn ghost" data-act="secCancel">Cancel</button></div></div>';
}

function showSecForm(s) {
    coordState.editingSection = s;
    $("secFormBox").innerHTML = secForm(s);
    $("secFormBox").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function reloadSections() {
    const r = await Promise.all([api("/api/sections"), api("/api/conflicts").catch(function () { return []; })]);
    coordState.sections = r[0];
    coordState.conflicts = r[1];
    coordState.editingSection = null;
    $("secTable").innerHTML = sectionsAdminTable(false);
    $("secConflicts").innerHTML = conflictsPanel();
    $("secFormBox").innerHTML = "";
}

ACTIONS.secNew = function () { showSecForm(null); };

ACTIONS.secEdit = function (btn) {
    const s = coordState.sections.find(function (x) { return x.id === Number(btn.dataset.id); });
    if (s) showSecForm(s);
};

ACTIONS.secCancel = function () { coordState.editingSection = null; $("secFormBox").innerHTML = ""; };

ACTIONS.secDelete = async function (button) {
    const s = coordState.sections.find(function (x) { return x.id === Number(button.dataset.id); });
    if (!s || !confirm("Delete " + s.course_code + " " + String(s.section_code).trim() + "?")) return;
    try {
        await api("/api/sections/" + s.id, "DELETE");
        toast("Section deleted.", "success");
        await reloadSections();
    } catch (error) {
        toastError(error);
    }
};

ACTIONS.secCourseChange = function (select) { $("secCode").value = nextSectionCode(select.value); };

ACTIONS.secAddSlot = function () { $("secBody").insertAdjacentHTML("beforeend", secSlotRow("Monday", "08:00", "10:00")); };

ACTIONS.secRemoveSlot = function (btn) { btn.closest("tr").remove(); };

ACTIONS.secSave = async function (button) {
    const edit = coordState.editingSection;
    const prof = $("secProf"), cap = $("secCap");

    if (!prof.value) { markInvalid(prof, "Choose a professor."); return; }
    if (!(Number(cap.value) > 0)) { markInvalid(cap, "Enter a capacity above 0."); return; }

    const enr = edit ? $("secEnr") : null;
    if (enr && !(Number(enr.value) >= 0)) { markInvalid(enr, "Enter 0 or more."); return; }
    if (enr && Number(enr.value) > Number(cap.value)) { markInvalid(enr, "Cannot be more than the capacity."); return; }

    const slots = [];
    const rows = Array.from($("secBody").querySelectorAll("tr.slotRow"));
    for (let i = 0; i < rows.length; i++) {
        const st = rows[i].querySelector(".secStart"), en = rows[i].querySelector(".secEnd");
        if (!st.value || !en.value) { markInvalid(st.value ? en : st, "Fill in the start and end time."); return; }
        if (en.value <= st.value) { markInvalid(en, "End must be later than start."); return; }
        slots.push({ day_of_week: rows[i].querySelector(".secDay").value, start_time: st.value, end_time: en.value });
    }
    if (!slots.length) { toast("Add at least one time slot.", "error"); return; }

    setBusy(button, true, "Saving...");
    try {
        if (edit) {
            await api("/api/sections/" + edit.id, "PUT", { professor_id: Number(prof.value), capacity: Number(cap.value), current_enrollees: Number(enr.value), slots: slots });
        } else {
            const code = $("secCode").value.trim();
            if (!code) { markInvalid($("secCode"), "Enter a section code."); return; }
            await api("/api/sections", "POST", {
                course_id: Number($("secCourse").value), professor_id: Number(prof.value),
                capacity: Number(cap.value), section_code: code, slots: slots,
            });
        }
        toast(edit ? "Section updated!" : "Section created!", "success");
        await reloadSections();
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

// =====================================================
// 7. COORDINATOR: COURSES (add, list)
// =====================================================
async function renderCoordCourses() {
    coordState.courseList = await api("/api/courses");
    return '<div class="panel"><div class="panelHead"><h3>Add Course</h3></div>' +
        '<div class="formGrid">' +
        '<div class="field"><label for="crsCode">Course Code</label><input id="crsCode" placeholder="e.g. SAD 003"></div>' +
        '<div class="field"><label for="crsTitle">Title</label><input id="crsTitle" placeholder="Course title"></div>' +
        '<div class="field"><label for="crsUnits">Units</label><input id="crsUnits" type="number" min="1" max="6" value="3"></div></div>' +
        '<button class="btn" data-act="courseAdd">Add Course</button></div>' +
        '<div class="panel"><div class="panelHead"><h3>Courses</h3><span class="muted" id="crsCount">' + coordState.courseList.length + ' total</span></div>' +
        '<div id="crsTable">' + coursesTable(true) + "</div></div>";
}

function coursesTable(animate) {
    return renderTable([
        { label: "Code", key: "code" },
        { label: "Title", key: "title" },
        { label: "Units", key: "units" },
    ], coordState.courseList, { empty: "No courses yet.", animate: animate });
}

ACTIONS.courseAdd = async function (button) {
    const code = $("crsCode"), title = $("crsTitle"), units = $("crsUnits");
    if (!code.value.trim()) { markInvalid(code, "Enter a course code."); return; }
    if (!title.value.trim()) { markInvalid(title, "Enter a title."); return; }
    if (!(Number(units.value) >= 1)) { markInvalid(units, "Units must be at least 1."); return; }

    setBusy(button, true, "Adding...");
    try {
        await api("/api/courses", "POST", { code: code.value.trim(), title: title.value.trim(), units: Number(units.value) });
        toast("Course " + code.value.trim() + " added!", "success");
        code.value = ""; title.value = ""; units.value = 3;
        coordState.courseList = await api("/api/courses");
        $("crsTable").innerHTML = coursesTable(false);
        $("crsCount").textContent = coordState.courseList.length + " total";
        flashRow(document.querySelector("#crsTable tbody tr"));
    } catch (error) {
        toastError(error);
    } finally {
        setBusy(button, false);
    }
};

// opens the New Section form with the course picked from an approved recommendation
PAGES.COORDINATOR.find(function (p) { return p.id === "sections"; }).mount = function () {
    if (!coordState.prefillCourse) return;
    showSecForm(null);
    $("secCourse").value = coordState.prefillCourse;
    $("secCode").value = nextSectionCode(coordState.prefillCourse);
    coordState.prefillCourse = null;
};

// the availability page needs its empty-state check right after the HTML is drawn
PAGES.FACULTY.find(function (p) { return p.id === "availability"; }).mount = syncAvailEmpty;