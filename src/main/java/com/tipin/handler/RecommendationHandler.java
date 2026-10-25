package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.Recommendation;
import com.tipin.service.RecommendationService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class RecommendationHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (method.equals("GET") && path.equals("/api/recommendations")) {
                JSONArray arr = new JSONArray();
                for (Recommendation r : RecommendationService.getAll()) {
                    JSONObject o = new JSONObject();
                    o.put("id", r.getId());
                    o.put("course_id", r.getCourseId());
                    o.put("course_code", r.getCourseCode());
                    o.put("course_title", r.getCourseTitle());
                    o.put("demand_count", r.getDemandCount());
                    o.put("petition_count", r.getPetitionCount());
                    o.put("capacity", r.getCapacity());
                    o.put("suggested_action", r.getSuggestedAction());
                    o.put("status", r.getStatus());
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());

            } else if (method.equals("PUT") && path.startsWith("/api/recommendations/")) {
                int id = Integer.parseInt(HandlerUtil.lastSegment(ex));
                String status = JsonUtil.parse(HandlerUtil.readBody(ex)).getString("status");
                RecommendationService.updateStatus(id, status);
                HandlerUtil.sendResponse(ex, 200, "{\"message\":\"Updated\"}");

            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}