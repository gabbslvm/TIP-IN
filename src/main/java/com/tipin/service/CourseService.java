package com.tipin.service;

import com.tipin.dao.CourseDAO;
import com.tipin.model.Course;
import java.util.List;
import java.util.Collections;

public class CourseService {
    public static List<Course> getAllCourses() {
        CourseDAO courseDAO = new CourseDAO();
        try {
            return courseDAO.getAllCourses();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public static void addCourse(Course course) throws Exception {
        new CourseDAO().insertCourse(course);
    }
}