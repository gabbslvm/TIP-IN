package com.tipin;

import com.sun.net.httpserver.HttpServer;
import com.tipin.handler.*;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/courses", new CourseHandler());
        server.createContext("/api/petitions", new PetitionHandler());
        server.createContext("/api/sections", new SectionHandler());
        server.createContext("/api/availability", new AvailabilityHandler());
        server.createContext("/api/recommendations", new RecommendationHandler());
        server.createContext("/api/demand", new CourseInterestHandler());
        server.createContext("/api/dashboard", new DashboardHandler());
        server.createContext("/api/announcements", new AnnouncementHandler());
        server.createContext("/api/conflicts", new SectionHandler());
        server.createContext("/api/professors", new ProfessorHandler());
        server.createContext("/api/enrollments", new EnrollmentHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Server running on port " + port);
    }
}