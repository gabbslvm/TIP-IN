package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.AnnouncementService;
import com.tipin.util.HandlerUtil;
import com.tipin.util.JsonUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class AnnouncementHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex))
            return;

        try {
            if (ex.getRequestMethod().equals("GET") && ex.getRequestURI().getPath().equals("/api/announcements")) {
                JSONArray arr = new JSONArray();
                for (String[] a : AnnouncementService.getAll()) {
                    JSONObject o = new JSONObject();
                    o.put("title", a[0]);
                    o.put("message", a[1]);
                    o.put("id", a[2]);
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());
            } else if (ex.getRequestMethod().equals("POST")
                    && ex.getRequestURI().getPath().equals("/api/announcements")) {
                JSONObject j = JsonUtil.parse(HandlerUtil.readBody(ex));
                String title = j.getString("title").trim();
                String message = j.getString("message").trim();
                if (title.isEmpty() || message.isEmpty()) {
                    HandlerUtil.sendError(ex, 400, "Title and message are required");
                    return;
                }
                AnnouncementService.add(title, message);
                HandlerUtil.sendResponse(ex, 201, "{\"message\":\"Announcement posted\"}");
            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (org.json.JSONException e) {
            HandlerUtil.sendError(ex, 400, "Title and message are required");
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 500, e.getMessage());
        }
    }
}