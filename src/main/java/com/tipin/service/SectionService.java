package com.tipin.service;

import com.tipin.dao.SectionDAO;
import com.tipin.model.Section;
import java.util.List;

public class SectionService {
    public static List<Section> getAll() throws Exception {
        return new SectionDAO().findAll();
    }

    public static List<Section> getByProfessor(int professorId) throws Exception {
        return new SectionDAO().findByProfessor(professorId);
    }
}