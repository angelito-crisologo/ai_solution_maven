-- Migration 16: Canonical sample plan for the "Try a sample plan" hero CTA.
--
-- Inserts a permanent plan row with owner_type='sample'. The guest-TTL
-- cleanup query filters .eq("owner_type","guest") so this row is never
-- automatically deleted. The /api/plansight/sample route reads this row,
-- shifts all dates so the project started 28 days before today, then saves
-- a fresh guest copy (24h TTL) for each visitor who clicks the CTA.
--
-- Idempotent: ON CONFLICT DO NOTHING on both inserts.

INSERT INTO public.plans (
  share_id, title, source_format, imported_at,
  start_date, finish_date, owner_type, guest_id, expires_at
) VALUES (
  'plansight-sample-website-launch',
  'Website Launch Plan',
  'mpp',
  '2024-01-01T00:00:00Z',
  '2024-01-01',
  '2024-02-25',
  'sample',
  NULL,
  NULL
) ON CONFLICT (share_id) DO NOTHING;

-- 57 tasks. Dates are anchored to 2024-01-01 (Monday).
-- The sample route shifts every date so the project starts 28 days before
-- the current date, placing "today" at day 28 of the project.
--
-- At day 28 the plan is mid-flight:
--   • Phases 1–2 (Kickoff, Discovery) are complete.
--   • Phase 3 (Design) is mostly done but has several late tasks and a
--     blocked design-freeze milestone — the AI surfaces this as a risk.
--   • Phase 4 (Dev) and Phase 5 (Content) have just started, with
--     multiple tasks already behind expected progress.
--   • Phases 6–7 (Testing, Launch) have not started.

INSERT INTO public.plan_tasks (
  share_id, task_id, task_order,
  unique_id, parent_id,
  task_name, outline_level, outline_number, wbs,
  start_date, finish_date, duration,
  percent_complete, summary, milestone,
  predecessors, resource_names, notes
) VALUES

-- ── Root ───────────────────────────────────────────────────────────────────
('plansight-sample-website-launch', 1, 0,
 1, NULL,
 'Website Launch Plan', 1, '1', '1',
 '2024-01-01', '2024-02-25', '56 days',
 38, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

-- ── Phase 1: Kickoff ───────────────────────────────────────────────────────
('plansight-sample-website-launch', 2, 1,
 2, 1,
 'Phase 1 – Kickoff', 2, '1.1', '1.1',
 '2024-01-01', '2024-01-05', '5 days',
 100, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 3, 2,
 3, 2,
 'Project kickoff meeting', 3, '1.1.1', '1.1.1',
 '2024-01-01', '2024-01-01', '0 days',
 100, FALSE, TRUE,
 '[]'::jsonb, '{PM,Stakeholders}'::text[], NULL),

('plansight-sample-website-launch', 4, 3,
 4, 2,
 'Define project scope and objectives', 3, '1.1.2', '1.1.2',
 '2024-01-02', '2024-01-03', '2 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 3, "type": "FS", "lag": null}]'::jsonb,
 '{PM,BA}'::text[], NULL),

('plansight-sample-website-launch', 5, 4,
 5, 2,
 'Stakeholder alignment', 3, '1.1.3', '1.1.3',
 '2024-01-03', '2024-01-05', '3 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 4, "type": "FS", "lag": null}]'::jsonb,
 '{PM}'::text[], NULL),

('plansight-sample-website-launch', 6, 5,
 6, 2,
 'Kickoff complete', 3, '1.1.4', '1.1.4',
 '2024-01-05', '2024-01-05', '0 days',
 100, FALSE, TRUE,
 '[{"predecessorTaskId": 5, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 2: Discovery ─────────────────────────────────────────────────────
('plansight-sample-website-launch', 7, 6,
 7, 1,
 'Phase 2 – Discovery & Planning', 2, '1.2', '1.2',
 '2024-01-02', '2024-01-14', '13 days',
 100, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 8, 7,
 8, 7,
 'Requirements gathering', 3, '1.2.1', '1.2.1',
 '2024-01-02', '2024-01-07', '6 days',
 100, FALSE, FALSE,
 '[]'::jsonb, '{PM,BA}'::text[], NULL),

('plansight-sample-website-launch', 9, 8,
 9, 7,
 'Technical architecture review', 3, '1.2.2', '1.2.2',
 '2024-01-08', '2024-01-12', '5 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 8, "type": "FS", "lag": null}]'::jsonb,
 '{"Dev Lead"}'::text[], NULL),

('plansight-sample-website-launch', 10, 9,
 10, 7,
 'Site map and navigation plan', 3, '1.2.3', '1.2.3',
 '2024-01-08', '2024-01-12', '5 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 8, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

('plansight-sample-website-launch', 11, 10,
 11, 7,
 'Discovery complete', 3, '1.2.4', '1.2.4',
 '2024-01-14', '2024-01-14', '0 days',
 100, FALSE, TRUE,
 '[{"predecessorTaskId": 9, "type": "FS", "lag": null}, {"predecessorTaskId": 10, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 3: Design ────────────────────────────────────────────────────────
('plansight-sample-website-launch', 12, 11,
 12, 1,
 'Phase 3 – Design', 2, '1.3', '1.3',
 '2024-01-07', '2024-01-28', '22 days',
 65, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 13, 12,
 13, 12,
 'Wireframes', 3, '1.3.1', '1.3.1',
 '2024-01-07', '2024-01-17', '11 days',
 100, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 14, 13,
 14, 13,
 'Homepage wireframe', 4, '1.3.1.1', '1.3.1.1',
 '2024-01-07', '2024-01-10', '4 days',
 100, FALSE, FALSE,
 '[]'::jsonb, '{"UX Designer"}'::text[], NULL),

('plansight-sample-website-launch', 15, 14,
 15, 13,
 'Interior page wireframes', 4, '1.3.1.2', '1.3.1.2',
 '2024-01-11', '2024-01-14', '4 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 14, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

('plansight-sample-website-launch', 16, 15,
 16, 13,
 'Mobile responsive layouts', 4, '1.3.1.3', '1.3.1.3',
 '2024-01-14', '2024-01-17', '4 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 15, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

('plansight-sample-website-launch', 17, 16,
 17, 12,
 'Visual Design', 3, '1.3.2', '1.3.2',
 '2024-01-15', '2024-01-28', '14 days',
 55, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 18, 17,
 18, 17,
 'Brand guidelines review', 4, '1.3.2.1', '1.3.2.1',
 '2024-01-15', '2024-01-17', '3 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 16, "type": "FS", "lag": null}]'::jsonb,
 '{"Creative Dir"}'::text[], NULL),

('plansight-sample-website-launch', 19, 18,
 19, 17,
 'Homepage visual design', 4, '1.3.2.2', '1.3.2.2',
 '2024-01-17', '2024-01-21', '5 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 18, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

-- LATE: ends Jan 24 (4 days before simulated today = Jan 28), only 80% done
('plansight-sample-website-launch', 20, 19,
 20, 17,
 'Interior page designs', 4, '1.3.2.3', '1.3.2.3',
 '2024-01-18', '2024-01-24', '7 days',
 80, FALSE, FALSE,
 '[{"predecessorTaskId": 18, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

-- LATE: ends Jan 28 (simulated today), only 60% done
('plansight-sample-website-launch', 21, 20,
 21, 17,
 'Component library', 4, '1.3.2.4', '1.3.2.4',
 '2024-01-22', '2024-01-28', '7 days',
 60, FALSE, FALSE,
 '[{"predecessorTaskId": 19, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

-- BLOCKED: depends on tasks 20 and 21 which are incomplete
('plansight-sample-website-launch', 22, 21,
 22, 17,
 'Design review and approval', 4, '1.3.2.5', '1.3.2.5',
 '2024-01-27', '2024-01-28', '2 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 20, "type": "FS", "lag": null}, {"predecessorTaskId": 21, "type": "FS", "lag": null}]'::jsonb,
 '{PM,"Creative Dir"}'::text[], NULL),

-- TODAY milestone — blocked because review (task 22) is not complete
('plansight-sample-website-launch', 23, 22,
 23, 12,
 'Design freeze', 3, '1.3.3', '1.3.3',
 '2024-01-28', '2024-01-28', '0 days',
 0, FALSE, TRUE,
 '[{"predecessorTaskId": 22, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 4: Development ───────────────────────────────────────────────────
('plansight-sample-website-launch', 24, 23,
 24, 1,
 'Phase 4 – Development', 2, '1.4', '1.4',
 '2024-01-15', '2024-02-18', '35 days',
 28, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 25, 24,
 25, 24,
 'Environment Setup', 3, '1.4.1', '1.4.1',
 '2024-01-15', '2024-01-21', '7 days',
 100, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 26, 25,
 26, 25,
 'Dev environment configuration', 4, '1.4.1.1', '1.4.1.1',
 '2024-01-15', '2024-01-17', '3 days',
 100, FALSE, FALSE,
 '[]'::jsonb, '{"Dev Lead"}'::text[], NULL),

('plansight-sample-website-launch', 27, 26,
 27, 25,
 'Staging environment setup', 4, '1.4.1.2', '1.4.1.2',
 '2024-01-17', '2024-01-21', '5 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 26, "type": "FS", "lag": null}]'::jsonb,
 '{DevOps}'::text[], NULL),

('plansight-sample-website-launch', 28, 27,
 28, 25,
 'CI/CD pipeline', 4, '1.4.1.3', '1.4.1.3',
 '2024-01-17', '2024-01-21', '5 days',
 100, FALSE, FALSE,
 '[{"predecessorTaskId": 26, "type": "FS", "lag": null}]'::jsonb,
 '{DevOps}'::text[], NULL),

('plansight-sample-website-launch', 29, 28,
 29, 24,
 'Frontend Development', 3, '1.4.2', '1.4.2',
 '2024-01-22', '2024-02-18', '28 days',
 22, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

-- AT RISK: 30% done, should finish Feb 3 (6 days away), needs design freeze which is blocked
('plansight-sample-website-launch', 30, 29,
 30, 29,
 'Homepage build', 4, '1.4.2.1', '1.4.2.1',
 '2024-01-22', '2024-02-03', '13 days',
 30, FALSE, FALSE,
 '[{"predecessorTaskId": 27, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev"}'::text[], NULL),

-- LATE: ends Jan 28 (simulated today), only 40% done
('plansight-sample-website-launch', 31, 30,
 31, 29,
 'Navigation and header/footer', 4, '1.4.2.2', '1.4.2.2',
 '2024-01-22', '2024-01-28', '7 days',
 40, FALSE, FALSE,
 '[{"predecessorTaskId": 27, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 32, 31,
 32, 29,
 'Interior pages', 4, '1.4.2.3', '1.4.2.3',
 '2024-02-03', '2024-02-14', '12 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 23, "type": "FS", "lag": null}, {"predecessorTaskId": 30, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 33, 32,
 33, 29,
 'Mobile responsiveness', 4, '1.4.2.4', '1.4.2.4',
 '2024-02-10', '2024-02-18', '9 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 32, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 34, 33,
 34, 29,
 'Performance optimization', 4, '1.4.2.5', '1.4.2.5',
 '2024-02-14', '2024-02-18', '5 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 33, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 35, 34,
 35, 24,
 'Backend and CMS', 3, '1.4.3', '1.4.3',
 '2024-01-22', '2024-02-14', '24 days',
 20, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

-- LATE: ends Jan 28 (simulated today), only 50% done
('plansight-sample-website-launch', 36, 35,
 36, 35,
 'CMS setup and configuration', 4, '1.4.3.1', '1.4.3.1',
 '2024-01-22', '2024-01-28', '7 days',
 50, FALSE, FALSE,
 '[{"predecessorTaskId": 28, "type": "FS", "lag": null}]'::jsonb,
 '{"Backend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 37, 36,
 37, 35,
 'Content migration', 4, '1.4.3.2', '1.4.3.2',
 '2024-01-29', '2024-02-07', '10 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 36, "type": "FS", "lag": null}]'::jsonb,
 '{"Backend Dev",Content}'::text[], NULL),

('plansight-sample-website-launch', 38, 37,
 38, 35,
 'Forms and integrations', 4, '1.4.3.3', '1.4.3.3',
 '2024-02-07', '2024-02-14', '8 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 37, "type": "FS", "lag": null}]'::jsonb,
 '{"Backend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 39, 38,
 39, 24,
 'Development complete', 3, '1.4.4', '1.4.4',
 '2024-02-18', '2024-02-18', '0 days',
 0, FALSE, TRUE,
 '[{"predecessorTaskId": 34, "type": "FS", "lag": null}, {"predecessorTaskId": 38, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 5: Content ───────────────────────────────────────────────────────
('plansight-sample-website-launch', 40, 39,
 40, 1,
 'Phase 5 – Content', 2, '1.5', '1.5',
 '2024-01-07', '2024-02-14', '38 days',
 35, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 41, 40,
 41, 40,
 'Homepage copy', 3, '1.5.1', '1.5.1',
 '2024-01-07', '2024-01-14', '8 days',
 100, FALSE, FALSE,
 '[]'::jsonb, '{Content}'::text[], NULL),

-- LATE: ends Jan 28 (simulated today), only 50% done
('plansight-sample-website-launch', 42, 41,
 42, 40,
 'About and team pages', 3, '1.5.2', '1.5.2',
 '2024-01-22', '2024-01-28', '7 days',
 50, FALSE, FALSE,
 '[{"predecessorTaskId": 41, "type": "FS", "lag": null}]'::jsonb,
 '{Content}'::text[], NULL),

-- AT RISK: 20% done, due Feb 3 (6 days away), significantly behind
('plansight-sample-website-launch', 43, 42,
 43, 40,
 'Service and product pages', 3, '1.5.3', '1.5.3',
 '2024-01-22', '2024-02-03', '13 days',
 20, FALSE, FALSE,
 '[{"predecessorTaskId": 41, "type": "FS", "lag": null}]'::jsonb,
 '{Content}'::text[], NULL),

('plansight-sample-website-launch', 44, 43,
 44, 40,
 'Image sourcing and optimization', 3, '1.5.4', '1.5.4',
 '2024-01-29', '2024-02-07', '10 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 19, "type": "FS", "lag": null}]'::jsonb,
 '{"UX Designer"}'::text[], NULL),

('plansight-sample-website-launch', 45, 44,
 45, 40,
 'SEO metadata and tags', 3, '1.5.5', '1.5.5',
 '2024-02-07', '2024-02-14', '8 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 43, "type": "FS", "lag": null}, {"predecessorTaskId": 44, "type": "FS", "lag": null}]'::jsonb,
 '{SEO}'::text[], NULL),

('plansight-sample-website-launch', 46, 45,
 46, 40,
 'Content complete', 3, '1.5.6', '1.5.6',
 '2024-02-14', '2024-02-14', '0 days',
 0, FALSE, TRUE,
 '[{"predecessorTaskId": 45, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 6: Testing & QA ──────────────────────────────────────────────────
('plansight-sample-website-launch', 47, 46,
 47, 1,
 'Phase 6 – Testing and QA', 2, '1.6', '1.6',
 '2024-02-18', '2024-02-24', '7 days',
 0, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 48, 47,
 48, 47,
 'Browser cross-testing', 3, '1.6.1', '1.6.1',
 '2024-02-18', '2024-02-21', '4 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 39, "type": "FS", "lag": null}, {"predecessorTaskId": 46, "type": "FS", "lag": null}]'::jsonb,
 '{QA}'::text[], NULL),

('plansight-sample-website-launch', 49, 48,
 49, 47,
 'Accessibility audit', 3, '1.6.2', '1.6.2',
 '2024-02-19', '2024-02-21', '3 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 48, "type": "FS", "lag": null}]'::jsonb,
 '{QA}'::text[], NULL),

('plansight-sample-website-launch', 50, 49,
 50, 47,
 'Stakeholder review', 3, '1.6.3', '1.6.3',
 '2024-02-19', '2024-02-23', '5 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 48, "type": "FS", "lag": null}]'::jsonb,
 '{PM,Stakeholders}'::text[], NULL),

('plansight-sample-website-launch', 51, 50,
 51, 47,
 'Bug fixes', 3, '1.6.4', '1.6.4',
 '2024-02-21', '2024-02-24', '4 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 49, "type": "FS", "lag": null}, {"predecessorTaskId": 50, "type": "FS", "lag": null}]'::jsonb,
 '{"Frontend Dev","Backend Dev"}'::text[], NULL),

('plansight-sample-website-launch', 52, 51,
 52, 47,
 'QA sign-off', 3, '1.6.5', '1.6.5',
 '2024-02-24', '2024-02-24', '0 days',
 0, FALSE, TRUE,
 '[{"predecessorTaskId": 51, "type": "FS", "lag": null}]'::jsonb,
 '{}'::text[], NULL),

-- ── Phase 7: Launch ────────────────────────────────────────────────────────
('plansight-sample-website-launch', 53, 52,
 53, 1,
 'Phase 7 – Launch', 2, '1.7', '1.7',
 '2024-02-23', '2024-02-25', '3 days',
 0, TRUE, FALSE,
 '[]'::jsonb, '{}'::text[], NULL),

('plansight-sample-website-launch', 54, 53,
 54, 53,
 'DNS cutover and SSL verification', 3, '1.7.1', '1.7.1',
 '2024-02-23', '2024-02-24', '2 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 52, "type": "FS", "lag": null}]'::jsonb,
 '{DevOps}'::text[], NULL),

('plansight-sample-website-launch', 55, 54,
 55, 53,
 'Production deployment', 3, '1.7.2', '1.7.2',
 '2024-02-24', '2024-02-25', '2 days',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 54, "type": "FS", "lag": null}]'::jsonb,
 '{DevOps,"Dev Lead"}'::text[], NULL),

('plansight-sample-website-launch', 56, 55,
 56, 53,
 'Go-live smoke test', 3, '1.7.3', '1.7.3',
 '2024-02-25', '2024-02-25', '1 day',
 0, FALSE, FALSE,
 '[{"predecessorTaskId": 55, "type": "FS", "lag": null}]'::jsonb,
 '{QA,PM}'::text[], NULL),

('plansight-sample-website-launch', 57, 56,
 57, 53,
 'Website go-live', 3, '1.7.4', '1.7.4',
 '2024-02-25', '2024-02-25', '0 days',
 0, FALSE, TRUE,
 '[{"predecessorTaskId": 56, "type": "FS", "lag": null}]'::jsonb,
 '{PM,Stakeholders}'::text[], NULL)

ON CONFLICT (share_id, task_id) DO NOTHING;
