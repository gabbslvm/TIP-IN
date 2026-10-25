package com.tipin.dao;

import com.tipin.model.User;
import com.tipin.util.DBConnection;
import java.sql.*;

public class SessionDAO {
    public static final int HOURS = 8;   // inactivity limit, same as the frontend

    // Saves a new session and cleans out expired ones
    public void create(String tokenHash, int userId) throws SQLException {
        try (Connection conn = DBConnection.get()) {
            try (PreparedStatement del = conn.prepareStatement("DELETE FROM sessions WHERE expires_at < NOW()")) {
                del.executeUpdate();
            }
            try (PreparedStatement stmt = conn.prepareStatement(
                    "INSERT INTO sessions (token_hash, user_id, expires_at) "
                    + "VALUES (?, ?, NOW() + (? * INTERVAL '1 hour'))")) {
                stmt.setString(1, tokenHash);
                stmt.setInt(2, userId);
                stmt.setInt(3, HOURS);
                stmt.executeUpdate();
            }
        }
    }

    // Returns the user for a live session and pushes its expiry forward; null if missing or expired
    public User findUser(String tokenHash) throws SQLException {
        String sql = "WITH s AS (UPDATE sessions SET expires_at = NOW() + (? * INTERVAL '1 hour') "
                + "WHERE token_hash = ? AND expires_at > NOW() RETURNING user_id) "
                + "SELECT u.id, u.name, u.email, u.role FROM users u JOIN s ON s.user_id = u.id";
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, HOURS);
            stmt.setString(2, tokenHash);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) return null;
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setName(rs.getString("name"));
                user.setEmail(rs.getString("email"));
                user.setRole(rs.getString("role"));
                return user;
            }
        }
    }

    public void delete(String tokenHash) throws SQLException {
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement("DELETE FROM sessions WHERE token_hash = ?")) {
            stmt.setString(1, tokenHash);
            stmt.executeUpdate();
        }
    }
}