package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.User;
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
                User caller = HandlerUtil.requireAuth(ex, "student");
                if (caller == null) return;

                JSONObject j = JsonUtil.parse(HandlerUtil.readBody(ex));
                if (j.getInt("student_id") != caller.getId()) {   // students can only enroll themselves
                    HandlerUtil.deny(ex);
                    return;
                }
                EnrollmentService.enroll(caller.getId(), j.getInt("section_id"));
                HandlerUtil.sendResponse(ex, 201, "{\"message\":\"Section added\"}");

            } else if (method.equals("DELETE") && path.equals("/api/enrollments")) {
                User caller = HandlerUtil.requireAuth(ex, "student");
                if (caller == null) return;

                String sid = HandlerUtil.getQueryParam(ex, "student_id");
                String sec = HandlerUtil.getQueryParam(ex, "section_id");
                if (sid == null || sec == null) {
                    HandlerUtil.sendError(ex, 400, "student_id and section_id are required");
                    return;
                }
                if (Integer.parseInt(sid) != caller.getId()) {   // students can only drop their own sections
                    HandlerUtil.deny(ex);
                    return;
                }
                if (!EnrollmentService.drop(caller.getId(), Integer.parseInt(sec))) {
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