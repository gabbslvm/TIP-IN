package com.tipin.dao;

import com.tipin.model.Section;
import com.tipin.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SectionDAO {
    // Shared SELECT: joins course info and professor name
    private static final String SELECT =
        "SELECT s.id, COALESCE(s.section_code, '') AS section_code, c.code, c.title, "
        + "COALESCE(u.name, 'TBA') AS professor_name, "
        + "COALESCE((SELECT string_agg(sc.day_of_week || ' ' || LEFT(sc.start_time::text, 5) "
        + "      || '-' || LEFT(sc.end_time::text, 5), ', ' ORDER BY sc.id) "
        + "    FROM schedules sc WHERE sc.section_id = s.id), 'TBA') AS schedule, "
        + "s.current_enrollees, s.capacity "
        + "FROM sections s "
        + "JOIN courses c ON c.id = s.course_id "
        + "LEFT JOIN users u ON u.id = s.professor_id ";

    // All sections (student view)
    public List<Section> findAll() throws SQLException {
        return query(SELECT + "ORDER BY c.code", null);
    }

    // Only one professor's sections (My Schedule)
    public List<Section> findByProfessor(int professorId) throws SQLException {
        return query(SELECT + "WHERE s.professor_id = ? ORDER BY c.code", professorId);
    }

    private List<Section> query(String sql, Integer professorId) throws SQLException {
        List<Section> list = new ArrayList<>();
        try (Connection conn = DBConnection.get();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (professorId != null) {
                stmt.setInt(1, professorId);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        }
        return list;
    }

    private Section map(ResultSet rs) throws SQLException {
        Section s = new Section();
        s.setId(rs.getInt("id"));
        s.setSectionCode(rs.getString("section_code"));
        s.setCourseCode(rs.getString("code"));
        s.setCourseTitle(rs.getString("title"));
        s.setProfessorName(rs.getString("professor_name"));
        s.setSchedule(rs.getString("schedule"));
        s.setCurrentEnrollees(rs.getInt("current_enrollees"));
        s.setCapacity(rs.getInt("capacity"));
        return s;
    }
}