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

## What is in it

**Doctor:** Home lists only the children who need attention; Children has a category filter and three ways to add a child (photo of an earlier report, voice, by hand); each child has Summary, Plan, Notes, Progress and Profile; the AI use tab is a chat that runs the app.

**Parent:** Home shows the next step, the doctor-verified progress and today's guide; Guide has daily and weekly guidance chosen from the child's approved profile; Tracker; an AI chat that matches a situation with doctor-verified advice; notes with voice, photo and video.

**What is real and what is a demo.** Real: plans (day by day, with common activities), notes with media, progress ratings, the approve-then-share steps, the profile and filters. Demo only, with prepared answers: both chats, the report scan and voice intake, the AI progress suggestion when no AI key is set, and the match percentages. The sample children, the guide, the how-to videos and the "verified situations" are invented sample content and have not been reviewed by a clinician.

## The 90-second demo

1. View as a doctor: Rafi > Plan > New week > type a goal > Draft activities and story.
2. Read the draft, edit a line if you like, then Approve and send.
3. View as a parent: the new plan is on Home. Switch to বাংলা, open Story, then tap "How was today?" and record a note.
4. View as a doctor: Rafi > Summary > Update. The new note is in the summary and the patterns.
5. AI use tab: which AI did what, and who approved it.

Reset the sample data (Settings) before each rehearsal. Every real AI answer is saved, so if the internet drops on stage the
same request reuses its saved answer (the app labels it "saved answer").

## Where things are

- `server/index.js` routes and data, `server/ai.js` AI providers, `server/prompts.js` the exact words sent to the AI
- `public/seed-data.js` the sample week and the prepared samples, `public/local.js` the browser-only mode
- `public/` the app (`app.js`, `app.css`, `mascots.js` for the two characters, `motion.js` for all animation), `public/demo.html` the pitch view
- `data/` saved data and recordings (created on first run; safe to delete to start fresh)

The microphone works on `localhost` in Chrome. On a real phone over Wi-Fi the browser blocks the microphone
unless the app is served over https, so type the note there or demo from the laptop.
