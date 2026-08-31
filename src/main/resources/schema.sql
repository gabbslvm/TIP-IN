CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL
);

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  units INT NOT NULL
);

CREATE TABLE sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT,
  professor_id INT,
  capacity INT NOT NULL,
  current_enrollees INT NOT NULL DEFAULT 0,
  schedule VARCHAR(100) NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (professor_id) REFERENCES users(id)
);

CREATE TABLE petitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  course_id INT,
  status ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE professor_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professor_id INT,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (professor_id) REFERENCES users(id)
);

CREATE TABLE recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT,
  generated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  suggested_action VARCHAR(255) NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);