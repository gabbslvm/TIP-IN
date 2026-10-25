package com.tipin.service;

import com.tipin.dao.SectionDAO;
import com.tipin.model.Section;
import org.json.JSONArray;

import java.util.List;

public class SectionService {

    public static List<Section> getAll() throws Exception {
        return new SectionDAO().findAll();
    }

    public static List<Section> getByProfessor(int professorId) throws Exception {
        return new SectionDAO().findByProfessor(professorId);
    }

    public static int createSection(
            int courseId,
            int professorId,
            int capacity,
            String sectionCode,
            JSONArray slots) throws Exception {
        return new SectionDAO().createSection(
                courseId,
                professorId,
                capacity,
                sectionCode,
                slots);
    }

    public static boolean updateSection(
            int sectionId,
            int professorId,
            int capacity,
            int enrollees,
            JSONArray slots) throws Exception {
        return new SectionDAO().updateSection(
                sectionId,
                professorId,
                capacity,
                enrollees,
                slots);
    }

    public static JSONArray getScheduleConflicts() throws Exception {
        return new SectionDAO().findScheduleConflicts();
    }

    public static boolean deleteSection(int sectionId) throws Exception {
        return new SectionDAO().deleteSection(sectionId);
    }

    public static List<Section> getByStudent(int studentId) throws Exception {
        return new SectionDAO().findByStudent(studentId);
    }
}