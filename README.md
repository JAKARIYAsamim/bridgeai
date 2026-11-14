# BridgeAI prototype

An app that links an autism therapist and a parent between sessions. Built for the AI in Business Hackathon 2026 (17 November 2026).
Everyone in the sample data (Rafi, Nusrat, Dr. Farhana, the centre) is invented.

## Start it

    cd ~/Study/hackathon/bridgeai
    npm start

- The app: http://localhost:4900 . It opens on "View as a parent / View as a doctor"; switch any time in Settings or the top-left menu.
- Optional pitch view (doctor and parent phones side by side): http://localhost:4900/demo
- On a phone it fills the screen and can be added to the home screen as an app.



Needs Node 20 or newer. There is nothing to install.

## Online preview (no server)

Opened from GitHub Pages, the app runs entirely in the browser on the sample week, saved in that browser only.
No AI is called there. To show the main loop it has clearly labelled prepared samples: as a doctor, open Rafi,
start a new week and choose the goal "Stay calm when the blender is on"; as a parent, use the example note.
To update the online preview after a change: `bash tools/publish.sh`.

## Turn the AI on

Copy `.env.example` to `.env`, paste one chat key, and restart. Gemini is recommended because it also
transcribes Bangla voice notes. The pitch view shows a green dot when the AI answers.
Story pictures use the `neoimg` command (gpt-image-2). `bash tools/make-art.sh` draws the sample story's pictures.

Without a working key the app still opens and shows the sample week, and parent notes are saved as spoken,
but drafting a plan and writing a summary show an "AI is not connected" message.

## The 90-second demo

1. View as a doctor: Rafi > Plan > New week > type a goal > Draft activities and story.
2. Read the draft, edit a line if you like, then Approve and send.
3. View as a parent: the new plan is on Home. Switch to বাংলা, open Story, then tap "How was today?" and record a note.
4. View as a doctor: Rafi > Summary > Update. The new note is in the summary and the patterns.
5. AI use tab: which AI did what, and who approved it.

Reset the sample data (Settings) before each rehearsal. Every real AI answer is saved, so if the internet drops on stage the
same request reuses its saved answer (the app labels it "saved answer").

## Also in the app (from the Bangla mockup)

- **Parent > Help**: "what do I do right now?" The parent says or types what is happening, or taps a common moment, and gets steps
  from the strategies the therapist already approved for that child. No AI writes this advice. If the parent mentions
  self-harm or another emergency, the app gives no advice: it shows a Call-the-therapist button and 999, and alerts the doctor.
  Afterwards "Did it help?" goes back to the doctor.
- **Parent > one-tap daily log**: on the note screen, a Good / Mixed / Hard face and a few tags are enough. A voice note is optional.
- **Doctor > Alerts**: urgent safety requests, help requests with their outcome, and families that have stopped noting
  (with a gentle-reminder button the parent sees on Home).
- **View as the centre**: dashboard, team and a parent progress report built from the weekly summary, sent to the parent.
  Dr. Farhana's row is live; the other three therapists are sample figures.
- **Social stories (the storyboard)**: Story tab = a library (All / New / Favourites) of every story the therapist has approved.
  The reader walks four steps (the situation, how I feel, what I can do, a good ending), with a calm picture per page and the
  child's own words. "Read aloud" highlights the word being read; "Record my voice" lets the parent read each page in their own
  voice, kept on that phone only. "Rafi and the blender" is drawn in the app; stories the AI writes use the drawn picture sheet.
  The doctor sees each page's step in the plan, and a "Story rules" sheet that matches what the AI is told.
- **Settings > Privacy promises** (parent).

Try it: as a parent open Help and tap "Hurting themselves", then switch to the doctor and open Alerts.
The therapist's phone number and the parents' numbers are placeholders, so the Call buttons only dial the sample numbers.

## Where things are

- `server/index.js` routes and data, `server/ai.js` AI providers, `server/prompts.js` the exact words sent to the AI
- `public/seed-data.js` the sample week and the prepared samples, `public/local.js` the browser-only mode
- `public/story.js` and `public/story-art.js` the story library, reader, read-aloud and recorded voice
- `public/care.js` and `public/care-logic.js` Help, Alerts, one-tap log, centre view (the logic is shared by the server and the browser-only mode)
- `public/` the app (`app.js`, `app.css`, `mascots.js` for the two characters, `motion.js` for all animation), `public/demo.html` the pitch view
- `data/` saved data and recordings (created on first run; safe to delete to start fresh)

The microphone works on `localhost` in Chrome. On a real phone over Wi-Fi the browser blocks the microphone
unless the app is served over https, so type the note there or demo from the laptop.
