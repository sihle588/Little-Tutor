# Little Tutor – Grade 8 to 12 (Learner + Tutor)

Open the folder in VS Code and start `login.html` with Live Server. No backend: everything is saved in localStorage.

## Demo logins
| Role    | Email                       | Password   |
|---------|-----------------------------|------------|
| Learner | sihle.learner@gmail.com     | learner123 |
| Tutor   | likuwe.tutor@gmail.com      | tutor123   |

All 24 learners in Grade 10A log in as `firstname.learner@gmail.com` with `learner123`
(Sihle, Thabo, Lerato, Naledi, Sipho, Zanele, Ayanda, Kagiso, Nomsa, Lwazi, Palesa, Tumelo,
Anele, Bongani, Refilwe, Mpho, Zodwa, Karabo, Neo, Lindiwe, Siyabonga, Amahle, Themba, Ntombi).
Other grades: mandla.learner (Gr 8), busisiwe.learner (Gr 9), kabelo.learner (Gr 11), nandi.learner (Gr 12), all `@gmail.com`, password `learner123`.
New learners can register and choose Grade 8 to 12.

## Structure
```
login.html, forgot-password.html      Login / Register / Forgot password
index.html  learn.html  subject.html  Learner pages (home, subject search, subject)
quiz.html   rewards.html
tutor.html                            Tutor Dashboard
css/styles.css                        Learner design (bright, rounded)
css/tutor.css                         Tutor design (blue and white)
js/data.js                            Content setup + placeholder helper
js/content/grade8.js ... grade12.js   One file per grade (add CAPS content here)
js/core.js                            Shared logic: accounts, roles, class data, stars/streak, panels
js/<page>.js                          One script per page
```

## How tutor and learners connect (localStorage)
- `lt_users`  accounts, roles, grades and each learner's progress
- `lt_class`  Grade 10A homework (with who has done it), messages, reminders, extra lessons, attendance
Both views read and write these keys, and refresh when the other tab changes them.

## Adding CAPS content
Open `js/content/gradeN.js`. Subjects created with `ph(...)` are placeholders. Replace one with a full
subject object (homework, tutor lesson, quiz) like the Mathematics entry in the same file.
