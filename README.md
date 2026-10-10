# the roost

a cozy animal crossing "roost" cafe style focus timer for your desktop. work for a bit, chill for a bit, repeat, with music and rain going in the background.

![the roost banner screen](screenshot.png)

## what it does

* **pomodoro timer**: set your own focus and break times. the app remembers your settings so you don't have to redo them every time.
* **smooth song swaps**: songs blend into each other instead of cutting off, so the vibe never breaks.
* **rainy day sounds**: rain and thunder play on their own layer behind the music and fade in and out smoothly.
* **proper shuffle**: the playlist gets shuffled fairly every time you open the app, then loops forever.
* **no lag**: all the songs get loaded when the app starts, so nothing stutters mid session.
* **now playing popups**: a little popup shows the song name, the game it's from, and the album art whenever the song changes.
* **cozy look**: animal crossing cafe theme, custom font, retro buttons, and no accidentally highlighting text everywhere, so it feels like a real desktop app.
* **real desktop app**: made with electron, with its own minimize and close buttons, and it opens fast.

## coming soon

* streak system
* bells and a shop to customize stuff
* a guided tutorial with isabelle

## how to run it

1. install [node.js](https://nodejs.org).
2. grab the code (clone this repo) and run `npm install` inside the folder.
3. add your own music and assets (see below).
4. run `npm start`, or if you're on windows just double click `run.vbs`.

## stuff that's not included

the game music, ambience sounds, sound effects, fonts and album covers aren't in this repo because they belong to their owners. to get sound working, make these folders in the project root and drop in your own files: `OSTs/`, `ambience/`, `fx/`, `album-covers/`, `font/`.

## what i learned

this was my first real project. i wrote out all the features in a notebook and sketched the ui before building anything, which made the actual building way smoother. i split the plan into a barebones version and an "advanced" version, built the barebones one first, and cut a few ideas that didn't fit the cozy cafe vibe. Google's Gemini helped me translate my ideas into reality and the journey itself taught me a lot of how the logic behind deployed projects work. i had a lot of fun working on this project and i'm a huge animal crossing fan as well :D i aspire to become entirely independent and stop relying on generative AI and compeletely code on my own for my creative freedom. i also learned git and github to push it online for yall :). this is my first independent project and definitely wont be my last :D

## disclaimer

just a
