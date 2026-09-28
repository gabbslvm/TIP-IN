package com.tipin.dao;

import com.tipin.model.Course;
import com.tipin.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO {

    public void insertCourse(Course course) throws SQLException {
        String sql = "INSERT INTO courses (code, title, units) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.get();
            PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, course.getCode());
            stmt.setString(2, course.getTitle());
            stmt.setInt(3, course.getUnits());
            stmt.executeUpdate();
        }
    }

    public List<Course> getAllCourses() throws SQLException {
        String sql = "SELECT * FROM courses ORDER BY code";
        List<Course> courses = new ArrayList<>();
        try (Connection conn = DBConnection.get();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                courses.add(map(rs));
            }
        }
        return courses;
    }

    public Course findById(int id) throws SQLException {
        String sql = "SELECT * FROM courses WHERE id = ?";
        try (Connection conn = DBConnection.get();
            PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        }
        return null;
    }

    private Course map(ResultSet rs) throws SQLException {
        Course course = new Course();
        course.setId(rs.getInt("id"));
        course.setCode(rs.getString("code"));
        course.setTitle(rs.getString("title"));
        course.setUnits(rs.getInt("units"));
        return course;
    }
}