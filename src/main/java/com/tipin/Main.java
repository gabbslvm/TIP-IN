package com.tipin;

import com.sun.net.httpserver.HttpServer;
import com.tipin.handler.*;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/courses", new CourseHandler());
        server.createContext("/api/petitions", new PetitionHandler());
        server.createContext("/api/sections", new SectionHandler());
        server.createContext("/api/availability", new AvailabilityHandler());
        server.createContext("/api/recommendations", new RecommendationHandler());
        // server.createContext("/api/demand", new DemandHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Server running on port 8080");
    }
}