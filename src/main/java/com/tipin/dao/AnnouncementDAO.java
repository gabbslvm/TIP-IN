package com.tipin.dao;

import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AnnouncementDAO {
    // Each row: {title, message}
    public List<String[]> findAll() throws SQLException {
        String sql = "SELECT id, title, message FROM announcements ORDER BY created_at DESC";
        List<String[]> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(new String[] { rs.getString("title"), rs.getString("message"), rs.getString("id") });
            }
        }
        return list;
    }

    public void insert(String title, String message) throws SQLException {
        String sql = "INSERT INTO announcements (title, message) VALUES (?, ?)";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, title);
            stmt.setString(2, message);
            stmt.executeUpdate();
        }
    }
}