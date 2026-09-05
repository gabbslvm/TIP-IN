package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.AvailabilityService;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;

public class AvailabilityHandler implements HttpHandler
{
    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (method.equals("GET") && path.startsWith("/availability/"))
        {
            String professorId = path.substring("/availability/".length());
            try {
                // JSONObject result = AvailabilityService.getAvailabilityByProfessorId(professorId);
                // sendResponse(exchange, 200, JsonUtil.toJson(result));
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        } else if (method.equals("PUT") && path.startsWith("/availability/"))
        {
            String professorId = path.substring("/availability/".length());
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                // JSONObject result = AvailabilityService.updateAvailability(professorId, json);
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
