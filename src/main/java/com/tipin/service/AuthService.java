package com.tipin.service;

import com.tipin.dao.*;
import com.tipin.model.*;
import com.tipin.util.*;

public class AuthService {
    public static void register(User user) throws Exception {
        user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
        new UserDAO().insertUser(user);
    }

    public static User login(String email, String password) {
        UserDAO userDAO = new UserDAO();
        try {
            User user = userDAO.findByEmail(email);
            if (user != null && PasswordUtil.checkPassword(password, user.getPassword())) {
                return user;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}