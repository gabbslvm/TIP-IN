package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.EnrollmentService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONObject;
import java.io.IOException;

public class EnrollmentHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("POST") && path.equals("/api/enrollments")) {
                JSONObject j = JsonUtil.parse(HandlerUtil.readBody(ex));
                EnrollmentService.enroll(j.getInt("student_id"), j.getInt("section_id"));
                HandlerUtil.sendResponse(ex, 201, "{\"message\":\"Section added\"}");

            } else if (method.equals("DELETE") && path.equals("/api/enrollments")) {
                String sid = HandlerUtil.getQueryParam(ex, "student_id");
                String sec = HandlerUtil.getQueryParam(ex, "section_id");
                if (sid == null || sec == null) {
                    HandlerUtil.sendError(ex, 400, "student_id and section_id are required");
                    return;
                }
                if (!EnrollmentService.drop(Integer.parseInt(sid), Integer.parseInt(sec))) {
                    HandlerUtil.sendError(ex, 404, "You are not enrolled in this section");
                    return;
                }
                HandlerUtil.sendResponse(ex, 200, "{\"message\":\"Section dropped\"}");

            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}