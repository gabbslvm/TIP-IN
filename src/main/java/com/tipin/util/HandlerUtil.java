package com.tipin.util;

import com.sun.net.httpserver.HttpExchange;
import com.tipin.model.User;
import com.tipin.service.AuthService;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class HandlerUtil {

    public static void sendResponse(HttpExchange exchange, int statusCode, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        JSONObject json = new JSONObject();
        json.put("error", message == null ? "Unknown error" : message);
        sendResponse(exchange, statusCode, json.toString());
    }

    public static boolean handleCors(HttpExchange exchange) throws IOException {
        if (exchange.getRequestMethod().equals("OPTIONS")) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    public static String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    // Reads ?key=value from the URL, e.g. /api/petitions?student_id=3
    public static String getQueryParam(HttpExchange ex, String key) {
        String q = ex.getRequestURI().getQuery();
        if (q == null) return null;
        for (String pair : q.split("&")) {
            String[] kv = pair.split("=");
            if (kv.length == 2 && kv[0].equals(key)) return kv[1];
        }
        return null;
    }

    // Gets the last part of the path, e.g. /api/petitions/5 -> "5"
    public static String lastSegment(HttpExchange ex) {
        String p = ex.getRequestURI().getPath();
        return p.substring(p.lastIndexOf('/') + 1);
    }

    // The token from "Authorization: Bearer <token>", or null
    public static String bearerToken(HttpExchange ex) {
        String h = ex.getRequestHeaders().getFirst("Authorization");
        return (h != null && h.startsWith("Bearer ")) ? h.substring(7).trim() : null;
    }

    // Returns the logged-in user if the token is valid and the role is allowed (no roles = any role).
    // Otherwise it sends 401/403 itself and returns null, so the handler just does: if (u == null) return;
    public static User requireAuth(HttpExchange ex, String... roles) throws IOException {
        String token = bearerToken(ex);
        User user;
        try {
            user = (token == null || token.isEmpty()) ? null : AuthService.authenticate(token);
        } catch (Exception e) {
            sendError(ex, 500, "Could not verify your session");
            return null;
        }
        if (user == null) {
            sendError(ex, 401, "Your session expired. Please log in again.");
            return null;
        }
        if (roles.length > 0 && !Arrays.asList(roles).contains(user.getRole().toLowerCase())) {
            sendError(ex, 403, "You are not allowed to do that");
            return null;
        }
        return user;
    }

    // For checks like "this student_id must be the caller's own id"
    public static void deny(HttpExchange ex) throws IOException {
        sendError(ex, 403, "You are not allowed to do that");
    }
}