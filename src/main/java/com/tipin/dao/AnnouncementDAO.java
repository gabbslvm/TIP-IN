package com.tipin.dao;

import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AnnouncementDAO {
    // Each row: {title, message}
    public List<String[]> findAll() throws SQLException {
        String sql = "SELECT title, message FROM announcements ORDER BY created_at DESC";
        List<String[]> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(new String[] { rs.getString("title"), rs.getString("message") });
            }
        }
        return list;
    }
}