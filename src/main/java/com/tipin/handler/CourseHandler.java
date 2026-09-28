package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Course;
import com.tipin.service.CourseService;
import com.tipin.util.HandlerUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class CourseHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HandlerUtil.handleCors(exchange)) return;

        String path = exchange.getRequestURI().getPath();

        if (exchange.getRequestMethod().equals("GET") && path.equals("/api/courses")) {
            try {
                JSONArray array = new JSONArray();
                for (Course c : CourseService.getAllCourses()) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", c.getId());
                    obj.put("code", c.getCode());
                    obj.put("title", c.getTitle());
                    obj.put("units", c.getUnits());
                    array.put(obj);
                }
                HandlerUtil.sendResponse(exchange, 200, array.toString());
            } catch (Exception e) {
                HandlerUtil.sendError(exchange, 500, e.getMessage());
            }
        } else {
            HandlerUtil.sendError(exchange, 404, "Not found");
        }
    }
}