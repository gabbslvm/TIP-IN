package com.tipin.service;

import com.tipin.dao.PetitionDAO;
import com.tipin.model.Petition;
import java.util.List;

public class PetitionService {
    private static final List<String> STATUSES =
            List.of("PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED");

    public static void submit(Petition p) throws Exception {
        new PetitionDAO().insert(p);
    }

    public static List<Petition> getAll() throws Exception {
        return new PetitionDAO().findAll();
    }

    public static List<Petition> getByStudent(int studentId) throws Exception {
        return new PetitionDAO().findByStudent(studentId);
    }

    public static void updateStatus(int id, String status) throws Exception {
        if (!STATUSES.contains(status)) throw new Exception("Invalid status");
        if (new PetitionDAO().updateStatus(id, status) == 0)
            throw new Exception("Petition not found");
    }
}