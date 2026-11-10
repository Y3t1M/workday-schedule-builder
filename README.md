# Schedule Builder inside Workday Student

> **Student prototype, not the real Workday.** Made by the McMillon Innovation Studio Workday team at the
> University of Arkansas, Fall 2026. Every page carries a notice and a button to the Schedule Builder,
> and every name, class and number is sample data. Workday is a trademark of Workday, Inc.

A 1:1 recreation of the University of Arkansas Workday Student shell (measured from the live
tenant on 2026-11-03) with the McMillon x Workday **Schedule Builder** dropped in where it
would really live: Academics Hub → Planning and Registration.

Live: https://y3t1m.github.io/workday-schedule-builder/

## What it does

A student answers two short screens, sees the degree requirements they still owe, picks one of
three complete schedules built by a rules engine, and confirms. Nothing registers until the
student reviews the full week and confirms.

| Step | Route | What happens |
|---|---|---|
| 1. Start | `#start` | Registration appointment, credit hours completed / in progress / required, degree of study |
| 2. Availability | `#prefs` | Credit hours, days available (Mon to Fri), and a weekly grid you drag across to block times in half-hour cells. A toggle pulls the student's job hours from Workday Time Tracking |
| 3. Degree Requirements | `#needs` | Upcoming required courses and recommended second-year courses as worksheet-style tables, a course look-up (what it satisfies, its prerequisite, whether you can take it yet), and the full degree worksheet |
| 4. Schedules | `#options` | Three conflict-free options with what each one ruled out and why, a full-week calendar for each, and `#swap` to change one class while the rest stay put |
| 5. Review | `#review` | The chosen week on a calendar with the checks that passed. Register, send to advisor, or save. `#done` is the confirmation page |

`#errors` is a supporting screen that explains every ruled-out section in plain words.

## Run it

No build step and no server code. Open `index.html`, or run `python3 -m http.server` in this folder.

## Files

| File | What it is |
|---|---|
| `index.html` | Workday home clone (hero banner, quick-action chips, Awaiting Your Action, Timely Suggestions, Announcements) |
| `academics.html` | Academics Hub overview clone + the degree audit table (`#progress`) |
| `saved-schedules.html` | View My Saved Schedules clone; shows schedules the builder saves |
| `find-course-sections.html` | Find Course Sections clone, the search the builder replaces |
| `builder.html` | The Schedule Builder task page; one page, hash-routed per step |
| `mockups.html` | The builder screens in phone and laptop frames, live |
| `js/builder.js` | The builder's screens, state and interactions (step bar, drag-to-paint grid, course look-up, swap, review) |
| `js/engine.js` | Rules engine: filters sections, builds course sets to the credit target, places sections without conflicts, ranks, and explains each pick. Works with no AI |
| `js/shell.js` | Workday shell: top bar, left navigation, prototype notice |
| `js/hub.js` | Academics Hub side rail, collapsible |
| `js/icons.js` | Workday Canvas system icons (MIT) + a few lifted from the live DOM |
| `css/workday.css` | The shell, with the measured tokens at the top |
| `css/builder.css` | Builder-only styles |
| `data/sections.js` | Sample student, the Walton B.S.B.A. degree worksheet, and Spring 2027 sections |

## How schedules are built

1. Every section is checked against the student: prerequisite met, seats open, on an available day,
   no overlap with a blocked time or the work schedule. A rejected section keeps its reason.
2. Open requirements are combined into course sets that land on the credit-hour target.
3. One section per course is placed with no time conflicts.
4. Options are ranked: pathway courses first, then open seats, with a per-student tie-break so
   students with the same preferences are not all sent to the same section.
5. The best week is Recommended. The other two must differ by at least one course and say how.

If no week can reach the target, the page says so and suggests what to loosen. It never invents a course.

## URL flags

On `builder.html`: `?demo=1` preloads the recommended schedule so any step renders on its own;
`&ai=on` turns the AI-assist toggle on; `&swap=FINN%2020403-002` opens swap for that section.

## AI assist

Off by default and optional. It reads a plain-English sentence into the same form the controls
fill (`SB.parseSentence`, forgiving of misspellings) and writes longer explanations. The schedules
come from the rules engine either way, and it can only show sections that exist in the data.

## Privacy

The student ID, current classes, instructors and sections are made up. The advisor,
Blaise M. Simecek, is named with permission. No financial data appears anywhere. Reference captures
of the real tenant stay in a local, git-ignored `reference/` folder and are not part of this repo.
