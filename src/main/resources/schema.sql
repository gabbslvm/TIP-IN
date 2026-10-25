CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  units INT NOT NULL
);

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id),
  professor_id INT REFERENCES users(id),
  capacity INT NOT NULL,
  current_enrollees INT NOT NULL DEFAULT 0,
  section_code VARCHAR(20)
);

CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (start_time < end_time)
);

CREATE TYPE petition_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE petitions (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  course_id INT REFERENCES courses(id),
  status petition_status NOT NULL DEFAULT 'PENDING',
  date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255),
  desired_section VARCHAR(100),
  details TEXT
);

CREATE TABLE professor_availability (
  id SERIAL PRIMARY KEY,
  professor_id INT REFERENCES users(id),
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id),
  generated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  suggested_action VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW'
);

CREATE TABLE course_interest (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  course_id INT REFERENCES courses(id),
  date_submitted TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_interest UNIQUE (student_id, course_id)
);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW schedule_conflicts AS
SELECT a.section_id AS section_id_1, b.section_id AS section_id_2,
      s1.professor_id, a.day_of_week,
      a.start_time AS start_1, a.end_time AS end_1,
      b.start_time AS start_2, b.end_time AS end_2
FROM schedules a
JOIN schedules b ON a.day_of_week = b.day_of_week AND a.id < b.id
  AND a.start_time < b.end_time AND b.start_time < a.end_time
JOIN sections s1 ON s1.id = a.section_id
JOIN sections s2 ON s2.id = b.section_id
WHERE s1.professor_id = s2.professor_id;

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id),
  section_id INT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  date_enrolled TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_enrollment UNIQUE (student_id, section_id)
);