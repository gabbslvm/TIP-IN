package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.User;
import com.tipin.service.AuthService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;

public class AuthHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HandlerUtil.handleCors(exchange)) return;

        String path = exchange.getRequestURI().getPath();

        if (!exchange.getRequestMethod().equals("POST")) {
            HandlerUtil.sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            JSONObject json = JsonUtil.parse(HandlerUtil.readBody(exchange));

            if (path.equals("/api/auth/login")) {
                User user = AuthService.login(json.getString("email"), json.getString("password"));
                if (user == null) {
                    HandlerUtil.sendError(exchange, 401, "Invalid email or password");
                    return;
                }
                JSONObject userJson = new JSONObject();
                userJson.put("id", user.getId());
                userJson.put("name", user.getName());
                userJson.put("email", user.getEmail());
                userJson.put("role", user.getRole());
                HandlerUtil.sendResponse(exchange, 200, userJson.toString());

            } else if (path.equals("/api/auth/register")) {
                User newUser = new User();
                newUser.setName(json.getString("name"));
                newUser.setEmail(json.getString("email"));
                newUser.setPassword(json.getString("password"));
                newUser.setRole(json.getString("role"));
                AuthService.register(newUser);

                JSONObject ok = new JSONObject();
                ok.put("message", "User registered successfully");
                HandlerUtil.sendResponse(exchange, 201, ok.toString());

            } else {
                HandlerUtil.sendError(exchange, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(exchange, 400, e.getMessage());
        }
    }
}