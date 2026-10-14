package com.tipin.service;

import com.tipin.dao.RecommendationDAO;
import com.tipin.model.Recommendation;
import java.util.List;

public class RecommendationService {
    private static final int PETITION_THRESHOLD = 5;  // "many petitions" for the same course
    private static final List<String> STATUSES = List.of("NEW", "FOR_REVIEW", "REVIEWED");

    // Checks every course and creates a recommendation if it needs review
    public static void generate() throws Exception {
        RecommendationDAO dao = new RecommendationDAO();
        int professors = dao.countProfessorsWithAvailability();

        for (int[] m : dao.getCourseMetrics()) {
            int courseId = m[0], demand = m[1], petitions = m[2], capacity = m[3];

            boolean highDemand = demand > capacity || petitions >= PETITION_THRESHOLD;
            if (highDemand && !dao.hasOpenRecommendation(courseId)) {
                String action = "High Demand Detected: consider opening an additional section. "
                    + (professors > 0
                        ? professors + " professor(s) have encoded availability."
                        : "No professor availability encoded yet.");
                dao.insert(courseId, action);
            }
        }
    }

    public static List<Recommendation> getAll() throws Exception {
        generate();                          // refresh before showing
        return new RecommendationDAO().findAll();
    }

    public static void updateStatus(int id, String status) throws Exception {
        if (!STATUSES.contains(status)) throw new Exception("Invalid status");
        if (new RecommendationDAO().updateStatus(id, status) == 0)
            throw new Exception("Recommendation not found");
    }
}