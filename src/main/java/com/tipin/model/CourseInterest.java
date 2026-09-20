package com.tipin.model;

import java.sql.Timestamp;

public class CourseInterest 
{
    private int id;
    private int studentId;
    private int courseId;
    private Timestamp dateSubmitted;

    public CourseInterest() 
    {
    }

    public CourseInterest(int id, int studentId, int courseId, Timestamp dateSubmitted) 
    {
        this.id = id;
        this.studentId = studentId;
        this.courseId = courseId;
        this.dateSubmitted = dateSubmitted;
    }

    public int getId() 
    {
        return id;
    }

    public void setId(int id) 
    {
        this.id = id;
    }

    public int getStudentId() 
    {
        return studentId;
    }

    public void setStudentId(int studentId) 
    {
        this.studentId = studentId;
    }

    public int getCourseId() 
    {
        return courseId;
    }

    public void setCourseId(int courseId) 
    {
        this.courseId = courseId;
    }

    public Timestamp getDateSubmitted() 
    {
        return dateSubmitted;
    }

    public void setDateSubmitted(Timestamp dateSubmitted) 
    {
        this.dateSubmitted = dateSubmitted;
    }
}