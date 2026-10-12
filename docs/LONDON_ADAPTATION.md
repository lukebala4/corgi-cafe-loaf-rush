# Corgi Café: Loaf Rush, London adaptation (V1 edit)

This document records how the existing V1 notebook game was adapted to the real Corgi Cafe at **74 Great Eastern Street, Shoreditch**, what is evidence and what is inference, and how the result was verified. It accompanies the handoff pack (`00-START-HERE.md` to `05-PASTE-IN-MANUS.txt`).

The game is still the same Phaser 3 + TypeScript + Vite project: fixed 1280 x 720 whole-room view, lined notebook paper, wobbling pen outlines, Patrick Hand and Caveat Brush fonts, taped scraps, sticker buttons, the same controls, the same seven-day structure and the same save key.

## 1. What changed, in one paragraph

The café is now the orange Shoreditch room. Every animal is a real-shaped corgi (low loaf body, short thick legs, deep chest, large upright ears, foxlike muzzle, white blaze and chest, red-white or tricolour coat). Corgis run the café: the player barista, Biscuit the delivery helper, Mochi the napper, the croissant bandit and the zoomies pair are all staff. Every paying customer is a human. The menu is nine real items from the current official London menu, each with a coherent two or three step recipe. The title keeps the loved sleeping-corgi-in-a-cup composition, with the unsupported "Corgi Latte" caption corrected to "Corgi Cafe". A small sharing loop was added: a scorecard image drawn with the game's own art, shared only after a tap.

**Crowd and atmosphere update.** The room now fills up with a young crowd who come in to hang out, vibe code on laptops, film the corgis and chat (they never order, so they never add pressure). A laptop lounge, merch shelf, neon tagline sign, paw prints, a lounge corgi (Pudding) and a door greeter corgi (Bean) were added. All floor and margin captions were removed so the room reads as a drawing, not a diagram. A recipe strip at the bottom of the screen names each ordered item, shows its station path using the station signs, and tells you the next step for what is in paw.

## 2. Reference-to-game spatial mapping

The real room, seen from the street door, has the long counter on the **right**, communal seating to the left and centre, the rear wall at the back and the Renaissance mural along the long left wall. A fixed top-down notebook view cannot show four walls, so the room is rotated and unfolded as follows. This is a **camera adaptation**, not a claim about the real floor plan.

| Real room element | Game placement | Notes |
| --- | --- | --- |
| Street frontage, orange double bay shopfront, "Corgi Cafe" fascia, "74", "where tech builders meet." | Screen **right** edge: orange frames, door, OPEN sign, vertical "Corgi Cafe" fascia and "74" | Shopfront compressed to a vertical strip |
| Long counter on the right-hand wall (from the street) | Screen **top**: back bar with stations, orange panelled counter front (the pass) | Keeps "counter on the right as you enter" because the street is on the screen's right |
| Warm white rough brick behind the counter | Brick band along the top wall | Colour inferred |
| Narrow white subway tile strip above orange panels | Tile strip y 58 to 96 behind the stations | |
| Three portrait menu panels DRINKS / CORGI CAFE / FOOD | Hung on the brick above the espresso and cold bar area | Original drawings, no photo pixels |
| Copper bell pendants over the counter | One copper bell over the pass, plus a dark neon board on the brick reading "where tech builders meet." | Tagline moved from the fascia to the neon board so both read cleanly |
| Communal pale timber tables, thin dark legs, brown chairs | Three long tables with brown chairs at the six service seats | |
| Sage dome lamps over tables | Sage domes drawn above each table | |
| Slim pale column | Pillar stub between tables | |
| Rear wall: orange 3D corgi figure installation, polaroid corkboard, picture string | Screen **left**: orange figure installation, polaroid board in the top-left corner, picture string | |
| Long left wall: orange lower panelling / bench band | Screen **bottom**: orange bench band | The wall itself is "cut away" by the camera |
| Renaissance corgi mural (long left wall) | Gold-framed Renaissance corgi portrait doodled in the notebook margin, next to a sleepy corgi-in-a-cup doodle | Camera adaptation, no captions; original pen sketches only |
| Sofa and lounge seating, corgi beds | Laptop lounge bottom left: orange rug, sage sofa, beanbag, corgi bed, water bowl and tennis ball | Game invention for atmosphere (not a claimed feature of the real room) |
| Corgi Cafe merch (corduroy caps, mugs, totes) | Merch shelf just inside the door | Products inferred from the brief; drawn as original art |
| Window bar with high stools | Window ledge near the shopfront with three stools, used by the visiting group | |

**Inferred values (not measured):** room proportions, counter length, seat count, and all colours. Palette tokens used in `src/config.ts`: brand orange `#FF5C00` (digital token, not a paint code), wall `#F3EEE5`, tables `#CFA574`, floor `#A77850`, upholstery `#805B43`, sage `#96A486`, copper `#B7804B`.

**Event-only and historical material kept out of the permanent café:** the launch film's "Grand Opening" starburst, ribbon cutting, crowd and the live dog are not drawn into the room. All staff corgis are fictional. Archie, the café's real office corgi (publicly reported at the launch and in Metro's August report as "Archibald Clifton, Archie for short"), appears only as an optional late décor unlock ("Archie drops by"): a stylised tan-and-white corgi with a name tag who naps on a cushion and visits seated guests. It is an affectionate nod drawn from his broad public description (tan/white markings, big ears, short paws), not a literal portrait.

**No photographs, video frames or raw mural pixels are shipped.** All game art is procedural pen drawing in `src/art/`. `public/` contains only `og-image.png` (rendered from the game's own scorecard art) and `manus-routes.json`.

## 3. Single geometry source

`src/config.ts` defines the play area, the station x positions, the pass openings, seats, the group spot, the window ledge and the nap doorways. The background (`src/art/background.ts`), station visuals and interaction points (`src/game/station.ts`), collision statics and A* navigation (`src/game/world.ts`), customer seats, Biscuit's routes, event paths and the tutorial all read from it.

| Station | x | Output |
| --- | --- | --- |
| Toastie press | 290 | Chicken sourdough (4 s, burns at 8 s) |
| Pastry case | 410 | Plain Croissant (left target 380) or Corgi Orange Cake (right target 440): explicit choice by standing position |
| Blender | 530 | The Juicebox |
| Cup stack | 650 | Empty Corgi Cafe cup |
| Milk steamer | 770 | Steamed milk in the cup |
| Espresso machine | 890 | Americano (cup) or Latte (cup with milk) |
| Cold bar | 1010 | Iced Latte (from Latte), Pally Pick-Me-Up (from Iced Latte), Brew Daytona (from empty cup) |
| Bin | 1130 | Clears the item in paw |

Pass openings: the counter end (x 100 to 230) and two hatches (x 600 to 695 and 990 to 1085). Stations that accept several inputs always resolve from the item in paw, and the prompt names the result before you press, so a shared station never produces an arbitrary output.

## 4. Menu mapping and evidence

Source: current official London menu, Town menu page `https://corgicafe.town.club/m/main-menu-272?tc_business_id=244`, retrieved 2026-10-11 (handoff `data/current-official-london-menu.csv`). The full 61-product inventory is preserved in `src/data/londonMenu.ts` and shown in the in-game **Menu** overlay (title screen and pause menu), with the nine playable items tagged "in the game".

| Game item | Product id | Category | GBP (real) | Game coins | Recipe in the game | Visual basis |
| --- | --- | --- | --- | --- | --- | --- |
| Americano | 16037 | Coffee | 3.70 | 5 | cup, espresso | Corgi Cafe paper cup (cup logo seen in launch film) |
| Latte | 16013 | Coffee | 4.30 | 8 | cup, milk, espresso | Paper cup; corgi latte art is game decoration only |
| Iced Latte | 16021 | Iced Coffee | 4.30 | 9 | Latte, cold bar (ice) | Clear cup, mostly white milk with a caramel coffee swirl, ice, white straw, no lid (inference). Drawn to read clearly apart from the Brew Daytona |
| Brew Daytona | 16032 | Iced Coffee | 5.00 | 8 | cup, cold bar (no milk, no espresso) | Official cutout: clear cup, dark amber cold brew with ice, black sleeve |
| Pally Pick-Me-Up | 16122 | Iced Coffee | 5.75 | 12 | Iced Latte, cold bar (pistachio and cream foam) | Official cutout: tan coffee over pistachio green, white foam cap, mint sleeve. Menu text "Pistachio syrup, Vanilla, Double cream" |
| The Juicebox | 16031 | Smoothies | 9.75 | 10 | cup, blender | Official cutout: lavender-purple berry smoothie, domed lid, purple sleeve. Menu text "Berries" |
| Plain Croissant | 16042 | Ambient | 3.50 | 4 | pastry case (left) | Generic croissant drawing (no product photo published) |
| Corgi Orange Cake | 15022 | Ambient / Cake | 6.20 | 6 | pastry case (right) | Plain orange slice, **original-art inference** (no product photo published) |
| Chicken sourdough | 16043 | Food | 11.55 | 8 | toastie press | Menu text "sourdough, chicken, avocado, spinach, sweet chilli mayo"; drawing is inference |

Game coins are a separate fictional balance and are never presented as prices. Real GBP appears only in the Menu overlay, labelled with source and date.

**Removed V1 items:** puppuccino, sleepy corgi toast and "fancy" latte art orders (not on the London menu). No product is called "Corgi Latte".

### Unlocks by day

| Day | New items | New events or roles |
| --- | --- | --- |
| Mon | Americano, Plain Croissant | Regulars, newcomers, tech builders |
| Tue | Latte | Sceptic; croissant bandit |
| Wed | Corgi Orange Cake | Coffee enthusiast; zoomies |
| Thu | Chicken sourdough | Mochi naps in a pass opening |
| Fri | Iced Latte, Brew Daytona | Content creator; visiting group |
| Sat | Pally Pick-Me-Up, The Juicebox | All four events in one shift |
| Sun | Everything (Sunday Brunch finale) | Five events including two zoomies |

Orders only use items unlocked that day, and stations for locked items show a padlock note saying "Locked" and the day they open (for example "opens Tue").

## 5. Characters and roles

| V1 | London |
| --- | --- |
| Corgi barista (player) | Corgi barista, real-shaped body, apron worn as a chest bib so proportions stay visible |
| Assistant corgi | **Biscuit**, carries finished items from the pass pads to the right customer |
| Golden retriever (forgiving) | Relaxed regular (human) |
| Poodle (latte art) | Coffee enthusiast (human), favours top coffee orders |
| Grumpy cat | Grumpy commuter / sceptic (human) |
| Corgi influencer | Content creator (human), photographs the corgi barista for a bonus |
| Dachshund blocking the aisle | Removed. Blocking is now Mochi the napping staff corgi |
| The Big Loaf (giant customer) | Visiting group of three humans at the window bar with one group order |
| Customers doing zoomies | Staff corgis do zoomies; seated humans react (patience paused) |
| (new) Crowd | 12 non-paying young visitors: laptop coders, phone filmers, chatters. They sit behind the long tables, on the sofa and beanbag, and at the window bar (which they give up when a group is due). 5 on Monday rising to 11 on Sunday |
| (new) Pudding | Red-and-white lounge corgi. Naps in the lounge bed, then trots over to a seated visitor for pats (hearts) |
| (new) Bean | Tricolour staff corgi sitting by the door, wiggles and shows a heart for every arrival |
| (new, décor unlock) Archie | Tan-and-white office corgi with a name tag, cushion beside the lounge; naps and visits guests ("ARCHIE!!") |

Humans are original fictional people with varied skin tones, hair and clothes, skewing younger (curtain fringes, space buns, braids, oversized tees, puffers, varsity jackets, AirPods, white trainers), drawn in sitting and walking poses with neutral, happy and annoyed moods. No visitor portraits or personal data were used.

## 5b. Shop economy and London tech references

* Order pacing was calmed after play feedback ("slightly too many orders"): new customers arrive every 15 to 20 s on Monday, easing down to 9.5 to 13 s on Sunday; at most 2 waiting on Monday up to 5 at the weekend; patience 66 s on Monday down to 52 s on Sunday; daily goals 60, 95, 125, 160, 200, 240, 290 coins; group orders are always 3 items.
* The shop restocks through the week so it never runs dry by Friday. Each upgrade has up to three levels; level 2 arrives after Tuesday and level 3 after Thursday (`TIER_DAY = [0, 2, 4]`). Locked levels show "Restocks after Tue/Thu", and newly arrived stock gets a "new stock!" tag.
* Prices: Turbo Espresso 60/150/240, Second Paw Slot 180, Longer Zoomies 50/120/180, Comfy Cushions 70/160/240, Hire Biscuit 220 then roller skates 300 (faster runs). Aprons 40 to 90.
* Eight décor items over two pages (+5% tips each): flower pots 40, Polaroid string 60, plugs at every table 60, extra copper lamps 80, Tonight board 80, Renaissance corgi 100, laptop stickers 100, Archie drops by 250. Everything together costs 2,980 coins against daily goals that add up to 1,170, so even a strong week leaves plenty to save for (estimate; real earnings depend on tips and combos).
* London tech culture, kept affectionate and impersonal (sources: City AM "Corgi Cafe: my day at London's 24/7 hub for tech bros", UK 2.0 "Tech's café culture moment", public LinkedIn and X posts, October 2026): the Tonight board lists a nightly event (pub club, pitch night, demo night, hackathon, app roast, corgi paint club, run club); pass stickers read "ship it", "build in public", "Londonmaxxing", "corgi > standup", "it works on my laptop"; visitors mutter lines such as "any London founders here?", "we just closed our pre-seed!", "one flat white, three hours", "let's make a Corgi corner", "made it off the Luma waitlist"; customers who leave can sigh "How are we supposed to grind?!". The Results share text opens with "Humbled to announce". No real person other than the café's public office corgi is referenced.

## 6. Sharing and replay loop

* Results and Victory screens have a **Share** button. It opens a scorecard drawn by the game (1200 x 630): title, two staff corgis, an orange counter, the day's real stats, stars, a caption and the public play link.
* Buttons: native **Share** (only shown when the browser supports it; sends the PNG file when file sharing is supported, otherwise text and link), **Download PNG**, **Copy link** (with a select-to-copy fallback). Cancelling the native sheet is silent.
* Nothing is posted without a tap. No account, backend or paid provider.
* Link previews use `og-image.png` from an absolute URL with `summary_large_image`. No em or en dashes appear in any share text.
* Replay: Victory has "Play the week again"; saves keep wins and best stars.

## 7. Save compatibility

The save key stays `corgicafe.save.v1`. Existing progress, upgrades, aprons, décor and settings load unchanged (cosmetic ids kept, display names updated, "Corgi Orange" apron added). Unreadable saves are copied to `corgicafe.save.v1.backup`, a console warning is printed and the game starts from safe defaults. Saves with wrong field types are sanitised field by field.

The rewards update adds optional fields with safe defaults: `seen` (sticker book), `ach` (achievement stickers), `endlessBest`, `bandits` (all-time pastry bandit catches) and `goldenWeek` (whether this week has had its golden guest). Older saves load with an empty book. "Play the week again" keeps the book, achievements, earned aprons and Endless best, and resets `goldenWeek`. Endless Brunch never writes coins, day progress or stars.

## 8. Verification

Automated checks ran in headless Chromium with software WebGL (SwiftShader) using scripted steps against the dev build, plus a production build. The headless loop renders at roughly a quarter to a third of real speed, so motion was reviewed from recorded frame sequences rather than at true real-time speed on a physical device.

| Checklist area | Result | Evidence |
| --- | --- | --- |
| Same game, notebook style, fonts, scraps, controls | Pass | Title, gameplay, shop, results and victory screenshots |
| Title keeps sleeping corgi in cup; "Corgi Latte" corrected | Pass | Cup caption "Corgi Cafe" |
| London cues: orange, brick, tile strip, timber, brown chairs, sage and copper lamps, right-side counter mapping, communal seating | Pass (stylised) | Gameplay screenshots; mapping table above |
| Three portrait panels, Renaissance and ceiling motifs, orange storefront / 74 | Pass | Background; margin sketches labelled |
| Photos and mural pixels kept out of production assets | Pass | `public/` and `dist/` contents |
| All animals are real-shaped corgis (player, Biscuit, nap, bandit, zoomies, title, portrait décor, shop preview, favicon, ending) | Pass | Screenshots; favicon redrawn as a corgi head |
| Every paying customer human; no old breed names or dog dialogue | Pass | Source scan for poodle, dachshund, retriever, cat, influencer, puppuccino, Big Loaf |
| Humans react to zoomies; corgis brew, carry and deliver | Pass | Zoomies test; Biscuit delivery test |
| All nine recipes preparable and servable | Pass | Recipe test served all nine items to human customers |
| Orders only use unlocked items | Pass | Day tables drive both orders and station locks |
| Wrong order, burnt sourdough, bin, inventory full, swap (Q / SWAP) | Pass | Events and mistakes test |
| Nap, bandit, zoomies, group start, end and cleanup, including overlap | Pass | Overlap test: queued nap and bandit wait for zoomies to finish |
| Biscuit delivers the correct item to the correct customer | Pass | Americano, Latte and Croissant delivered to two customers |
| Day end, results, shop purchase (real mouse clicks), next day, Sunday to Victory | Pass | Flow and shop tests |
| Save preserved, malformed save backed up, wrong types sanitised | Pass | Save tests |
| Desktop keys; touch joystick, PAW, ZOOM; portrait and landscape letterboxing | Pass | Real key presses; touch emulation; fixed a double-centering bug that pushed the canvas off-centre |
| Tutorial teaches the new actors, completion saves | Pass | Tutorial test with real Space and Shift |
| Pause, tab blur pause, audio toggles, reduced motion | Pass for pause and blur; toggles render and persist | Audio output itself was not listened to |
| Share: download and copy link | Pass | Downloaded `corgi-cafe-wednesday.png` with real run data; "Link copied!" |
| Native share sheet and cancellation | Not tested on a real phone | Code path guarded by feature detection; AbortError is silent |
| All seven days played to completion at real speed by a human | Not tested | Days were entered via saves and scripted; difficulty tuning is untested by real play |
| Character motion at true normal speed | Partially tested | Frame sequences from a slowed headless recording |
| Production build and live deployment | See README and the deployment record in the final report | |

### Rewards update (nostalgia pack)

| Feature | Result | Evidence |
| --- | --- | --- |
| Rising combo note per served order; streak stamps at 3, 5, 8, 12 | Pass (visual); audio not listened to | Stamp screenshots; note pitch is driven by the combo count |
| Tip coins arc into the counter, which rolls up with a cha-ching | Pass | Counter read 4 mid-roll and 21 when settled |
| Today's Special pays double base price; HUD sticker and starred bubble | Pass | A 5-coin cake special paid 21 with its tip; badge visible |
| Golden guest: glow, starry bubble, big tip, extra patience | Pass | Golden latte paid 103 at combo 5 and unlocked the Golden apron |
| Last orders bell, door closes, finale slow motion, confetti, tidy-close bonus | Pass | Finale fired on the last waiting guest; reduced motion keeps normal speed |
| Results count-up and staggered star slams | Pass | Mid and settled results screenshots |
| Sticker Book: five tabs, found stickers and pencil outlines with hints | Pass | Desktop and phone landscape screenshots; Enter and Esc do not leak into the scene underneath |
| 15 achievement toasts, three earned aprons in the shop (not purchasable) | Pass | Toasts on unlock; shop shows "Locked" and the earning rule |
| Endless Brunch unlock, rising pace, three hearts, best score, Go again and Share | Pass | Three walkouts ended the run; best saved; coins and day unchanged |
| Feel of the new pacing at real speed by a human | Not tested | Headless runs verify logic, not feel |

## 9. Known limitations and pitfalls

* Geometry and colours are inferred from photographs; the room is a stylised fixed-camera adaptation.
* Corgi Orange Cake, Chicken sourdough and Iced Latte visuals are original-art inference because no product photos were published.
* Balance across all seven days needs real play; the headless runs verified logic, not feel.
* Native share sheets behave differently across browsers and messaging apps; WhatsApp caches link previews, so an old preview may persist for a while after deployment.
* The game is best in landscape on phones; portrait shows a "turn your phone sideways" hint and remains playable but small.
