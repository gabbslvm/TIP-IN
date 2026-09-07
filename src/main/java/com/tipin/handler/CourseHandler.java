package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.CourseService;
import com.tipin.util.JsonUtil;
import com.tipin.model.Course;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

public class CourseHandler implements HttpHandler 
{
    @Override
    public void handle(HttpExchange exchange) throws IOException 
    {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (method.equals("OPTIONS")) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (method.equals("GET") && path.equals("/api/courses")) 
        {
            try {
                List<Course> courses = CourseService.getAllCourses();

                JSONArray array = new JSONArray();
                for (Course c : courses) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", c.getId());
                    obj.put("code", c.getCode());
                    obj.put("title", c.getTitle());
                    obj.put("units", c.getUnits());
                    array.put(obj);
                }

                sendResponse(exchange, 200, array.toString());
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
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