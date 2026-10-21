package com.tipin.dao;

import com.tipin.model.Petition;
import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PetitionDAO {
    // Shared SELECT: joins student name and course info
    private static final String SELECT =
            "SELECT p.id, p.student_id, u.name AS student_name, p.course_id, c.code, c.title, "
            + "p.reason, p.desired_section, p.details, p.status::text AS status, p.date_submitted "
            + "FROM petitions p JOIN users u ON u.id = p.student_id "
            + "JOIN courses c ON c.id = p.course_id ";

    public void insert(Petition p) throws SQLException {
        String sql = "INSERT INTO petitions (student_id, course_id, reason, desired_section, details) "
                + "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, p.getStudentId());
            stmt.setInt(2, p.getCourseId());
            stmt.setString(3, p.getReason());
            stmt.setString(4, p.getDesiredSection());
            stmt.setString(5, p.getDetails());
            stmt.executeUpdate();
        }
    }

    // Coordinator view: every petition
    public List<Petition> findAll() throws SQLException {
        return query(SELECT + "ORDER BY p.date_submitted DESC", null);
    }

    // Student view: only their own petitions
    public List<Petition> findByStudent(int studentId) throws SQLException {
        return query(SELECT + "WHERE p.student_id = ? ORDER BY p.date_submitted DESC", studentId);
    }

    public int updateStatus(int id, String status) throws SQLException {
        String sql = "UPDATE petitions SET status = ?::petition_status WHERE id = ?";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setInt(2, id);
            return stmt.executeUpdate();
        }
    }

    private List<Petition> query(String sql, Integer studentId) throws SQLException {
        List<Petition> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (studentId != null) stmt.setInt(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) list.add(map(rs));
            }
        }
        return list;
    }

    private Petition map(ResultSet rs) throws SQLException {
        Petition p = new Petition();
        p.setId(rs.getInt("id"));
        p.setStudentId(rs.getInt("student_id"));
        p.setStudentName(rs.getString("student_name"));
        p.setCourseId(rs.getInt("course_id"));
        p.setCourseCode(rs.getString("code"));
        p.setCourseTitle(rs.getString("title"));
        p.setReason(rs.getString("reason"));
        p.setDesiredSection(rs.getString("desired_section"));
        p.setDetails(rs.getString("details"));
        p.setStatus(rs.getString("status"));
        p.setDateSubmitted(rs.getTimestamp("date_submitted"));
        return p;
    }
}