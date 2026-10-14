package com.tipin.dao;

import com.tipin.model.CourseInterest;
import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CourseInterestDAO {

    // Returns false if the student already marked this course (ON CONFLICT skips
    // the insert)
    public boolean insertInterest(CourseInterest interest) throws SQLException {
        String sql = "INSERT INTO course_interest (student_id, course_id) VALUES (?, ?) "
                + "ON CONFLICT (student_id, course_id) DO NOTHING";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, interest.getStudentId());
            stmt.setInt(2, interest.getCourseId());
            return stmt.executeUpdate() > 0;
        }
    }

    // Demand per course; LEFT JOIN keeps courses with 0 interest
    public List<Object[]> getDemandCounts() throws SQLException {
        String sql = "SELECT c.id, c.code, c.title, COUNT(ci.id) AS demand_count "
                + "FROM courses c LEFT JOIN course_interest ci ON ci.course_id = c.id "
                + "GROUP BY c.id, c.code, c.title ORDER BY demand_count DESC";
        List<Object[]> results = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                results.add(new Object[] { rs.getInt("id"), rs.getString("code"),
                        rs.getString("title"), rs.getInt("demand_count") });
            }
        }
        return results;
    }
}