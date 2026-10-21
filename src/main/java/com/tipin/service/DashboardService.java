package com.tipin.service;

import com.tipin.dao.DashboardDAO;
import java.util.Map;

public class DashboardService {
    public static Map<String, Integer> getStats(String role, int userId) throws Exception {
        DashboardDAO dao = new DashboardDAO();
        if (role.equals("STUDENT")) return dao.studentStats(userId);
        if (role.equals("PROFESSOR")) return dao.professorStats(userId);
        throw new Exception("Invalid role");
    }
}