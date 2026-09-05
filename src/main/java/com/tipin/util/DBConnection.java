package com.tipin.util;

import java.sql.*;

public class DBConnection 
{
    private static final String URL = "jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
    private static final String USER = "postgres.xymfvclwzrbhtvogpgiz";
    private static final String PASSWORD = System.getenv("DB_PASSWORD");
    public static Connection get() throws SQLException 
    {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}