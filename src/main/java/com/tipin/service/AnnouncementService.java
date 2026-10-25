package com.tipin.service;

import com.tipin.dao.AnnouncementDAO;
import java.util.List;

public class AnnouncementService {
    public static List<String[]> getAll() throws Exception {
        return new AnnouncementDAO().findAll();
    }

    public static void add(String title, String message) throws Exception {
        new AnnouncementDAO().insert(title, message);
    }
}