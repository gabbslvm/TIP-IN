package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.service.AnnouncementService;
import com.tipin.util.HandlerUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class AnnouncementHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;

        try {
            if (ex.getRequestMethod().equals("GET") && ex.getRequestURI().getPath().equals("/api/announcements")) {
                JSONArray arr = new JSONArray();
                for (String[] a : AnnouncementService.getAll()) {
                    JSONObject o = new JSONObject();
                    o.put("title", a[0]);
                    o.put("message", a[1]);
                    arr.put(o);
                }
                HandlerUtil.sendResponse(ex, 200, arr.toString());
            } else {
                HandlerUtil.sendError(ex, 404, "Not found");
            }
        } catch (Exception e) {
            HandlerUtil.sendError(ex, 500, e.getMessage());
        }
    }
}