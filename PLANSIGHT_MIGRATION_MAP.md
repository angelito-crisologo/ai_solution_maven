# PlanSight AI Migration Map

This document translates the current `mpp_viewer` implementation into the PlanSight AI product defined in `PlanSightAI.md`.

## Product Goal

PlanSight AI is a plan ingestion, analysis, and sharing tool for project managers.

Primary workflow:
1. PM uploads a project plan.
2. PlanSight AI normalizes and analyzes the plan.
3. PM reviews the plan in an interactive workspace.
4. PM shares a read-only stakeholder link.

Future supported formats:
- `.mpp`
- `.xlsx`
- Smartsheet

## What To Keep

Keep the interaction model that already works:
- hierarchical task table
- Gantt chart
- expand/collapse tree behavior
- synchronized scrolling
- column resizing
- pane resizing
- daily / weekly / monthly timeline modes

These are the core UX primitives for the PlanSight workspace.

## What To Change

Rename the product language from file viewer terminology to plan workflow terminology:
- `Upload` becomes `Import plan`
- `Task` becomes `plan item`, `workstream`, or `milestone` depending on context
- `Sample projects` become `demo plans`
- `MPP backend` becomes `ingestion backend`
- `ParsedProject` becomes `Plan`

## File-by-File Mapping

### Frontend

#### `mpp_viewer/frontend/src/App.tsx`
Current role:
- drives the whole upload -> parse -> render flow
- manages task selection, split panes, and synchronized scrolling

PlanSight target:
- becomes the main PlanSight workspace shell
- loads a normalized plan instead of an MPP-specific payload
- adds AI summary, risk notes, and share controls
- adds stakeholder link state and read-only mode

#### `mpp_viewer/frontend/src/components/UploadPanel.tsx`
Current role:
- MPP upload
- sample project selection

PlanSight target:
- `ImportPanel`
- supports import from `.mpp` first
- later supports `.xlsx` and Smartsheet
- includes actions like `Import plan`, `Open demo plan`, and `Create empty plan`

#### `mpp_viewer/frontend/src/components/TaskTable.tsx`
Current role:
- hierarchical task table with resize and tree controls

PlanSight target:
- `PlanTable` or `WorkstreamTable`
- shows plan items, owners, dates, dependencies, status, and comments
- adds a `My Tasks` filter
- supports stakeholder-facing summaries later

#### `mpp_viewer/frontend/src/components/GanttChart.tsx`
Current role:
- schedule visualization with dependency paths and timeline modes

PlanSight target:
- `TimelineChart`
- keeps the current rendering logic
- adds AI markers for risk, slips, and milestone attention
- supports a stakeholder view that can hide low-level detail

#### `mpp_viewer/frontend/src/types/project.ts`
Current role:
- MPP-shaped parsed task/project schema

PlanSight target:
- replace with a normalized plan schema
- recommended core types:
  - `Plan`
  - `PlanItem`
  - `Dependency`
  - `Insight`
  - `ShareLink`
  - `ImportSource`

### Backend

#### `mpp_viewer/backend/src/index.ts`
Current role:
- Express API for health, samples, MPP parse, and sample parse

PlanSight target:
- ingestion and analysis API
- recommended endpoints:
  - `POST /api/import`
  - `POST /api/analyze`
  - `POST /api/share`
  - `GET /api/share/:id`
  - `GET /api/plans/:id`

#### `mpp_viewer/backend/src/parserClient.ts`
Current role:
- shells out to Java parser for MPP extraction

PlanSight target:
- one import adapter among several
- keep it as `adapters/mpp`
- later add:
  - `adapters/xlsx`
  - `adapters/smartsheet`

#### `mpp_viewer/backend/src/types.ts`
Current role:
- MPP parsed task/project types

PlanSight target:
- normalized product types shared by all import adapters

### Java Parser

#### `mpp_viewer/parser-java/src/main/java/com/mppview/parser/MppParserCli.java`
Current role:
- reads `.mpp` files with MPXJ
- returns normalized JSON

PlanSight target:
- keep only if MPP import remains a supported source
- otherwise retire this piece when native plan storage is introduced

## Architecture After Conversion

### Layer 1: Import
- Accept an uploaded file or source connector
- Convert the source into a normalized PlanSight plan
- First adapter: MPP

### Layer 2: Analysis
- Generate plan summary
- Detect risk and schedule issues
- Identify key tasks and milestones
- Build stakeholder-friendly language

### Layer 3: Presentation
- PM workspace with table + timeline
- read-only stakeholder link
- future comment or annotation layer

### Layer 4: Sharing
- create shareable links
- support access without login for stakeholders
- optionally add expiry and permissions later

## Data Model Direction

The current schema is task-centric. PlanSight should be plan-centric.

Current fields that still matter:
- `name`
- `start`
- `finish`
- `duration`
- `percentComplete`
- `summary`
- `milestone`
- `predecessors`
- `resourceNames`

New fields PlanSight will need:
- `planId`
- `title`
- `owner`
- `status`
- `priority`
- `risk`
- `confidence`
- `notes`
- `scenarioId`
- `shareId`
- `isVisibleToStakeholders`

## Recommended Build Order

1. Replace the MPP-specific data model with a PlanSight plan model.
2. Wrap MPP import as an adapter.
3. Add an AI summary endpoint.
4. Add a shareable read-only plan view.
5. Add a `My Tasks` filter.
6. Add XLSX import.
7. Add Smartsheet import.

## Product Boundary

PlanSight AI is not trying to become:
- a full project management system
- a task assignment system
- an editing-heavy MS Project clone

PlanSight AI is trying to become:
- a plan visibility tool
- an AI-enhanced plan analyzer
- a stakeholder sharing layer for project managers

## Practical Recommendation

The fastest credible conversion is:
- keep the current visualization engine
- rename the model to PlanSight
- add AI summary + share links first
- keep MPP import
- defer extra formats until the PlanSight core workflow is stable
