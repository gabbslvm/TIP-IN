package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Petition;
import com.tipin.service.PetitionService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.util.List;

public class PetitionHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/petitions")) {
                // ?student_id=3 -> that student's petitions; no param -> all (coordinator)
                String sid = HandlerUtil.getQueryParam(ex, "student_id");
                List<Petition> list = (sid == null)
                        ? PetitionService.getAll()
                        : PetitionService.getByStudent(Integer.parseInt(sid));

                JSONArray arr = new JSONArray();
                for (Petition p : list) {
                    JSONObject o = new JSONObject();
                    o.put("id", p.getId());
                    o.put("student_name", p.getStudentName());
                    o.put("course_code", p.getCourseCode());
                    o.put("course_title", p.getCourseTitle());
                    o.put("desired_section", p.getDesiredSection());
                    o.put("reason", p.getReason());
                    o.put("details", p.getDetails());
                    o.put("status", p.getStatus());
                    o.put("date_submitted", String.valueOf(p.getDateSubmitted()));
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());

            } else if (method.equals("POST") && path.equals("/api/petitions")) {
                JSONObject j = JsonUtil.parse(HandlerUtil.readBody(ex));
                Petition p = new Petition();
                p.setStudentId(j.getInt("student_id"));
                p.setCourseId(j.getInt("course_id"));
                p.setReason(j.getString("reason"));
                p.setDesiredSection(j.getString("desired_section").trim());
                p.setDetails(j.getString("details").trim());
                if (p.getDesiredSection().isEmpty() || p.getDetails().isEmpty()) {
                    HandlerUtil.sendError(ex, 400, "Desired section and details are required");
                    return;
                }
                PetitionService.submit(p);
                HandlerUtil.sendResponse(ex, 201, "{\"message\":\"Petition submitted\"}");

            } else if (method.equals("PUT") && path.startsWith("/api/petitions/")) {
                int id = Integer.parseInt(HandlerUtil.lastSegment(ex));
                String status = JsonUtil.parse(HandlerUtil.readBody(ex)).getString("status");
                PetitionService.updateStatus(id, status);
                HandlerUtil.sendResponse(ex, 200, "{\"message\":\"Updated\"}");

            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}