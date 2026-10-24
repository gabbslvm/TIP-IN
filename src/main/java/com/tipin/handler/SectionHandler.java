package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Section;
import com.tipin.model.SectionSlot;
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
                String professorId = HandlerUtil.getQueryParam(ex, "professor_id");

                List<Section> list;

                if (professorId == null) {
                    list = SectionService.getAll();
                } else {
                    list = SectionService.getByProfessor(
                        Integer.parseInt(professorId)
                    );
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

                    JSONArray slots = new JSONArray();

                    for (SectionSlot slot : s.getSlots()) {
                        JSONObject slotJson = new JSONObject();

                        slotJson.put("day_of_week", slot.getDayOfWeek());
                        slotJson.put("start_time", slot.getStartTime());
                        slotJson.put("end_time", slot.getEndTime());

                        slots.put(slotJson);
                    }

                    o.put("slots", slots);
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
