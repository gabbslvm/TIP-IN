package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.CourseInterest;
import com.tipin.service.CourseInterestService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class CourseInterestHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;   // browser preflight
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/demand")) {
                JSONArray arr = new JSONArray();
                for (Object[] r : CourseInterestService.getDemandCounts()) {
                    JSONObject o = new JSONObject();
                    o.put("course_id", r[0]);
                    o.put("course_code", r[1]);
                    o.put("course_title", r[2]);
                    o.put("count", r[3]);
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());

            } else if (method.equals("POST") && path.equals("/api/demand")) {
                JSONObject j = JsonUtil.parse(HandlerUtil.readBody(ex));
                CourseInterest ci = new CourseInterest();
                ci.setStudentId(j.getInt("student_id"));
                ci.setCourseId(j.getInt("course_id"));

                if (CourseInterestService.submitInterest(ci)) {
                    HandlerUtil.sendResponse(ex, 201, "{\"message\":\"Interest recorded\"}");
                } else {
                    HandlerUtil.sendError(ex, 409, "You already indicated interest in this course");
                }
            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}