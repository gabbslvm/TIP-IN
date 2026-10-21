package com.tipin.service;

import com.tipin.dao.AnnouncementDAO;
import java.util.List;

public class AnnouncementService {
    public static List<String[]> getAll() throws Exception {
        return new AnnouncementDAO().findAll();
    }
}