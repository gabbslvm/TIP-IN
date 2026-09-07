package com.tipin;

import com.sun.net.httpserver.HttpServer;
import com.tipin.handler.CourseHandler;
import com.tipin.handler.AuthHandler;

import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/api/courses", new CourseHandler());
        server.createContext("/api/auth", new AuthHandler());
        // add one line per handler you have (sections, petitions, availability, recommendations)

        server.setExecutor(null);
        server.start();
        System.out.println("Server running on port 8080");
    }
}