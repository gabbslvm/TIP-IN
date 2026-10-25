package com.tipin.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tipin.dao.UserDAO;
import com.tipin.util.HandlerUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

public class ProfessorHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange ex) throws IOException {
        if (HandlerUtil.handleCors(ex)) return;
        try {
            if (ex.getRequestMethod().equals("GET") && ex.getRequestURI().getPath().equals("/api/professors")) {
                if (HandlerUtil.requireAuth(ex, "coordinator") == null) return;
                JSONArray arr = new JSONArray();
                for (Object[] p : new UserDAO().findProfessors()) {
                    JSONObject o = new JSONObject();
                    o.put("id", p[0]);
                    o.put("name", p[1]);
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