package com.tipin.dao;

import com.tipin.model.User;
import com.tipin.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserDAO 
{
    public void insertUser(User user) throws SQLException 
    {
        String sql = "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);

        stmt.setString(1, user.getName());
        stmt.setString(2, user.getEmail());
        stmt.setString(3, user.getPassword());
        stmt.setString(4, user.getRole());

        stmt.executeUpdate();

        stmt.close();
        conn.close();
    }

    public User findByEmail(String email) throws SQLException 
    {
        String sql = "SELECT * FROM users WHERE email = ?";

        Connection conn = DBConnection.get();
        PreparedStatement stmt = conn.prepareStatement(sql);
        stmt.setString(1, email);

        ResultSet rs = stmt.executeQuery();

        User user = null;

        if (rs.next()) 
        {
            user = new User();
            user.setId(rs.getInt("id"));
            user.setName(rs.getString("name"));
            user.setEmail(rs.getString("email"));
            user.setPassword(rs.getString("password_hash"));
            user.setRole(rs.getString("role"));
        }

        rs.close();
        stmt.close();
        conn.close();

        return user;
    }
}