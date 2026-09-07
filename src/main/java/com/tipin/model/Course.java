package com.tipin.model;

public class Course 
{
    private int id;
    private String code;
    private String title;
    private int units;

    public Course() 
    {
    }

    public Course(int id, String code, String title, int units) 
    {
        this.id = id;
        this.code = code;
        this.title = title;
        this.units = units;
    }

    public int getId() 
    {
        return id;
    }

    public void setId(int id) 
    {
        this.id = id;
    }

    public String getCode() 
    {
        return code;
    }

    public void setCode(String code) 
    {
        this.code = code;
    }

    public String getTitle() 
    {
        return title;
    }

    public void setTitle(String title) 
    {
        this.title = title;
    }

    public int getUnits() 
    {
        return units;
    }

    public void setUnits(int units) 
    {
        this.units = units;
    }
}