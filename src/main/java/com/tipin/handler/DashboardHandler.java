package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.model.User;
import com.tipin.service.DashboardService;
import com.tipin.util.HandlerUtil;
import org.json.JSONObject;
import java.io.IOException;

public class DashboardHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;

        try {
            if (ex.getRequestMethod().equals("GET") && ex.getRequestURI().getPath().equals("/api/dashboard")) {
                User caller = HandlerUtil.requireAuth(ex, "student", "professor");
                if (caller == null) return;

                String role = HandlerUtil.getQueryParam(ex, "role");
                String userId = HandlerUtil.getQueryParam(ex, "user_id");
                if (role == null || userId == null) {
                    HandlerUtil.sendError(ex, 400, "role and user_id are required");
                    return;
                }
                // the role and id in the URL must be the caller's own
                if (!caller.getRole().equalsIgnoreCase(role) || caller.getId() != Integer.parseInt(userId)) {
                    HandlerUtil.deny(ex);
                    return;
                }
                JSONObject o = new JSONObject(
                        DashboardService.getStats(role.toUpperCase(), caller.getId()));
                HandlerUtil.sendResponse(ex, 200, o.toString());
            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 400, e.getMessage());
        }
    }
}