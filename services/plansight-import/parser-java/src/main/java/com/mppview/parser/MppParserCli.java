package com.mppview.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.mpxj.ProjectFile;
import org.mpxj.Relation;
import org.mpxj.Resource;
import org.mpxj.ResourceAssignment;
import org.mpxj.Task;
import org.mpxj.reader.UniversalProjectReader;

public final class MppParserCli {
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private MppParserCli() {}

  public static void main(String[] args) throws Exception {
    if (args.length != 1) {
      System.err.println("Usage: java -jar mpp-parser-cli.jar <path-to-file.mpp>");
      System.exit(2);
      return;
    }

    File file = new File(args[0]);
    if (!file.exists()) {
      System.err.println("MPP file does not exist: " + file.getAbsolutePath());
      System.exit(2);
      return;
    }

    ProjectFile project = new UniversalProjectReader().read(file);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("projectName", emptyToNull(project.getProjectProperties().getProjectTitle()));
    result.put("startDate", dateToIso(project.getProjectProperties().getStartDate()));
    result.put("finishDate", dateToIso(project.getProjectProperties().getFinishDate()));
    result.put("tasks", parseTasks(project.getTasks()));

    System.out.println(OBJECT_MAPPER.writeValueAsString(result));
  }

  private static List<Map<String, Object>> parseTasks(List<Task> tasks) {
    List<Task> filtered = new ArrayList<>();
    for (Task task : tasks) {
      if (task != null && task.getID() != null) {
        filtered.add(task);
      }
    }

    filtered.sort(
        Comparator.comparing((Task t) -> normalizeSortKey(t.getOutlineNumber()))
            .thenComparingInt(t -> t.getID() == null ? Integer.MAX_VALUE : t.getID()));

    List<Map<String, Object>> output = new ArrayList<>();
    for (Task task : filtered) {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("id", task.getID());
      item.put("uniqueId", task.getUniqueID());
      item.put("parentId", task.getParentTask() != null ? task.getParentTask().getID() : null);
      item.put("name", emptyToNull(task.getName()));
      item.put("outlineLevel", task.getOutlineLevel() == null ? 1 : task.getOutlineLevel());
      item.put("outlineNumber", emptyToNull(task.getOutlineNumber()));
      item.put("wbs", emptyToNull(task.getWBS()));
      item.put("start", dateToIso(task.getStart()));
      item.put("finish", dateToIso(task.getFinish()));
      item.put("duration", task.getDuration() == null ? null : task.getDuration().toString());
      item.put("percentComplete", task.getPercentageComplete() == null ? null : task.getPercentageComplete().doubleValue());
      item.put("summary", task.getSummary());
      item.put("milestone", task.getMilestone());
      item.put("predecessors", parsePredecessors(task));
      item.put("resourceNames", parseResourceNames(task));
      item.put("notes", emptyToNull(task.getNotes()));
      output.add(item);
    }
    return output;
  }

  private static List<Map<String, Object>> parsePredecessors(Task task) {
    List<Map<String, Object>> predecessors = new ArrayList<>();
    if (task.getPredecessors() == null) {
      return predecessors;
    }

    for (Relation relation : task.getPredecessors()) {
      Map<String, Object> value = new LinkedHashMap<>();
      Integer predecessorId =
          relation.getPredecessorTask() != null && relation.getPredecessorTask().getID() != null
              ? relation.getPredecessorTask().getID()
              : null;
      value.put("predecessorTaskId", predecessorId);
      value.put("type", relation.getType() == null ? null : relation.getType().name());
      value.put("lag", relation.getLag() == null ? null : relation.getLag().toString());
      predecessors.add(value);
    }
    return predecessors;
  }

  private static List<String> parseResourceNames(Task task) {
    LinkedHashSet<String> names = new LinkedHashSet<>();
    if (task.getResourceAssignments() == null) {
      return new ArrayList<>();
    }

    for (ResourceAssignment assignment : task.getResourceAssignments()) {
      if (assignment == null) {
        continue;
      }

      Resource resource = assignment.getResource();
      String name = resource != null ? emptyToNull(resource.getName()) : null;
      if (name != null) {
        names.add(name);
      }
    }

    return new ArrayList<>(names);
  }

  private static String dateToIso(LocalDateTime date) {
    if (date == null) {
      return null;
    }
    return date.atZone(ZoneId.systemDefault()).toInstant().toString();
  }

  private static String emptyToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value;
  }

  private static String normalizeSortKey(String key) {
    return key == null ? "zzzz" : key;
  }
}
