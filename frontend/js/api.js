// api.js
// One fetch wrapper for every request: api(path, method, body)
// Returns the parsed JSON, or throws an Error whose message is data.error.

const API_URL = "https://tip-in.onrender.com";

async function api(path, method, body) {
    const options = { method: method || "GET", headers: {} };

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
        throw new Error((data && data.error) || "Request failed (" + response.status + ")");
    }
    return data;
}
