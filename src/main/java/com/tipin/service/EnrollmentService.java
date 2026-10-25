package com.tipin.service;

import com.tipin.dao.EnrollmentDAO;

public class EnrollmentService {
    public static void enroll(int studentId, int sectionId) throws Exception {
        new EnrollmentDAO().enroll(studentId, sectionId);
    }

    public static boolean drop(int studentId, int sectionId) throws Exception {
        return new EnrollmentDAO().drop(studentId, sectionId);
    }
}