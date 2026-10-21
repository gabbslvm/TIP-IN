package com.tipin.dao;

import com.tipin.model.ProfAvailability;
import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AvailabilityDAO {

    public List<ProfAvailability> findByProfessor(int professorId) throws SQLException {
        String sql = "SELECT id, professor_id, day_of_week, start_time, end_time "
                + "FROM professor_availability WHERE professor_id = ? ORDER BY id";
        List<ProfAvailability> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, professorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ProfAvailability a = new ProfAvailability();
                    a.setId(rs.getInt("id"));
                    a.setProfessorId(rs.getInt("professor_id"));
                    a.setDayOfWeek(rs.getString("day_of_week"));
                    a.setStartTime(rs.getString("start_time"));
                    a.setEndTime(rs.getString("end_time"));
                    list.add(a);
                }
            }
        }
        return list;
    }

    // Delete old slots, insert new ones. One transaction: all or nothing.
    public void replaceAll(int professorId, List<ProfAvailability> slots) throws SQLException {
        try (Connection conn = DBConnection.get()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement del = conn.prepareStatement(
                        "DELETE FROM professor_availability WHERE professor_id = ?")) {
                    del.setInt(1, professorId);
                    del.executeUpdate();
                }
                try (PreparedStatement ins = conn.prepareStatement(
                        "INSERT INTO professor_availability (professor_id, day_of_week, start_time, end_time) "
                        + "VALUES (?, ?, ?::time, ?::time)")) {
                    for (ProfAvailability s : slots) {
                        ins.setInt(1, professorId);
                        ins.setString(2, s.getDayOfWeek());
                        ins.setString(3, s.getStartTime());
                        ins.setString(4, s.getEndTime());
                        ins.addBatch();
                    }
                    ins.executeBatch();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }
}