package com.tipin.util;

import java.sql.*;

public class DBConnection {
    public static Connection get() throws SQLException {
        String url = "jdbc:mysql://localhost:3306/tip_in";
        return DriverManager.getConnection(url, "root", "");
    }
}