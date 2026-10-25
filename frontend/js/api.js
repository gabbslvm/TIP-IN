// api.js
// One fetch wrapper for every request: api(path, method, body)
// Returns the parsed JSON, or throws an Error whose message is data.error.
// When logged in, every request carries the session token in the Authorization header.

const API_URL = "https://tip-in.onrender.com";   // the backend server (the same origin in production)

async function api(path, method, body) {
    const options = { method: method || "GET", headers: {} };

    if (currentUser && currentUser.token) {
        options.headers["Authorization"] = "Bearer " + currentUser.token;
    }

    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(API_URL + path, options);
    } catch (networkError) {
        // fetch() itself failed: offline, CORS, or the free host is still waking up
        throw new Error("Cannot reach the server. It may be waking up, try again in a minute.");
    }

    let data = null;
    try {
        data = await response.json();
    } catch (parseError) {
        data = null; // empty or non-JSON body
    }

    if (!response.ok) {
        // the server no longer accepts our token (expired or logged out elsewhere)
        if (response.status === 401 && currentUser && path !== "/api/auth/logout") {
            logout("Your session expired. Please log in again.");
        }
        throw new Error((data && data.error) || "Request failed (" + response.status + ")");
    }
    return data;
}