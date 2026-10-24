package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.ProfAvailability;
import com.tipin.service.AvailabilityService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class AvailabilityHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) {
            return;
        }

        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/availability")) {
                JSONArray arr = new JSONArray();

                for (ProfAvailability a : AvailabilityService.getAll()) {
                    JSONObject o = new JSONObject();
                    o.put("professor_id", a.getProfessorId());
                    o.put("professor_name", a.getProfessorName());
                    o.put("day_of_week", a.getDayOfWeek());
                    o.put("start_time", a.getStartTime());
                    o.put("end_time", a.getEndTime());
                    arr.put(o);
                }

                HandlerUtil.sendResponse(ex, 200, arr.toString());
                return;

            } else if (method.equals("GET")
                    && path.startsWith("/api/availability/")) {

                int professorId = Integer.parseInt(
                    HandlerUtil.lastSegment(ex)
                );

                JSONArray arr = new JSONArray();

                for (ProfAvailability a : AvailabilityService.get(professorId)) {
                    JSONObject o = new JSONObject();
                    o.put("day_of_week", a.getDayOfWeek());
                    o.put("start_time", a.getStartTime());
                    o.put("end_time", a.getEndTime());
                    arr.put(o);
                }

                HandlerUtil.sendResponse(ex, 200, arr.toString());
                return;

            } else if (method.equals("PUT")
                    && path.startsWith("/api/availability/")) {

                int professorId = Integer.parseInt(
                    HandlerUtil.lastSegment(ex)
                );

                JSONArray arr = JsonUtil.parse(HandlerUtil.readBody(ex))
                    .getJSONArray("slots");

                List<ProfAvailability> slots = new ArrayList<>();

                for (int i = 0; i < arr.length(); i++) {
                    JSONObject o = arr.getJSONObject(i);
                    ProfAvailability s = new ProfAvailability();

                    s.setDayOfWeek(o.getString("day_of_week"));
                    s.setStartTime(o.getString("start_time"));
                    s.setEndTime(o.getString("end_time"));

                    slots.add(s);
                }

                AvailabilityService.save(professorId, slots);

                HandlerUtil.sendResponse(
                    ex, 200, "{\"message\":\"Availability saved\"}"
                );
                return;

            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }

        } catch (Exception e) {
            HandlerUtil.sendError(
                ex, 400,
                e.getMessage() == null ? "Request failed" : e.getMessage()
            );
        }
    }
}
