# ClubHQ · new club intake form

Send this to the club. Their answers fill `club.config.json`; the bracketed hints
show what each field drives.

```
CLUB_NAME:        [e.g. Clutch Basketball]
CLUB_SHORT:       [what everyone calls it, e.g. Clutch]
TAGLINE:          [one line on the family app welcome screen,
                   e.g. "Basketball is just the beginning."]
SPORT:            [e.g. basketball / football / netball / cricket]
SCORE_WORD:       [what players score: points / goals / runs / tries]
AREA_WORD:        [what they play on: court / field / pitch / lane]
AGE_GROUPS:       [e.g. U12, U14, U16, U18, Open — with age cutoffs]
CLUB_COLORS:      [primary hex + a dark neutral, e.g. #FF8A1E on #0B0A08]
LOGO:             [attach image file(s): square logo PNG, favicon, 192px icon]
HOME_VENUE:       [e.g. Bankstown Basketball Stadium — first venue in Settings]
COUNTRY/REGION:   [drives date format, phone format, child-safety check name
                   — e.g. Australia: dd/mm dates, 04xx phones, "WWCC"]
GAME_NIGHT(S):    [e.g. Friday juniors, Saturday seniors — default competition]
SEASON_FEE:       [default per-player fee, e.g. $280]
CONTACT_PERSON:   [whose name signs the generated messages]
CLUB_EMAIL:       [admin email]
CLUB_PHONE:       [public club number]
ADMIN_WHATSAPP:   [number for password-reset messages, intl digits, e.g. 614XXXXXXXX]
GAME_FILM_SITE:   [optional: where game replays live, e.g. GloryLeague]
CULTURAL_EXTRAS:  [optional: e.g. prayer-time countdown on the schedule,
                   greetings style for generated messages]
STAFF_URL:        [host for the staff app, e.g. clubname-hq.netlify.app]
FAMILY_URL:       [host for the family app, e.g. clubname.netlify.app]
```

## Mapping to club.config.json

| Form field | Config key(s) |
|---|---|
| CLUB_NAME / CLUB_SHORT / TAGLINE | `name`, `short`, `hq` (usually `<short> HQ`), `tagline` |
| SPORT | `emoji`, `hashtag`, plus the three below |
| SCORE_WORD | `scoreWord`, `scoreAbbr` |
| AREA_WORD | `area`, `areaShort` |
| AGE_GROUPS | `ageGroups` (label + maxAge per group, oldest = catch-all) |
| CLUB_COLORS | `colors.*` (accent pair, accent ink, dark bg; light-theme pair) |
| COUNTRY/REGION | `tz`, `locale`, `currency`, `cc`, `check.*`, `dateOrder` |
| GAME_NIGHT(S) / SEASON_FEE | `defaultComp`, `defaultFee` |
| CONTACT_PERSON / CLUB_EMAIL / CLUB_PHONE | `contactName`, `clubEmail`, `clubPhone`, `clubBase` |
| ADMIN_WHATSAPP | `wa` |
| GAME_FILM_SITE | `film.name`, `film.urlHint` (blank name → plain "video" labels) |
| CULTURAL_EXTRAS | `prayerDefault`, `prayerLabel`, `lat`/`lon` (sunset calc), `greet`, `greetLong`, `thanks`, `chatEmpty*` |
| STAFF_URL / FAMILY_URL | `staffUrl`, `familyUrl` |

HOME_VENUE isn't stamped — the admin adds venues in the staff app's Settings page
on day one.
