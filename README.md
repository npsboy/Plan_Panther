<picture>
  <source srcset="Banner_dark_mode.png" media="(prefers-color-scheme: dark)">
  <img src="Banner_light_mode.png" alt="Banner" width="400">
</picture>
<br> <br>
A web app that helps students create a study plan for their exams.
<br> <br>

[See this working](https://npsboy.github.io/Plan_Panther/)

# How do you use it?
## Generate timetable:
- Enter your subjects, their exam date and difficulty into the app.
- Hit generate.

## Export to Google Calendar (optional):
- Click 'Export to Google Calendar" to download an iCalendar file.
- Go to [Google Calendar](https://calendar.google.com/)
- Head to settings.
- Click import and export.
- Select the downloaded file and click import.
- Your timetable will be saved to Google Calendar.

# How does it work?
- The app takes in your subject's exam date and difficulty rating (out of 3).
- The algorithm cleverly distributes study slots among these subjects based on this rating.
- It ensures every subject is reviewed before the exam and handles time constraints.
- The algorithm then fairly allocates the remaining slots to maximise preparation.
- Holidays are prioritised for longer sessions.
  
