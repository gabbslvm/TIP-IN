// helpers.js
// Small shared helpers used by student.js and professor.js.
// NOTE: If a teammate already wrote toast(), statusBadge(), putJson() or
// renderCards(), delete the duplicate here so the names are not defined twice.
//
// These come from web.js (already in the project): getJson, postJson, esc.

// ---------- PUT request (web.js only has GET and POST) ----------
function putJson(path, body) {
    return fetch(API_URL + path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then(function (response) {
        return response.json().then(function (data) {
            if (!response.ok) throw new Error(data.error || "Request failed");
            return data;
        });
    });
}

// ---------- Toast: a small message that appears, then disappears ----------
// type is "success" or "error"
function toast(message, type) {
    // remove an older toast first so two messages never overlap
    document.querySelectorAll(".toast").forEach(function (old) {
        old.remove();
    });

    const box = document.createElement("div");
    box.className = "toast " + (type || "success");
    box.textContent = message;
    document.body.appendChild(box);

    // remove it after 3 seconds
    setTimeout(function () {
        box.remove();
    }, 3000);
}

// Use this in .catch(...) to show a failed request as a red toast
function toastError(error) {
    if (error.message === "Failed to fetch") {
        toast("Cannot reach the server. It may be waking up, try again in a minute.", "error");
    } else {
        toast(error.message, "error");
    }
}

// ---------- Petition status badge ----------
// The database stores PENDING, UNDER_REVIEW, APPROVED, REJECTED.
// This turns the stored word into a colored label.
function statusBadge(status) {
    const labels = {
        PENDING: "Pending",
        UNDER_REVIEW: "Under Review",
        APPROVED: "Approved",
        REJECTED: "Rejected",
    };
    // colors come from styles.css: "status" = green, "warn" = yellow, "red" = red
    const colors = {
        PENDING: "warn",
        UNDER_REVIEW: "warn",
        APPROVED: "",
        REJECTED: "red",
    };
    const label = labels[status] || status;
    const color = colors[status] || "";
    return '<span class="status ' + color + '">' + esc(label) + "</span>";
}

// ---------- Dashboard cards ----------
// The /dashboard endpoint returns simple numbers, for example:
//   { "my_petitions": 3, "pending": 1, "approved": 2 }
// Each key becomes one card: "my_petitions" -> "MY PETITIONS".
function renderCards(containerId, data) {
    let html = "";
    Object.keys(data).forEach(function (key) {
        const label = key.replace(/_/g, " ").toUpperCase();
        html +=
            '<div class="card">' +
            '<div class="label">' + esc(label) + "</div>" +
            '<div class="number">' + esc(String(data[key])) + "</div>" +
            "</div>";
    });
    document.getElementById(containerId).innerHTML = html;
}
