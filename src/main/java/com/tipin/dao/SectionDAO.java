package com.tipin.dao;

import com.tipin.model.Section;
import com.tipin.model.SectionSlot;
import com.tipin.util.DBConnection;

import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SectionDAO {

    private static final String SELECT =
        "SELECT s.id, COALESCE(s.section_code, '') AS section_code, c.code, c.title, "
        + "COALESCE(u.name, 'TBA') AS professor_name, "
        + "COALESCE((SELECT string_agg(sc.day_of_week || ' ' || LEFT(sc.start_time::text, 5) "
        + "|| '-' || LEFT(sc.end_time::text, 5), ', ' ORDER BY sc.id) "
        + "FROM schedules sc WHERE sc.section_id = s.id), 'TBA') AS schedule, "
        + "s.current_enrollees, s.capacity "
        + "FROM sections s "
        + "JOIN courses c ON c.id = s.course_id "
        + "LEFT JOIN users u ON u.id = s.professor_id ";

    public List<Section> findAll() throws SQLException {
        return query(SELECT + "ORDER BY c.code", null);
    }

    public List<Section> findByProfessor(int professorId) throws SQLException {
        return query(
            SELECT + "WHERE s.professor_id = ? ORDER BY c.code",
            professorId
        );
    }

    private List<Section> query(String sql, Integer professorId)
            throws SQLException {

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

        loadSlots(list);
        return list;
    }

    private void loadSlots(List<Section> sections) throws SQLException {
        if (sections.isEmpty()) {
            return;
        }

        String placeholders = String.join(
            ",",
            java.util.Collections.nCopies(sections.size(), "?")
        );

        String sql =
            "SELECT section_id, day_of_week, "
            + "LEFT(start_time::text, 5) AS start_time, "
            + "LEFT(end_time::text, 5) AS end_time "
            + "FROM schedules "
            + "WHERE section_id IN (" + placeholders + ") "
            + "ORDER BY section_id, day_of_week, start_time";

        Map<Integer, List<SectionSlot>> slotsBySection = new HashMap<>();

        try (Connection conn = DBConnection.get();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < sections.size(); i++) {
                stmt.setInt(i + 1, sections.get(i).getId());
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int sectionId = rs.getInt("section_id");

                    SectionSlot slot = new SectionSlot();
                    slot.setDayOfWeek(rs.getString("day_of_week"));
                    slot.setStartTime(rs.getString("start_time"));
                    slot.setEndTime(rs.getString("end_time"));

                    slotsBySection
                        .computeIfAbsent(sectionId, key -> new ArrayList<>())
                        .add(slot);
                }
            }
        }

        for (Section section : sections) {
            section.setSlots(
                slotsBySection.getOrDefault(
                    section.getId(),
                    new ArrayList<>()
                )
            );
        }
    }

    public int createSection(
            int courseId,
            int professorId,
            int capacity,
            String sectionCode,
            JSONArray slots
    ) throws SQLException {

        String insertSection =
            "INSERT INTO sections "
            + "(course_id, professor_id, capacity, section_code, current_enrollees) "
            + "VALUES (?, ?, ?, ?, 0) RETURNING id";

        String insertSlot =
            "INSERT INTO schedules "
            + "(section_id, day_of_week, start_time, end_time) "
            + "VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.get()) {
            conn.setAutoCommit(false);

            try {
                int sectionId;

                try (PreparedStatement stmt =
                         conn.prepareStatement(insertSection)) {

                    stmt.setInt(1, courseId);
                    stmt.setInt(2, professorId);
                    stmt.setInt(3, capacity);
                    stmt.setString(4, sectionCode);

                    try (ResultSet rs = stmt.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Failed to create section");
                        }
                        sectionId = rs.getInt("id");
                    }
                }

                try (PreparedStatement stmt =
                         conn.prepareStatement(insertSlot)) {

                    for (int i = 0; i < slots.length(); i++) {
                        JSONObject slot = slots.getJSONObject(i);

                        stmt.setInt(1, sectionId);
                        stmt.setString(2, slot.getString("day_of_week"));
                        stmt.setString(3, slot.getString("start_time"));
                        stmt.setString(4, slot.getString("end_time"));
                        stmt.addBatch();
                    }

                    stmt.executeBatch();
                }

                conn.commit();
                return sectionId;

            } catch (Exception e) {
                conn.rollback();

                if (e instanceof SQLException) {
                    throw (SQLException) e;
                }

                throw new SQLException("Failed to create section", e);

            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public boolean updateSection(
            int sectionId,
            int professorId,
            int capacity,
            JSONArray slots
    ) throws SQLException {

        String updateSection =
            "UPDATE sections SET professor_id = ?, capacity = ? WHERE id = ?";

        String deleteSlots =
            "DELETE FROM schedules WHERE section_id = ?";

        String insertSlot =
            "INSERT INTO schedules "
            + "(section_id, day_of_week, start_time, end_time) "
            + "VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.get()) {
            conn.setAutoCommit(false);

            try {
                int updated;

                try (PreparedStatement stmt =
                         conn.prepareStatement(updateSection)) {

                    stmt.setInt(1, professorId);
                    stmt.setInt(2, capacity);
                    stmt.setInt(3, sectionId);
                    updated = stmt.executeUpdate();
                }

                if (updated == 0) {
                    conn.rollback();
                    return false;
                }

                try (PreparedStatement stmt =
                         conn.prepareStatement(deleteSlots)) {

                    stmt.setInt(1, sectionId);
                    stmt.executeUpdate();
                }

                try (PreparedStatement stmt =
                         conn.prepareStatement(insertSlot)) {

                    for (int i = 0; i < slots.length(); i++) {
                        JSONObject slot = slots.getJSONObject(i);

                        stmt.setInt(1, sectionId);
                        stmt.setString(2, slot.getString("day_of_week"));
                        stmt.setString(3, slot.getString("start_time"));
                        stmt.setString(4, slot.getString("end_time"));
                        stmt.addBatch();
                    }

                    stmt.executeBatch();
                }

                conn.commit();
                return true;

            } catch (Exception e) {
                conn.rollback();

                if (e instanceof SQLException) {
                    throw (SQLException) e;
                }

                throw new SQLException("Failed to update section", e);

            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public JSONArray findScheduleConflicts() throws SQLException {
        String sql = "SELECT * FROM schedule_conflicts";
        JSONArray conflicts = new JSONArray();

        try (Connection conn = DBConnection.get();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();

            while (rs.next()) {
                JSONObject conflict = new JSONObject();

                for (int i = 1; i <= columnCount; i++) {
                    Object value = rs.getObject(i);

                    conflict.put(
                        meta.getColumnLabel(i),
                        value == null ? JSONObject.NULL : value
                    );
                }

                conflicts.put(conflict);
            }
        }

        return conflicts;
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
