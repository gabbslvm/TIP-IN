package com.tipin.dao;

import com.tipin.model.Recommendation;
import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RecommendationDAO {

    // Demand, open petitions and capacity are calculated live, not stored
    public List<Recommendation> findAll() throws SQLException {
        String sql = "SELECT r.id, r.course_id, c.code, c.title, r.suggested_action, r.status, r.generated_date, "
                + "(SELECT COUNT(*) FROM course_interest ci WHERE ci.course_id = r.course_id) AS demand_count, "
                + "(SELECT COUNT(*) FROM petitions p WHERE p.course_id = r.course_id "
                + "   AND p.status IN ('PENDING','UNDER_REVIEW')) AS petition_count, "
                + "(SELECT COALESCE(SUM(s.capacity),0) FROM sections s WHERE s.course_id = r.course_id) AS capacity "
                + "FROM recommendations r JOIN courses c ON c.id = r.course_id "
                + "ORDER BY r.generated_date DESC";
        List<Recommendation> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Recommendation r = new Recommendation();
                r.setId(rs.getInt("id"));
                r.setCourseId(rs.getInt("course_id"));
                r.setCourseCode(rs.getString("code"));
                r.setCourseTitle(rs.getString("title"));
                r.setSuggestedAction(rs.getString("suggested_action"));
                r.setStatus(rs.getString("status"));
                r.setGeneratedDate(rs.getTimestamp("generated_date"));
                r.setDemandCount(rs.getInt("demand_count"));
                r.setPetitionCount(rs.getInt("petition_count"));
                r.setCapacity(rs.getInt("capacity"));
                list.add(r);
            }
        }
        return list;
    }

    // One row per course: {courseId, demand, openPetitions, capacity}
    public List<int[]> getCourseMetrics() throws SQLException {
        String sql = "SELECT c.id, "
                + "(SELECT COUNT(*) FROM course_interest ci WHERE ci.course_id = c.id) AS demand, "
                + "(SELECT COUNT(*) FROM petitions p WHERE p.course_id = c.id "
                + "   AND p.status IN ('PENDING','UNDER_REVIEW')) AS petitions, "
                + "(SELECT COALESCE(SUM(s.capacity),0) FROM sections s WHERE s.course_id = c.id) AS capacity "
                + "FROM courses c";
        List<int[]> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(new int[] { rs.getInt("id"), rs.getInt("demand"),
                        rs.getInt("petitions"), rs.getInt("capacity") });
            }
        }
        return list;
    }

    // Avoids creating the same recommendation again and again
    public boolean hasOpenRecommendation(int courseId) throws SQLException {
        String sql = "SELECT 1 FROM recommendations WHERE course_id = ? AND status <> 'REVIEWED'";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public int countProfessorsWithAvailability() throws SQLException {
        String sql = "SELECT COUNT(DISTINCT professor_id) FROM professor_availability";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    public void insert(int courseId, String action) throws SQLException {
        String sql = "INSERT INTO recommendations (course_id, suggested_action) VALUES (?, ?)";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, courseId);
            stmt.setString(2, action);
            stmt.executeUpdate();
        }
    }

    public int updateStatus(int id, String status) throws SQLException {
        String sql = "UPDATE recommendations SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setInt(2, id);
            return stmt.executeUpdate();
        }
    }
}