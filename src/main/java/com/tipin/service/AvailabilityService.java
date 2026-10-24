package com.tipin.service;

import com.tipin.dao.AvailabilityDAO;
import com.tipin.model.ProfAvailability;
import java.util.List;

public class AvailabilityService {
    private static final List<String> DAYS =
            List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");

    public static List<ProfAvailability> get(int professorId) throws Exception {
        return new AvailabilityDAO().findByProfessor(professorId);
    }

    public static List<ProfAvailability> getAll() throws Exception {
        return new AvailabilityDAO().findAll();
    }

    public static void save(int professorId, List<ProfAvailability> slots) throws Exception {
        for (ProfAvailability s : slots) {
            if (!DAYS.contains(s.getDayOfWeek())) throw new Exception("Invalid day");
            if (s.getEndTime().compareTo(s.getStartTime()) <= 0)
                throw new Exception("End time must be later than start time");
        }
        new AvailabilityDAO().replaceAll(professorId, slots);
    }
}