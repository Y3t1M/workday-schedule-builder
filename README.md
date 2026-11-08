# Schedule Builder inside Workday Student

> **Student prototype, not the real Workday.** Made by the McMillon Innovation Studio Workday team at the
> University of Arkansas, Fall 2026. Every page carries a notice and a button to the Schedule Builder,
> and every name, class and number is sample data. Workday is a trademark of Workday, Inc.

A 1:1 recreation of the University of Arkansas Workday Student shell (measured from the live
tenant on 2026-11-03) with the McMillon x Workday **Schedule Builder** dropped in where it
would really live: Academics Hub → Planning and Registration.

Live: https://y3t1m.github.io/workday-schedule-builder/

No build step. Open `index.html` or run `python3 -m http.server` in this folder.

| File | What it is |
|---|---|
| `index.html` | Workday home clone (hero banner, quick-action chips, Awaiting Your Action, Timely Suggestions, Announcements) |
| `academics.html` | Academics Hub overview clone + the degree audit table (`#progress`) |
| `saved-schedules.html` | View My Saved Schedules clone; shows schedules the builder saves |
| `builder.html` | The Schedule Builder: 7 screens, hash-routed (`#start #prefs #needs #options #swap #review #errors`) |
| `mockups.html` | All seven screens in phone frames plus laptop frames, live |
| `js/engine.js` | Rules engine: tries every section combination, drops rule-breakers, explains each pick. Works with no AI |
| `js/icons.js` | Workday Canvas system icons (MIT) + a few lifted from the live DOM |
| `css/workday.css` | The shell, with the measured tokens at the top |
| `data/sections.js` | Jordan's sample data from the demo brief |

Query flags on `builder.html`: `?demo=1` preloads the recommended schedule so any step renders
on its own; `&ai=on` turns the AI-assist toggle on; `&swap=FINN%203043-002` opens swap for a class.

AI assist is optional and only does two things: reads the plain-English sentence into the form
(`SB.parseSentence`) and writes longer explanations (`SB.why(…, 'ai')`). The schedules come from
the rules engine either way, and it can only show sections that exist in the data.

Privacy: the student ID, advisors (except Blaise M. Simecek, named with permission), current classes, instructors and sections on the clone pages are made up. Reference captures of the real tenant
stay in a local, git-ignored `reference/` folder and are not part of this repo.
