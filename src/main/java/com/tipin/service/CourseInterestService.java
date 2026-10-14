package com.tipin.service;

import com.tipin.dao.CourseInterestDAO;
import com.tipin.model.CourseInterest;
import java.util.List;

public class CourseInterestService {
    // No try/catch here, so the handler can return the real error
    public static boolean submitInterest(CourseInterest interest) throws Exception {
        return new CourseInterestDAO().insertInterest(interest);
    }

    public static List<Object[]> getDemandCounts() throws Exception {
        return new CourseInterestDAO().getDemandCounts();
    }
}