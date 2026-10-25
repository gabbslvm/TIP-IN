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

    // Creates a session row and returns the token the client must send back
    public static String startSession(User user) throws Exception {
        String token = TokenUtil.newToken();
        new SessionDAO().create(TokenUtil.hash(token), user.getId());
        return token;
    }

    // The logged-in user for this token, or null if it is unknown or expired
    public static User authenticate(String token) throws Exception {
        return new SessionDAO().findUser(TokenUtil.hash(token));
    }

    public static void endSession(String token) throws Exception {
        new SessionDAO().delete(TokenUtil.hash(token));
    }

    public static void changePassword(int userId, String current, String next) throws Exception {
        UserDAO dao = new UserDAO();
        User user = dao.findById(userId);
        if (user == null || !PasswordUtil.checkPassword(current, user.getPassword())) {
            throw new Exception("Current password is incorrect");
        }
        dao.updatePassword(userId, PasswordUtil.hashPassword(next));
    }
}