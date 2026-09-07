package com.tipin.dao;

import com.tipin.model.Course;
import com.tipin.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO 
{
    public void insertCourse(Course course) throws SQLException 
    {
        String sql = "INSERT INTO courses (code, title, units) VALUES (?, ?, ?)";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);

        stmt.setString(1, course.getCode());
        stmt.setString(2, course.getTitle());
        stmt.setInt(3, course.getUnits());

        stmt.executeUpdate();

        stmt.close();
        conn.close();
    }

    public List<Course> getAllCourses() throws SQLException 
    {
        String sql = "SELECT * FROM courses";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);
        ResultSet rs = stmt.executeQuery();

        List<Course> courses = new ArrayList<Course>();

        while (rs.next()) 
        {
            Course course = new Course();
            course.setId(rs.getInt("id"));
            course.setCode(rs.getString("code"));
            course.setTitle(rs.getString("title"));
            course.setUnits(rs.getInt("units"));

            courses.add(course);
        }

        rs.close();
        stmt.close();
        conn.close();

        return courses;
    }

    public Course findById(int id) throws SQLException 
    {
        String sql = "SELECT * FROM courses WHERE id = ?";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);
        stmt.setInt(1, id);

        ResultSet rs = stmt.executeQuery();

        Course course = null;

        if (rs.next()) 
        {
            course = new Course();
            course.setId(rs.getInt("id"));
            course.setCode(rs.getString("code"));
            course.setTitle(rs.getString("title"));
            course.setUnits(rs.getInt("units"));
        }

        rs.close();
        stmt.close();
        conn.close();

        return course;
    }
}