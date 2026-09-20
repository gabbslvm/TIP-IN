package com.tipin.dao;

import com.tipin.model.CourseInterest;
import com.tipin.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseInterestDAO 
{
    public void insertInterest(CourseInterest interest) throws SQLException 
    {
        String sql = "INSERT INTO course_interest (student_id, course_id) VALUES (?, ?)";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);

        stmt.setInt(1, interest.getStudentId());
        stmt.setInt(2, interest.getCourseId());

        stmt.executeUpdate();

        stmt.close();
        conn.close();
    }

    public List<Object[]> getDemandCounts() throws SQLException 
    {
        String sql = "SELECT course_id, COUNT(*) FROM course_interest GROUP BY course_id";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);
        ResultSet rs = stmt.executeQuery();

        List<Object[]> results = new ArrayList<>();

        while (rs.next()) 
        {
            results.add(new Object[]{ rs.getInt("course_id"), rs.getInt("count") });
        }

        rs.close();
        stmt.close();
        conn.close();

        return results;
    }
}