package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.AuthService;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;
import com.tipin.model.User;

public class AuthHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        if (method.equals("OPTIONS")) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!method.equals("POST")) {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        if (path.equals("/api/auth/login")) {
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                String email = json.getString("email");
                String password = json.getString("password");

                User user = AuthService.login(email, password);

                if (user != null) {
                    JSONObject userJson = new JSONObject();
                    userJson.put("id", user.getId());
                    userJson.put("name", user.getName());
                    userJson.put("email", user.getEmail());
                    userJson.put("role", user.getRole());

                    sendResponse(exchange, 200, JsonUtil.toJson(userJson));
                } else {
                    sendResponse(exchange, 401, "{\"error\":\"Invalid email or password\"}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 401, "{\"error\":\"" + e.getMessage() + "\"}");
            }

        } else if (path.equals("/api/auth/register")) {
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                User newUser = new User();
                newUser.setName(json.getString("name"));
                newUser.setEmail(json.getString("email"));
                newUser.setPassword(json.getString("password"));
                newUser.setRole(json.getString("role"));

                AuthService.register(newUser);

                sendResponse(exchange, 201, "{\"message\":\"User registered successfully\"}");
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
            }

        } else {
            sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException {
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
    exchange.sendResponseHeaders(statusCode, responseBody.getBytes().length);
    OutputStream os = exchange.getResponseBody();
    os.write(responseBody.getBytes());
    os.close();
}
}