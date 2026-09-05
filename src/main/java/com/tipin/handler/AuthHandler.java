package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.AuthService;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;

public class AuthHandler implements HttpHandler 
{
    @Override
    public void handle(HttpExchange exchange) throws IOException 
    {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (!method.equals("POST")) 
        {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        if (path.equals("/auth/login")) 
        {
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                String username = json.getString("username");
                String password = json.getString("password");

                // JSONObject result = AuthService.login(username, password);

                // sendResponse(exchange, 200, JsonUtil.toJson(result));
            } catch (Exception e) {
                sendResponse(exchange, 401, "{\"error\":\"" + e.getMessage() + "\"}");
            }

        } else if (path.equals("/auth/register")) 
        {
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                // JSONObject result = AuthService.register(json);

                // sendResponse(exchange, 200, JsonUtil.toJson(result));
            } catch (Exception e) {
                sendResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
            }

        } else {
            sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException 
    {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, responseBody.getBytes().length);
        OutputStream os = exchange.getResponseBody();
        os.write(responseBody.getBytes());
        os.close();
    }
}