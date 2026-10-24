package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Section;
import com.tipin.service.SectionService;
import com.tipin.util.HandlerUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.util.List;

public class SectionHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;

        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/sections")) {
                // ?professor_id=5 -> only that professor's sections; no param -> all sections
                String professorId = HandlerUtil.getQueryParam(ex, "professor_id");

                List<Section> list;
                if (professorId == null) {
                    list = SectionService.getAll();
                } else {
                    list = SectionService.getByProfessor(Integer.parseInt(professorId));
                }

                JSONArray arr = new JSONArray();
                for (Section s : list) {
                    JSONObject o = new JSONObject();
                    o.put("id", s.getId());
                    o.put("section_code", s.getSectionCode());
                    o.put("course_code", s.getCourseCode());
                    o.put("course_title", s.getCourseTitle());
                    o.put("professor_name", s.getProfessorName());
                    o.put("schedule", s.getSchedule());
                    o.put("current_enrollees", s.getCurrentEnrollees());
                    o.put("capacity", s.getCapacity());
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());

            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}