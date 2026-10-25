package com.tipin.dao;

import com.tipin.util.DBConnection;
import java.sql.*;

public class EnrollmentDAO {

    public void enroll(int studentId, int sectionId) throws SQLException {
        try (Connection conn = DBConnection.get()) {
            conn.setAutoCommit(false);
            try {
                int courseId;
                try (PreparedStatement stmt = conn.prepareStatement(
                        "SELECT course_id, capacity, current_enrollees FROM sections WHERE id = ? FOR UPDATE")) {
                    stmt.setInt(1, sectionId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (!rs.next()) throw new SQLException("Section not found");
                        if (rs.getInt("current_enrollees") >= rs.getInt("capacity"))
                            throw new SQLException("This section is already full");
                        courseId = rs.getInt("course_id");
                    }
                }

                try (PreparedStatement stmt = conn.prepareStatement(
                        "SELECT 1 FROM enrollments e JOIN sections s ON s.id = e.section_id "
                        + "WHERE e.student_id = ? AND s.course_id = ?")) {
                    stmt.setInt(1, studentId);
                    stmt.setInt(2, courseId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) throw new SQLException("You already have a section of this course");
                    }
                }

                try (PreparedStatement stmt = conn.prepareStatement(
                        "SELECT 1 FROM schedules a JOIN schedules b ON a.day_of_week = b.day_of_week "
                        + "AND a.start_time < b.end_time AND b.start_time < a.end_time "
                        + "JOIN enrollments e ON e.section_id = b.section_id "
                        + "WHERE a.section_id = ? AND e.student_id = ? LIMIT 1")) {
                    stmt.setInt(1, sectionId);
                    stmt.setInt(2, studentId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) throw new SQLException("This section overlaps with one of your sections");
                    }
                }

                try (PreparedStatement stmt = conn.prepareStatement(
                        "INSERT INTO enrollments (student_id, section_id) VALUES (?, ?)")) {
                    stmt.setInt(1, studentId);
                    stmt.setInt(2, sectionId);
                    stmt.executeUpdate();
                }

                try (PreparedStatement stmt = conn.prepareStatement(
                        "UPDATE sections SET current_enrollees = current_enrollees + 1 WHERE id = ?")) {
                    stmt.setInt(1, sectionId);
                    stmt.executeUpdate();
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public boolean drop(int studentId, int sectionId) throws SQLException {
        try (Connection conn = DBConnection.get()) {
            conn.setAutoCommit(false);
            try {
                int removed;
                try (PreparedStatement stmt = conn.prepareStatement(
                        "DELETE FROM enrollments WHERE student_id = ? AND section_id = ?")) {
                    stmt.setInt(1, studentId);
                    stmt.setInt(2, sectionId);
                    removed = stmt.executeUpdate();
                }
                if (removed > 0) {
                    try (PreparedStatement stmt = conn.prepareStatement(
                            "UPDATE sections SET current_enrollees = GREATEST(current_enrollees - 1, 0) WHERE id = ?")) {
                        stmt.setInt(1, sectionId);
                        stmt.executeUpdate();
                    }
                }
                conn.commit();
                return removed > 0;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}