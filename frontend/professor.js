// professor.js
// Professor pages: Dashboard, My Schedule, Availability.
//
// From web.js:     getJson, esc, currentUser
// From helpers.js: putJson, toast, toastError, renderCards

// =====================================================
// 1. DASHBOARD
// =====================================================
function loadProfessorDashboard() {
    getJson("/api/dashboard?role=PROFESSOR&user_id=" + currentUser.id)
        .then(function (data) {
            renderCards("dashboardCards", data);
        })
        .catch(toastError);
}

// =====================================================
// 2. MY SCHEDULE  (the sections this professor teaches)
// This page is separate from Availability: schedule = classes already
// assigned, availability = times the professor CAN teach.
// =====================================================
function loadProfessorSchedule() {
    getJson("/api/sections?professor_id=" + currentUser.id)
        .then(function (sections) {
            const table = document.getElementById("scheduleTable");
            while (table.rows.length > 1) table.deleteRow(1);

            if (sections.length === 0) {
                table.insertRow(-1).innerHTML =
                    '<td colspan="3" class="muted">No sections assigned to you yet.</td>';
                return;
            }

            sections.forEach(function (s) {
                table.insertRow(-1).innerHTML =
                    "<td>" + esc(s.course_code) + " - " + esc(s.course_title) + "</td>" +
                    "<td>" + esc(s.schedule) + "</td>" +
                    "<td>" + s.current_enrollees + " / " + s.capacity + "</td>";
            });
        })
        .catch(toastError);
}

// =====================================================
// 3. AVAILABILITY  (editable rows)
// =====================================================
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Load the saved availability and show one editable row per slot
function loadProfessorAvailability() {
    getJson("/api/availability/" + currentUser.id)
        .then(function (slots) {
            const table = document.getElementById("availabilityTable");
            while (table.rows.length > 1) table.deleteRow(1);

            slots.forEach(function (s) {
                // the database sends times like "08:00:00", the time box needs "08:00"
                addAvailabilityRow(
                    s.day_of_week,
                    s.start_time.slice(0, 5),
                    s.end_time.slice(0, 5)
                );
            });
        })
        .catch(toastError);
}

// Add one editable row (day select + start time + end time + Remove button)
// Called with no values by the "Add Time Slot" button.
function addAvailabilityRow(day, start, end) {
    day = day || "Monday";
    start = start || "08:00";
    end = end || "10:00";

    // build the <option> list for the day select
    let options = "";
    DAYS.forEach(function (d) {
        options += "<option" + (d === day ? " selected" : "") + ">" + d + "</option>";
    });

    const table = document.getElementById("availabilityTable");
    table.insertRow(-1).innerHTML =
        '<td><select class="availDay">' + options + "</select></td>" +
        '<td><input type="time" class="availStart" value="' + start + '"></td>' +
        '<td><input type="time" class="availEnd" value="' + end + '"></td>' +
        '<td><button class="btn" onclick="removeAvailabilityRow(this)">Remove</button></td>';
}

// "button" is the Remove button that was clicked; its row is removed
function removeAvailabilityRow(button) {
    button.closest("tr").remove();
}

// Read every row, check it, then send all rows to the server
function saveAvailability() {
    const table = document.getElementById("availabilityTable");
    const slots = [];

    // start at 1 to skip the header row
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const day = row.querySelector(".availDay").value;
        const start = row.querySelector(".availStart").value;
        const end = row.querySelector(".availEnd").value;

        if (!start || !end) {
            toast("Row " + i + ": please fill in the start and end time.", "error");
            return;
        }
        // times look like "08:00", so comparing them as text works
        if (end <= start) {
            toast("Row " + i + ": the end time must be later than the start time.", "error");
            return;
        }

        slots.push({ day_of_week: day, start_time: start, end_time: end });
    }

    putJson("/api/availability/" + currentUser.id, { slots: slots })
        .then(function () {
            toast("Availability saved!", "success");
        })
        .catch(toastError);
}
