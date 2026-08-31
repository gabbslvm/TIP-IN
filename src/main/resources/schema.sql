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
  schedule VARCHAR(100) NOT NULL
);

CREATE TYPE petition_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE petitions (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  course_id INT REFERENCES courses(id),
  status petition_status NOT NULL DEFAULT 'PENDING',
  date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  suggested_action VARCHAR(255) NOT NULL
);