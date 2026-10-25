package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Section;
import com.tipin.model.SectionSlot;
import com.tipin.model.User;
import com.tipin.service.SectionService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.List;

public class SectionHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) {
            return;
        }

        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/sections")) {
                User caller = HandlerUtil.requireAuth(ex);   // any logged-in user
                if (caller == null) return;

                String professorId = HandlerUtil.getQueryParam(ex, "professor_id");
                String studentId = HandlerUtil.getQueryParam(ex, "student_id");

                // a filter must be the caller's own id, unless the caller is a coordinator
                boolean coordinator = caller.getRole().equalsIgnoreCase("coordinator");
                if (!coordinator
                        && ((professorId != null && Integer.parseInt(professorId) != caller.getId())
                        || (studentId != null && Integer.parseInt(studentId) != caller.getId()))) {
                    HandlerUtil.deny(ex);
                    return;
                }

                List<Section> sections;

                if (professorId != null) {
                    sections = SectionService.getByProfessor(Integer.parseInt(professorId));
                } else if (studentId != null) {
                    sections = SectionService.getByStudent(Integer.parseInt(studentId));
                } else {
                    sections = SectionService.getAll();
                }

                JSONArray arr = new JSONArray();

                for (Section s : sections) {
                    JSONObject o = new JSONObject();

                    o.put("id", s.getId());
                    o.put("professor_id", s.getProfessorId());
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
                return;
            }

            if (method.equals("POST") && path.equals("/api/sections")) {
                if (HandlerUtil.requireAuth(ex, "coordinator") == null) return;

                JSONObject body = JsonUtil.parse(HandlerUtil.readBody(ex));

                int courseId = body.getInt("course_id");
                int professorId = body.getInt("professor_id");
                int capacity = body.getInt("capacity");
                String sectionCode = body.getString("section_code").trim();
                JSONArray slots = body.getJSONArray("slots");

                int sectionId = SectionService.createSection(
                        courseId,
                        professorId,
                        capacity,
                        sectionCode,
                        slots);

                JSONObject response = new JSONObject();
                response.put("message", "Section created successfully");
                response.put("id", sectionId);

                HandlerUtil.sendResponse(ex, 201, response.toString());
                return;
            }

            if (method.equals("PUT") && path.matches("/api/sections/\\d+")) {
                if (HandlerUtil.requireAuth(ex, "coordinator") == null) return;

                int sectionId = Integer.parseInt(
                        HandlerUtil.lastSegment(ex));

                JSONObject body = JsonUtil.parse(HandlerUtil.readBody(ex));

                int professorId = body.getInt("professor_id");
                int capacity = body.getInt("capacity");
                int enrollees = body.getInt("current_enrollees");
                JSONArray slots = body.getJSONArray("slots");

                boolean updated = SectionService.updateSection(
                        sectionId,
                        professorId,
                        capacity,
                        enrollees,
                        slots);

                if (!updated) {
                    HandlerUtil.sendError(ex, 404, "Section not found");
                    return;
                }

                JSONObject response = new JSONObject();
                response.put("message", "Section updated successfully");
                response.put("id", sectionId);

                HandlerUtil.sendResponse(ex, 200, response.toString());
                return;
            }

            if (method.equals("GET") && path.equals("/api/conflicts")) {
                if (HandlerUtil.requireAuth(ex, "coordinator") == null) return;

                JSONArray conflicts = SectionService.getScheduleConflicts();
                HandlerUtil.sendResponse(ex, 200, conflicts.toString());
                return;
            }

            if (method.equals("DELETE") && path.matches("/api/sections/\\d+")) {
                if (HandlerUtil.requireAuth(ex, "coordinator") == null) return;

                int sectionId = Integer.parseInt(HandlerUtil.lastSegment(ex));

                if (!SectionService.deleteSection(sectionId)) {
                    HandlerUtil.sendError(ex, 404, "Section not found");
                    return;
                }

                HandlerUtil.sendResponse(ex, 200, "{\"message\":\"Section deleted\"}");
                return;
            }

            HandlerUtil.sendError(ex, 404, "Not found");

        } catch (Exception e) {
            HandlerUtil.sendError(
                    ex,
                    400,
                    e.getMessage() == null ? "Request failed" : e.getMessage());
        }
    }
}