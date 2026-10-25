package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.User;
import com.tipin.service.AuthService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;
import java.util.List;

public class AuthHandler implements HttpHandler {
    private static final List<String> ROLES = List.of("student", "professor", "coordinator");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HandlerUtil.handleCors(exchange))
            return;

        String path = exchange.getRequestURI().getPath();

        if (!exchange.getRequestMethod().equals("POST")) {
            HandlerUtil.sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            JSONObject json = JsonUtil.parse(HandlerUtil.readBody(exchange));

            if (path.equals("/api/auth/login")) {
                String portal = json.getString("role").toLowerCase();
                User user = AuthService.login(
                        json.getString("email").trim().toLowerCase(),
                        json.getString("password"));
                if (user == null) {
                    HandlerUtil.sendError(exchange, 401, "Invalid email or password");
                    return;
                }
                if (!user.getRole().equalsIgnoreCase(portal)) {
                    HandlerUtil.sendError(exchange, 403,
                            "This is not a " + portal + " account. Please use the correct portal.");
                    return;
                }
                JSONObject userJson = new JSONObject();
                userJson.put("id", user.getId());
                userJson.put("name", user.getName());
                userJson.put("email", user.getEmail());
                userJson.put("role", user.getRole());
                HandlerUtil.sendResponse(exchange, 200, userJson.toString());

            } else if (path.equals("/api/auth/register")) {
                String role = json.getString("role").toLowerCase();
                String password = json.getString("password");
                if (!ROLES.contains(role)) {
                    HandlerUtil.sendError(exchange, 400, "Invalid role");
                    return;
                }
                if (password.length() < 8) {
                    HandlerUtil.sendError(exchange, 400, "Password must be at least 8 characters");
                    return;
                }

                User newUser = new User();
                newUser.setName(json.getString("name").trim());
                newUser.setEmail(json.getString("email").trim().toLowerCase());
                newUser.setPassword(password);
                newUser.setRole(role);

                try {
                    AuthService.register(newUser);
                } catch (Exception e) {
                    String msg = e.getMessage() == null ? "" : e.getMessage();
                    if (msg.contains("duplicate key")) {
                        HandlerUtil.sendError(exchange, 409, "Email is already registered");
                        return;
                    }
                    throw e;
                }

                JSONObject ok = new JSONObject();
                ok.put("message", "User registered successfully");
                HandlerUtil.sendResponse(exchange, 201, ok.toString());

            } else if (path.equals("/api/auth/password")) {
                int userId = json.getInt("user_id");
                String current = json.getString("current_password");
                String next = json.getString("new_password");
                if (next.length() < 8) {
                    HandlerUtil.sendError(exchange, 400, "Password must be at least 8 characters");
                    return;
                }
                AuthService.changePassword(userId, current, next);
                HandlerUtil.sendResponse(exchange, 200, "{\"message\":\"Password updated\"}");

            } else {
                HandlerUtil.sendError(exchange, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(exchange, 400, e.getMessage());
        }
    }
}