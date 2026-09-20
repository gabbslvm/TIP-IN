package com.tipin.service;

import com.tipin.dao.CourseInterestDAO;
import com.tipin.model.CourseInterest;
import java.util.List;
import java.util.Collections;

public class CourseInterestService {
    public static void submitInterest(CourseInterest interest) {
        CourseInterestDAO dao = new CourseInterestDAO();
        try {
            dao.insertInterest(interest);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static List<Object[]> getDemandCounts() {
        CourseInterestDAO dao = new CourseInterestDAO();
        try {
            return dao.getDemandCounts();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}