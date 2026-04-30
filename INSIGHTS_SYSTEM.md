# PlanSight AI — Insights System (Engine + UX)

---

# 🧠 SECTION 1: INSIGHTS ENGINE (PMP-ALIGNED)

## 🎯 Objective
Build a deterministic, programmatic insights engine that provides clear and actionable project health indicators based on PMP-aligned scheduling logic.

---

## 🧱 Core Concepts
- Early Start (ES)
- Early Finish (EF)
- Late Start (LS)
- Late Finish (LF)
- Total Float (Slack)
- Critical Path

---

## 🔥 1. Critical Path Computation (IMPORTANT CORRECTION)

### ⚠️ Rule:
Only compute using:
- Leaf tasks (lowest-level tasks)
- Milestone tasks

DO NOT include:
- Summary tasks

---

### Definition
The critical path is the longest chain of dependent leaf tasks that determines the project duration.

---

### Computation

Step 1: Filter Tasks  
Use only tasks where isSummary == false  

Step 2: Forward Pass  
ES = max(EF of predecessors)  
EF = ES + duration  

Step 3: Backward Pass  
LF = min(LS of successors)  
LS = LF - duration  

Step 4: Float  
Total Float = LS - ES  

Step 5: Critical Tasks  
If Total Float == 0 → Task is critical  

---

## ⏰ 2. Late Tasks
If current_date > planned_finish AND progress < 100% → Task is late  

---

## 🟡 3. At-Risk Tasks
If (planned_finish - current_date) ≤ threshold_days AND progress < 100% → Task is at risk  

---

## 🐢 4. Lagging Tasks
Expected Progress = (Current Date - Start Date) / (Finish Date - Start Date)  
If Actual Progress < Expected Progress → Task is lagging  

---

## 🔗 5. Dependency Bottlenecks
Count successors per task  
If high count → bottleneck  

---

## 🚦 6. Project Health (RAG STATUS)

GREEN  
- Late tasks ≤ 5%  
- No critical path delays  

AMBER  
- Late tasks 5–20%  
- OR lagging tasks > 10%  
- OR critical tasks at risk  

RED  
- Late tasks > 20%  
- OR any critical path task is late  

---

## 📊 7. Output Format
{
  "summary": {
    "totalTasks": number,
    "completedTasks": number,
    "lateTasks": number,
    "criticalTasks": number,
    "atRiskTasks": number,
    "healthStatus": "green | amber | red"
  },
  "insights": {
    "criticalPath": [],
    "lateTasks": [],
    "atRiskTasks": [],
    "laggingTasks": [],
    "bottlenecks": []
  }
}

---

# 🎨 SECTION 2: INSIGHTS UX

## 🧭 Tab Structure
- Imported Plan
- Project Insights (PRIMARY)
- AI Analysis

---

## 🔗 Stakeholder Sharing
Place at top-right of tab header  
Provide:
- Read-only link
- Copy button
- Open in new tab  

---

## 📌 Layout

### Project Health Banner
Display status and explanation prominently

---

### Summary Cards
- Late Tasks  
- At Risk  
- Critical Tasks  
- Completed  

---

### Key Insights
Bullet-style quick insights

---

### Scrollable Insight Cards
Each card:
- Fixed size
- Vertical scroll

Cards:
- Late Tasks  
- At Risk  
- Critical Path  
- Lagging Tasks  

---

## 🎯 Interaction
- Click → highlight in Gantt  
- Hover → show context  

---

## 🧠 AI Analysis Tab
- Summary  
- Risks  
- Recommendations  

---

## 🚀 Goal
Enable users to understand project health in under 10 seconds.
