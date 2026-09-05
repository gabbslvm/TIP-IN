package com.tipin.util;

import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class JsonUtil {
    public static JSONObject parse(String jsonString) 
    {
        return new JSONObject(jsonString);
    }

    public static String toJson(JSONObject jsonObject) 
    {
        return jsonObject.toString();
    }

    public static String toJsonArray(List<?> items) 
    {
        JSONArray array = new JSONArray();
        for (int i = 0; i < items.size(); i++)
        {
            Object item = items.get(i);
            array.put(item);
        }
        return array.toString();
    }
}