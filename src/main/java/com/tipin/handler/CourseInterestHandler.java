package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.CourseInterestService;
import com.tipin.util.JsonUtil;
import com.tipin.model.CourseInterest;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

public class CourseInterestHandler implements HttpHandler 
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

        if (method.equals("GET") && path.equals("/api/demand")) 
        {
            try {
                List<Object[]> counts = CourseInterestService.getDemandCounts();

                JSONArray array = new JSONArray();
                for (Object[] row : counts) {
                    JSONObject obj = new JSONObject();
                    obj.put("course_id", row[0]);
                    obj.put("count", row[1]);
                    array.put(obj);
                }

                sendResponse(exchange, 200, array.toString());
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }

        } else if (method.equals("POST") && path.equals("/api/demand")) 
        {
            try {
                String requestBody = new String(exchange.getRequestBody().readAllBytes());
                JSONObject json = JsonUtil.parse(requestBody);

                CourseInterest interest = new CourseInterest();
                interest.setStudentId(json.getInt("student_id"));
                interest.setCourseId(json.getInt("course_id"));

                CourseInterestService.submitInterest(interest);

                sendResponse(exchange, 201, "{\"message\":\"Interest recorded\"}");
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