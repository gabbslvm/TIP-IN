package com.tipin.dao;

import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.LinkedHashMap;
import java.util.Map;

public class DashboardDAO {

    public Map<String, Integer> studentStats(int studentId) throws SQLException {
        String sql = "SELECT "
                + "(SELECT COUNT(*) FROM petitions WHERE student_id = ?) AS my_petitions, "
                + "(SELECT COUNT(*) FROM petitions WHERE student_id = ? AND status IN ('PENDING','UNDER_REVIEW')) AS pending, "
                + "(SELECT COUNT(*) FROM petitions WHERE student_id = ? AND status = 'APPROVED') AS approved, "
                + "(SELECT COUNT(*) FROM course_interest WHERE student_id = ?) AS courses_interested";
        return run(sql, studentId, 4);
    }

    public Map<String, Integer> professorStats(int professorId) throws SQLException {
        String sql = "SELECT "
                + "(SELECT COUNT(*) FROM sections WHERE professor_id = ?) AS my_sections, "
                + "(SELECT COUNT(*) FROM professor_availability WHERE professor_id = ?) AS availability_slots";
        return run(sql, professorId, 2);
    }

    // Sets the same user id on every "?", reads each column as a number
    private Map<String, Integer> run(String sql, int userId, int paramCount) throws SQLException {
        Map<String, Integer> stats = new LinkedHashMap<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            for (int i = 1; i <= paramCount; i++) stmt.setInt(i, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    for (int i = 1; i <= meta.getColumnCount(); i++) {
                        stats.put(meta.getColumnLabel(i), rs.getInt(i));
                    }
                }
            }
        }
        return stats;
    }
}