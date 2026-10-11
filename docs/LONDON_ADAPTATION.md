# Corgi Café: Loaf Rush, London adaptation (V1 edit)

This document records how the existing V1 notebook game was adapted to the real Corgi Cafe at **74 Great Eastern Street, Shoreditch**, what is evidence and what is inference, and how the result was verified. It accompanies the handoff pack (`00-START-HERE.md` to `05-PASTE-IN-MANUS.txt`).

The game is still the same Phaser 3 + TypeScript + Vite project: fixed 1280 x 720 whole-room view, lined notebook paper, wobbling pen outlines, Patrick Hand and Caveat Brush fonts, taped scraps, sticker buttons, the same controls, the same seven-day structure and the same save key.

## 1. What changed, in one paragraph

The café is now the orange Shoreditch room. Every animal is a real-shaped corgi (low loaf body, short thick legs, deep chest, large upright ears, foxlike muzzle, white blaze and chest, red-white or tricolour coat). Corgis run the café: the player barista, Biscuit the delivery helper, Mochi the napper, the croissant bandit and the zoomies pair are all staff. Every paying customer is a human. The menu is nine real items from the current official London menu, each with a coherent two or three step recipe. The title keeps the loved sleeping-corgi-in-a-cup composition, with the unsupported "Corgi Latte" caption corrected to "Corgi Cafe". A small sharing loop was added: a scorecard image drawn with the game's own art, shared only after a tap.

## 2. Reference-to-game spatial mapping

The real room, seen from the street door, has the long counter on the **right**, communal seating to the left and centre, the rear wall at the back and the Renaissance mural along the long left wall. A fixed top-down notebook view cannot show four walls, so the room is rotated and unfolded as follows. This is a **camera adaptation**, not a claim about the real floor plan.

| Real room element | Game placement | Notes |
| --- | --- | --- |
| Street frontage, orange double bay shopfront, "Corgi Cafe" fascia, "74", "where tech builders meet." | Screen **right** edge: orange frames, door, OPEN sign, vertical "Corgi Cafe" fascia and "74" | Shopfront compressed to a vertical strip |
| Long counter on the right-hand wall (from the street) | Screen **top**: back bar with stations, orange panelled counter front (the pass) | Keeps "counter on the right as you enter" because the street is on the screen's right |
| Warm white rough brick behind the counter | Brick band along the top wall | Colour inferred |
| Narrow white subway tile strip above orange panels | Tile strip y 58 to 96 behind the stations | |
| Three portrait menu panels DRINKS / CORGI CAFE / FOOD | Hung on the brick above the espresso and cold bar area | Original drawings, no photo pixels |
| Copper bell pendants over the counter | Three copper bells over the pass | |
| Communal pale timber tables, thin dark legs, brown chairs | Three long tables with brown chairs at the six service seats | |
| Sage dome lamps over tables | Sage domes drawn above each table | |
| Slim pale column | Pillar stub between tables | |
| Rear wall: orange 3D corgi figure installation, polaroid corkboard, picture string | Screen **left**: orange figure installation, polaroid board in the top-left corner, picture string | |
| Long left wall: orange lower panelling / bench band | Screen **bottom**: orange bench band | The wall itself is "cut away" by the camera |
| Renaissance corgi mural (long left wall) and Creation of Adam corgi ceiling | **Notebook margin sketches**, labelled "(moved to margin)" | Labelled camera adaptation; original pen sketches only |
| Window bar with high stools | Window ledge near the shopfront with three stools, used by the visiting group | |

**Inferred values (not measured):** room proportions, counter length, seat count, and all colours. Palette tokens used in `src/config.ts`: brand orange `#FF5C00` (digital token, not a paint code), wall `#F3EEE5`, tables `#CFA574`, floor `#A77850`, upholstery `#805B43`, sage `#96A486`, copper `#B7804B`.

**Event-only and historical material kept out of the permanent café:** the launch film's "Grand Opening" starburst, ribbon cutting, crowd and the live dog are not drawn into the room. Archie (the launch dog) is not depicted; all staff corgis are fictional.

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
| Iced Latte | 16021 | Iced Coffee | 4.30 | 9 | Latte, cold bar (ice) | Clear cup, milky coffee, ice (inference) |
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

Orders only use items unlocked that day, and stations for locked items show a "coming soon" note.

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

Humans are original fictional people with varied skin tones, hair, clothes and ages, drawn in sitting and walking poses with neutral, happy and annoyed moods. No visitor portraits or personal data were used.

## 6. Sharing and replay loop

* Results and Victory screens have a **Share** button. It opens a scorecard drawn by the game (1200 x 630): title, two staff corgis, an orange counter, the day's real stats, stars, a caption and the public play link.
* Buttons: native **Share** (only shown when the browser supports it; sends the PNG file when file sharing is supported, otherwise text and link), **Download PNG**, **Copy link** (with a select-to-copy fallback). Cancelling the native sheet is silent.
* Nothing is posted without a tap. No account, backend or paid provider.
* Link previews use `og-image.png` from an absolute URL with `summary_large_image`. No em or en dashes appear in any share text.
* Replay: Victory has "Play the week again"; saves keep wins and best stars.

## 7. Save compatibility

The save key stays `corgicafe.save.v1`. Existing progress, upgrades, aprons, décor and settings load unchanged (cosmetic ids kept, display names updated, "Corgi Orange" apron added). Unreadable saves are copied to `corgicafe.save.v1.backup`, a console warning is printed and the game starts from safe defaults. Saves with wrong field types are sanitised field by field.

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

## 9. Known limitations and pitfalls

* Geometry and colours are inferred from photographs; the room is a stylised fixed-camera adaptation.
* Corgi Orange Cake, Chicken sourdough and Iced Latte visuals are original-art inference because no product photos were published.
* Balance across all seven days needs real play; the headless runs verified logic, not feel.
* Native share sheets behave differently across browsers and messaging apps; WhatsApp caches link previews, so an old preview may persist for a while after deployment.
* The game is best in landscape on phones; portrait shows a "turn your phone sideways" hint and remains playable but small.
