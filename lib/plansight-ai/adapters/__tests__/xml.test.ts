import { describe, it, expect } from "vitest";
import { parseMppXml } from "../xml";

// Minimal but realistic MS Project XML covering:
//  - Project summary task exclusion (UID=0 / ID=0)
//  - Two-level WBS hierarchy (summary + leaf tasks)
//  - Milestone task
//  - Finish-to-Start predecessor (UID resolved to ID)
//  - Resource assignment join
//  - DateTime → date-only normalization
//  - UTF-8 BOM stripping
const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Title>Website Redesign</Title>
  <StartDate>2024-01-15T08:00:00</StartDate>
  <FinishDate>2024-03-29T17:00:00</FinishDate>
  <Tasks>
    <Task>
      <UID>0</UID><ID>0</ID>
      <Name>Website Redesign</Name>
      <OutlineLevel>0</OutlineLevel><WBS>0</WBS>
      <Summary>1</Summary><Milestone>0</Milestone>
      <PercentComplete>0</PercentComplete>
      <Start>2024-01-15T08:00:00</Start>
      <Finish>2024-03-29T17:00:00</Finish>
      <Duration>PT560H0M0S</Duration>
    </Task>
    <Task>
      <UID>1</UID><ID>1</ID>
      <Name>Discovery</Name>
      <OutlineLevel>1</OutlineLevel>
      <OutlineNumber>1</OutlineNumber>
      <WBS>1</WBS>
      <Summary>1</Summary><Milestone>0</Milestone>
      <PercentComplete>100</PercentComplete>
      <Start>2024-01-15T08:00:00</Start>
      <Finish>2024-01-26T17:00:00</Finish>
      <Duration>PT80H0M0S</Duration>
    </Task>
    <Task>
      <UID>2</UID><ID>2</ID>
      <Name>Stakeholder interviews</Name>
      <OutlineLevel>2</OutlineLevel>
      <OutlineNumber>1.1</OutlineNumber>
      <WBS>1.1</WBS>
      <Summary>0</Summary><Milestone>0</Milestone>
      <PercentComplete>100</PercentComplete>
      <Start>2024-01-15T08:00:00</Start>
      <Finish>2024-01-19T17:00:00</Finish>
      <Duration>PT40H0M0S</Duration>
    </Task>
    <Task>
      <UID>3</UID><ID>3</ID>
      <Name>Requirements doc</Name>
      <OutlineLevel>2</OutlineLevel>
      <OutlineNumber>1.2</OutlineNumber>
      <WBS>1.2</WBS>
      <Summary>0</Summary><Milestone>0</Milestone>
      <PercentComplete>100</PercentComplete>
      <Start>2024-01-22T08:00:00</Start>
      <Finish>2024-01-26T17:00:00</Finish>
      <Duration>PT40H0M0S</Duration>
      <PredecessorLink>
        <PredecessorUID>2</PredecessorUID>
        <Type>1</Type>
        <Lag>PT0H0M0S</Lag>
      </PredecessorLink>
    </Task>
    <Task>
      <UID>4</UID><ID>4</ID>
      <Name>Discovery complete</Name>
      <OutlineLevel>2</OutlineLevel>
      <OutlineNumber>1.3</OutlineNumber>
      <WBS>1.3</WBS>
      <Summary>0</Summary><Milestone>1</Milestone>
      <PercentComplete>100</PercentComplete>
      <Start>2024-01-26T17:00:00</Start>
      <Finish>2024-01-26T17:00:00</Finish>
      <Duration>PT0H0M0S</Duration>
      <PredecessorLink>
        <PredecessorUID>3</PredecessorUID>
        <Type>1</Type>
        <Lag>PT0H0M0S</Lag>
      </PredecessorLink>
    </Task>
    <Task>
      <UID>5</UID><ID>5</ID>
      <Name>Design</Name>
      <OutlineLevel>1</OutlineLevel>
      <OutlineNumber>2</OutlineNumber>
      <WBS>2</WBS>
      <Summary>1</Summary><Milestone>0</Milestone>
      <PercentComplete>30</PercentComplete>
      <Start>2024-01-29T08:00:00</Start>
      <Finish>2024-02-23T17:00:00</Finish>
      <Duration>PT200H0M0S</Duration>
      <PredecessorLink>
        <PredecessorUID>4</PredecessorUID>
        <Type>1</Type>
        <Lag>PT0H0M0S</Lag>
      </PredecessorLink>
    </Task>
    <Task>
      <UID>6</UID><ID>6</ID>
      <Name>Wireframes</Name>
      <OutlineLevel>2</OutlineLevel>
      <OutlineNumber>2.1</OutlineNumber>
      <WBS>2.1</WBS>
      <Summary>0</Summary><Milestone>0</Milestone>
      <PercentComplete>60</PercentComplete>
      <Start>2024-01-29T08:00:00</Start>
      <Finish>2024-02-09T17:00:00</Finish>
      <Duration>PT96H0M0S</Duration>
    </Task>
  </Tasks>
  <Resources>
    <Resource><UID>0</UID><ID>0</ID><Name></Name></Resource>
    <Resource><UID>1</UID><ID>1</ID><Name>Alice PM</Name></Resource>
    <Resource><UID>2</UID><ID>2</ID><Name>Bob Designer</Name></Resource>
  </Resources>
  <Assignments>
    <Assignment><UID>1</UID><TaskUID>2</TaskUID><ResourceUID>1</ResourceUID></Assignment>
    <Assignment><UID>2</UID><TaskUID>3</TaskUID><ResourceUID>1</ResourceUID></Assignment>
    <Assignment><UID>3</UID><TaskUID>6</TaskUID><ResourceUID>2</ResourceUID></Assignment>
  </Assignments>
</Project>`;

describe("parseMppXml", () => {
  it("extracts project metadata", () => {
    const result = parseMppXml(FIXTURE_XML);
    expect(result.projectName).toBe("Website Redesign");
    expect(result.startDate).toBe("2024-01-15");
    expect(result.finishDate).toBe("2024-03-29");
  });

  it("excludes the project summary task (UID=0 / ID=0)", () => {
    const result = parseMppXml(FIXTURE_XML);
    expect(result.tasks.find((t) => t.id === 0)).toBeUndefined();
    expect(result.tasks.length).toBe(6);
  });

  it("normalises datetime strings to date-only", () => {
    const result = parseMppXml(FIXTURE_XML);
    const task = result.tasks.find((t) => t.id === 2)!;
    expect(task.start).toBe("2024-01-15");
    expect(task.finish).toBe("2024-01-19");
  });

  it("sets summary and milestone flags", () => {
    const result = parseMppXml(FIXTURE_XML);
    expect(result.tasks.find((t) => t.id === 1)?.summary).toBe(true);
    expect(result.tasks.find((t) => t.id === 2)?.summary).toBe(false);
    expect(result.tasks.find((t) => t.id === 4)?.milestone).toBe(true);
    expect(result.tasks.find((t) => t.id === 2)?.milestone).toBe(false);
  });

  it("reconstructs parent IDs from outline levels", () => {
    const result = parseMppXml(FIXTURE_XML);
    // Tasks 2, 3, 4 are children of task 1 (outline level 2 under level 1)
    expect(result.tasks.find((t) => t.id === 2)?.parentId).toBe(1);
    expect(result.tasks.find((t) => t.id === 3)?.parentId).toBe(1);
    expect(result.tasks.find((t) => t.id === 4)?.parentId).toBe(1);
    // Task 6 is a child of task 5
    expect(result.tasks.find((t) => t.id === 6)?.parentId).toBe(5);
    // Top-level tasks have no parent
    expect(result.tasks.find((t) => t.id === 1)?.parentId).toBeNull();
    expect(result.tasks.find((t) => t.id === 5)?.parentId).toBeNull();
  });

  it("resolves predecessor UIDs to task IDs with correct type", () => {
    const result = parseMppXml(FIXTURE_XML);
    // Task 3 has predecessor UID=2 → task ID 2, type FS
    const task3 = result.tasks.find((t) => t.id === 3)!;
    expect(task3.predecessors).toHaveLength(1);
    expect(task3.predecessors[0].predecessorTaskId).toBe(2);
    expect(task3.predecessors[0].type).toBe("FS");
    // Task 5 has predecessor UID=4 → task ID 4
    const task5 = result.tasks.find((t) => t.id === 5)!;
    expect(task5.predecessors[0].predecessorTaskId).toBe(4);
  });

  it("joins resource names from Assignments table", () => {
    const result = parseMppXml(FIXTURE_XML);
    expect(result.tasks.find((t) => t.id === 2)?.resourceNames).toEqual(["Alice PM"]);
    expect(result.tasks.find((t) => t.id === 3)?.resourceNames).toEqual(["Alice PM"]);
    expect(result.tasks.find((t) => t.id === 6)?.resourceNames).toEqual(["Bob Designer"]);
    // Unassigned tasks have an empty array
    expect(result.tasks.find((t) => t.id === 1)?.resourceNames).toEqual([]);
  });

  it("carries outline number and WBS through", () => {
    const result = parseMppXml(FIXTURE_XML);
    const task3 = result.tasks.find((t) => t.id === 3)!;
    expect(task3.outlineNumber).toBe("1.2");
    expect(task3.wbs).toBe("1.2");
  });

  it("strips a UTF-8 BOM before parsing", () => {
    const bomXml = "﻿" + FIXTURE_XML;
    const result = parseMppXml(bomXml);
    expect(result.projectName).toBe("Website Redesign");
    expect(result.tasks.length).toBe(6);
  });

  it("throws a descriptive error on missing <Project> root", () => {
    expect(() => parseMppXml("<Foo><Bar/></Foo>")).toThrow(
      /missing <Project> root element/
    );
  });

  it("throws on malformed XML", () => {
    expect(() => parseMppXml("not xml at all <<<")).toThrow();
  });
});
