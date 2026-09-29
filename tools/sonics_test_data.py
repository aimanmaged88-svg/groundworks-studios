"""Synthetic test data for the Sonics desktop dashboard.

Every person here is made up. Nothing in this file comes from real
registrations, and real member data must never be committed to this repo.

Writes southwest-sonics-app/dash-data.js. Run from the repo root:
    python3 tools/sonics_test_data.py
"""
import json, random, hashlib
from datetime import date, timedelta
from pathlib import Path

TODAY = date(2026, 9, 29)

SEASONS = [  # key, name, season year (for age groups), first Friday, last Friday, breaks
    ("W24", "Winter 2024",    2024, date(2024, 5, 3),  date(2024, 9, 13), []),
    ("S25", "Summer 2024/25", 2025, date(2024, 10, 18), date(2025, 3, 28), [(date(2024, 12, 14), date(2025, 1, 30))]),
    ("W25", "Winter 2025",    2025, date(2025, 5, 2),  date(2025, 9, 12), []),
    ("S26", "Summer 2025/26", 2026, date(2025, 10, 17), date(2026, 3, 27), [(date(2025, 12, 13), date(2026, 1, 29))]),
    ("W26", "Winter 2026",    2026, date(2026, 5, 1),  date(2026, 9, 25), []),
]
NEXT = ("S27", "Summer 2026/27", 2027, date(2026, 10, 16), date(2027, 3, 26), [(date(2026, 12, 12), date(2027, 1, 28))])
TOUR = [date(2025, 7, 7), date(2025, 7, 8), date(2025, 7, 9)]  # Japan tour games


def fridays(a, b, breaks):
    d, out = a, []
    while d <= b:
        if not any(x <= d <= y for x, y in breaks):
            out.append(d)
        d += timedelta(days=7)
    return out


schedule = []
for k, n, y, a, b, br in SEASONS:
    fr = fridays(a, b, br)
    for i, d in enumerate(fr):
        t = "T" if i < 2 or (i >= 2 and (i - 2) % 7 == 6) else "G"
        schedule.append({"d": d.isoformat(), "s": k, "t": t})
    if k == "W25":
        for d in TOUR:
            schedule.append({"d": d.isoformat(), "s": k, "t": "J"})
schedule.sort(key=lambda r: r["d"])
future = [d.isoformat() for d in fridays(NEXT[3], NEXT[4], NEXT[5])]

COACHES = {
    "MR": {"n": "Marcus Reed", "team": "U12"},
    "DN": {"n": "Dave Nguyen", "team": "U14"},
    "SE": {"n": "Sam Elias", "team": "U16"},
    "TO": {"n": "Tariq Osman", "team": "U18"},
    "RS": {"n": "Rania Saab", "team": "U14G"},
}
FINISH = {
    "W24": {"U12": "6th of 8", "U14": "Semi-final", "U16": "4th of 8"},
    "S25": {"U12": "5th of 8", "U14": "3rd of 8", "U16": "Semi-final", "U18": "7th of 8"},
    "W25": {"U12": "Semi-final", "U14": "Runners-up", "U16": "4th of 8", "U18": "5th of 8", "U14G": "6th of 7"},
    "S26": {"U12": "3rd of 8", "U14": "Semi-final", "U16": "Semi-final", "U18": "6th of 8", "U14G": "4th of 7"},
    "W26": {"U12": "Semi-final", "U14": "Runners-up", "U16": "4th of 8", "U18": "6th of 8", "U14G": "Semi-final"},
}

D = date.fromisoformat
# p: (start, end) attendance probability across membership; rules: (from, to, p) overrides
P = [
 dict(k="zayd", n="Zayd Hassan", g="M", dob="2013-03-14", sub="Punchbowl", gd=("Mariam Hassan", "Mother"), no=7, pos="Guard",
      joined="2025-04-22", src="Referral", ref="omar", prior="School team", p=(.3, .4), rules=[("2026-05-01", "2026-09-30", 1.0)],
      med=True, photo=True, owe=40, summer=("Registered", "2026-09-21"),
      notes=[("2025-08-29", "DN", "Turns up late most weeks and misses the warm-up. Spoke to Mariam about lifts."),
             ("2026-06-12", "DN", "Hasn't missed a Friday since May. Asking for extra shooting after training."),
             ("2026-09-25", "DN", "Ready for U16 next season. Left-hand finish is the last real gap.")]),
 dict(k="omar", n="Omar Fares", g="M", dob="2015-01-20", sub="Lakemba", gd=("Layla Fares", "Mother"), no=4, pos="Guard",
      joined="2024-04-20", src="Launch day", prior="None", p=(.72, .86), photo=True, owe=0, summer=("Registered", "2026-09-12"),
      notes=[("2025-03-21", "MR", "Smallest kid on the floor and the first one back on defence."),
             ("2026-08-14", "MR", "Runs the U12 warm-up now without being asked. Moves up to U14 in summer.")]),
 dict(k="eli", n="Eli Novak", g="M", dob="2016-02-11", sub="Revesby", gd=("Petra Novak", "Mother"), no=11, pos="Forward",
      joined="2025-10-10", src="School clinic", prior="None", p=(.66, .74), rules=[("2026-08-01", "2026-09-30", .6)], photo=True, owe=0,
      summer=("Registered", "2026-09-19"),
      notes=[("2026-03-06", "MR", "Good hands for his age. Needs to stop fading away on every shot.")]),
 dict(k="kai", n="Kai Mansour", g="M", dob="2015-09-30", sub="Greenacre", gd=("Sara Mansour", "Mother"), no=9, pos="Centre",
      joined="2026-04-18", src="Instagram", prior="Park / social", p=(.9, .8), rules=[("2026-08-21", "2026-09-30", "001010")],
      photo=False, owe=120, summer=("Not yet", None),
      notes=[("2026-06-05", "MR", "Strong first month. Big body, rebounds everything."),
             ("2026-09-04", "MR", "Missed four of the last six. Sara says school sport clashes on Fridays. Follow up.")]),
 dict(k="leo", n="Leo Tran", g="M", dob="2016-05-19", sub="Bankstown", gd=("Anh Tran", "Father"), no=3, pos="Guard",
      joined="2025-04-26", src="School clinic", prior="None", p=(.74, .8), rules=[("2026-08-01", "2026-09-30", .45)], photo=True, owe=0,
      summer=("Registered", "2026-09-23"),
      notes=[("2025-11-28", "MR", "Quick first step. Passes up open shots, wants to give it away."),
             ("2026-09-11", "MR", "Attendance dipped late in the season. Still one of the better decision makers.")]),
 dict(k="yusuf", n="Yusuf Kaya", g="M", dob="2013-11-03", sub="Yagoona", gd=("Deniz Kaya", "Father"), no=12, pos="Forward",
      joined="2024-05-01", src="Launch day", prior="Another club, 2 seasons", p=(.84, .82), tour=True, photo=True, owe=120,
      summer=("Not yet", None),
      notes=[("2024-09-06", "MR", "Came from another club already running a proper pick and roll."),
             ("2026-07-24", "DN", "Most consistent player in the squad. No summer registration yet, call Deniz.")]),
 dict(k="marco", n="Marco Bianchi", g="M", dob="2013-01-27", sub="Condell Park", gd=("Gina Bianchi", "Mother"), no=5, pos="Guard",
      joined="2024-09-02", src="Instagram", prior="School team", p=(.55, .72), tour=True, photo=True, owe=0, summer=("Registered", "2026-09-14"),
      notes=[("2025-07-18", "DN", "Played well in Japan. Handles pressure better than most U14s."),
             ("2026-08-28", "DN", "Starting to talk on defence. Next step is calling plays.")]),
 dict(k="adam", n="Adam Rahal", g="M", dob="2014-07-08", sub="Bass Hill", gd=("Nadia Rahal", "Mother"), no=8, pos="Centre",
      joined="2026-02-10", src="Referral", ref="zayd", prior="None", p=(.66, .55), rules=[("2026-09-04", "2026-09-30", 0.0)],
      photo=True, owe=120, summer=("Not yet", None),
      notes=[("2026-05-22", "DN", "Came in through Zayd. Raw, but tall and keen."),
             ("2026-09-18", "DN", "Three missed Fridays in a row. Nadia mentioned transport.")]),
 dict(k="bilal", n="Bilal Aziz", g="M", dob="2013-05-21", sub="Chester Hill", gd=("Hana Aziz", "Mother"), no=6, pos="Forward",
      joined="2025-05-05", src="Another club", prior="Another club, 3 seasons", p=(.84, .72), rules=[("2026-07-17", "2026-09-30", .15)],
      med=True, photo=True, owe=40, summer=("Not yet", None),
      notes=[("2025-06-20", "DN", "Good footwork from his old club. Settled in quickly."),
             ("2026-09-11", "DN", "Missed most of the last two months. Not injured as far as we know. Needs a call.")]),
 dict(k="jordan", n="Jordan Lee", g="M", dob="2011-08-14", sub="Revesby", gd=("Grace Lee", "Mother"), no=23, pos="Guard",
      joined="2024-05-03", src="Launch day", prior="School team", p=(.76, .88), tour=True, photo=True, owe=0, summer=("Registered", "2026-09-10"),
      notes=[("2025-07-18", "SE", "Led the group in Japan. Other parents asked who he trains with."),
             ("2026-09-04", "SE", "Captain material. Moves to U18 in summer, keep him with this group if we can.")]),
 dict(k="sami", n="Sami Haddad", g="M", dob="2012-02-09", sub="Belmore", gd=("Rami Haddad", "Father"), no=15, pos="Forward",
      joined="2024-10-12", src="Referral", ref="jordan", prior="Park / social", p=(.42, .55), tour=True, photo=True, owe=0,
      summer=("Registered", "2026-09-16"),
      notes=[("2025-02-14", "DN", "Park player learning to play inside a system. Big improvement since October.")]),
 dict(k="ryan", n="Ryan Cole", g="M", dob="2011-04-22", sub="Padstow", gd=("Kerry Cole", "Mother"), no=2, pos="Guard",
      joined="2025-10-03", src="Instagram", prior="Another club, 1 season", p=(.74, .5), rules=[("2026-06-13", "2026-09-30", 0.0)],
      photo=True, owe=120, summer=("Not yet", None),
      notes=[("2025-11-14", "SE", "Good shooter. Quiet."),
             ("2026-07-10", "SE", "Last attended 12 June. Two messages to Kerry, no reply.")]),
 dict(k="noah", n="Noah Khoury", g="M", dob="2011-12-01", sub="Greenacre", gd=("Joseph Khoury", "Father"), no=14, pos="Centre",
      joined="2025-02-07", src="School clinic", prior="School team", p=(.6, .7), photo=True, owe=0, summer=("Registered", "2026-09-18"),
      notes=[("2026-05-29", "SE", "Reliable. Sets proper screens, which nobody else in U16 does.")]),
 dict(k="isaac", n="Isaac Tupou", g="M", dob="2012-06-17", sub="Bankstown", gd=("Mele Tupou", "Mother"), no=31, pos="Forward",
      joined="2026-07-20", src="Referral", ref="deng", prior="Rugby league", p=(.92, .92), photo=True, owe=0, summer=("Registered", "2026-09-20"),
      notes=[("2026-08-07", "SE", "Rugby league kid, first basketball season. Already our best offensive rebounder.")]),
 dict(k="malik", n="Malik Turner", g="M", dob="2009-03-05", sub="Bankstown", gd=("Denise Turner", "Mother"), no=21, pos="Guard",
      joined="2024-05-03", src="Launch day", prior="Another club, 4 seasons", p=(.88, .92), tour=True, photo=True, owe=0,
      summer=("Registered", "2026-09-15"),
      notes=[("2025-07-18", "TO", "Best player on the Japan tour."),
             ("2026-09-18", "TO", "Turns 18 next year and wants to stay. Talk to him about U21 Saturdays and helping with the U12s.")]),
 dict(k="deng", n="Deng Akol", g="M", dob="2010-01-11", sub="Lakemba", gd=("Achol Akol", "Mother"), no=10, pos="Centre",
      joined="2025-05-02", src="School clinic", prior="None", p=(.6, .74), tour=True, photo=True, owe=60, summer=("Registered", "2026-09-22"),
      notes=[("2026-03-20", "TO", "Rim protector. Free throws are what's holding him back.")]),
 dict(k="cody", n="Cody Walsh", g="M", dob="2009-07-29", sub="Padstow", gd=("Tracey Walsh", "Mother"), no=0, pos="Forward",
      joined="2025-10-17", src="Another club", prior="Another club, 5 seasons", p=(.8, .66), photo=True, owe=0, summer=("Not yet", None),
      notes=[("2026-06-26", "TO", "Five seasons elsewhere before us. Undecided about U21.")]),
 dict(k="faisal", n="Faisal Omar", g="M", dob="2010-04-15", sub="Punchbowl", gd=("Samira Omar", "Mother"), no=33, pos="Guard",
      joined="2026-05-01", src="Instagram", prior="Park / social", p=(.5, .5), rules=[("2026-05-01", "2026-09-30", "10")],
      photo=False, owe=120, summer=("Not yet", None),
      notes=[("2026-07-31", "TO", "Found us on Instagram. Comes about every second week.")]),
 dict(k="maya", n="Maya Khalil", g="F", dob="2013-02-18", sub="Greenacre", gd=("Rola Khalil", "Mother"), no=9, pos="Guard",
      joined="2025-04-28", src="Instagram", prior="School team", p=(.86, .9), tour=True, photo=True, owe=0, summer=("Registered", "2026-09-09"),
      notes=[("2025-09-05", "RS", "Natural leader. Captain for summer."),
             ("2026-09-25", "RS", "Carried the team to the semi. Moves up to U16 girls next season.")]),
 dict(k="aaliyah", n="Aaliyah Brooks", g="F", dob="2014-06-03", sub="Bankstown", gd=("Kim Brooks", "Mother"), no=4, pos="Forward",
      joined="2025-10-24", src="Referral", ref="maya", prior="Netball", p=(.74, .8), photo=True, owe=0, summer=("Registered", "2026-09-17"),
      notes=[("2026-02-20", "RS", "Netball background shows. Great with the ball in the air, footwork is still netball.")]),
 dict(k="sienna", n="Sienna Vu", g="F", dob="2014-09-12", sub="Yagoona", gd=("Linh Vu", "Mother"), no=12, pos="Guard",
      joined="2026-02-06", src="School clinic", prior="None", p=(.74, .6), rules=[("2026-07-18", "2026-09-30", .4)], photo=True, owe=0,
      summer=("Not yet", None),
      notes=[("2026-08-21", "RS", "Shy but improving. Attendance slipping since the school holidays.")]),
 dict(k="zara", n="Zara Ahmed", g="F", dob="2013-10-01", sub="Lakemba", gd=("Farah Ahmed", "Mother"), no=7, pos="Centre",
      joined="2025-05-09", src="Referral", ref="maya", prior="Park / social", p=(.6, .72), med=True, photo=True, owe=0,
      summer=("Registered", "2026-09-19"),
      notes=[("2026-06-19", "RS", "Strongest defender in the girls group.")]),
 dict(k="tahlia", n="Tahlia Moana", g="F", dob="2014-03-22", sub="Bankstown", gd=("Leilani Moana", "Mother"), no=15, pos="Forward",
      joined="2026-05-08", src="Instagram", prior="Touch football", p=(.84, .9), photo=True, owe=0, summer=("Registered", "2026-09-24"),
      notes=[("2026-07-03", "RS", "Touch football background. Fast, fearless, still learning the rules.")]),
 # registered for the summer tryout, no sessions yet
 dict(k="hamza", n="Hamza Dib", g="M", dob="2015-11-08", sub="Condell Park", gd=("Khaled Dib", "Father"), no=None, pos=None,
      joined="2026-09-22", src="Instagram", prior="None", p=(0, 0), photo=True, owe=0, summer=("Registered", "2026-09-22"), notes=[]),
 dict(k="layla", n="Layla Nasser", g="F", dob="2016-01-15", sub="Punchbowl", gd=("Mona Nasser", "Mother"), no=None, pos=None,
      joined="2026-09-24", src="Referral", ref="omar", prior="None", p=(0, 0), photo=True, owe=0, summer=("Registered", "2026-09-24"), notes=[]),
 # former players
 dict(k="josh", n="Josh Pereira", g="M", dob="2010-02-02", sub="Revesby", gd=("Ana Pereira", "Mother"), no=13, pos="Forward",
      joined="2024-05-03", src="Launch day", prior="School team", p=(.8, .78), left=("2025-03-28", "Moved to Newcastle"), photo=True,
      notes=[("2025-03-14", "SE", "Family moving to Newcastle after this season.")]),
 dict(k="ali", n="Ali Hamdan", g="M", dob="2012-07-07", sub="Wiley Park", gd=("Fatima Hamdan", "Mother"), no=17, pos="Guard",
      joined="2024-10-18", src="Referral", ref="yusuf", prior="None", p=(.62, .3), left=("2025-09-12", "Chose football"), photo=True,
      notes=[("2025-08-22", "DN", "Choosing football next year.")]),
 dict(k="tyler", n="Tyler Graham", g="M", dob="2009-09-09", sub="Panania", gd=("Rob Graham", "Father"), no=22, pos="Forward",
      joined="2024-05-10", src="Another club", prior="Another club, 3 seasons", p=(.82, .8), tour=True, left=("2026-03-27", "Rep program at another club"),
      photo=True, notes=[("2026-03-20", "TO", "Accepted into a rep program elsewhere. Left on good terms.")]),
 dict(k="chloe", n="Chloe Nguyen", g="F", dob="2013-04-04", sub="Bankstown", gd=("Thu Nguyen", "Mother"), no=11, pos="Guard",
      joined="2025-05-02", src="School clinic", prior="None", p=(.72, .6), left=("2026-03-27", "Study commitments"), photo=True,
      notes=[("2026-03-20", "RS", "Stepping back for study. Might come back for winter.")]),
 dict(k="mustafa", n="Mustafa Ali", g="M", dob="2014-12-12", sub="Punchbowl", gd=("Rasha Ali", "Mother"), no=19, pos="Centre",
      joined="2025-10-17", src="Instagram", prior="Park / social", p=(.7, .5), rules=[("2026-03-01", "2026-03-31", 0.0)],
      left=("2026-03-27", "No reason given"), photo=True,
      notes=[("2026-03-13", "DN", "Stopped coming after February. No reply from the family.")]),
]


def rng_for(key):
    return random.Random(int(hashlib.sha1(key.encode()).hexdigest()[:12], 16))


def age_group(dob, y, g):
    a = y - D(dob).year
    grp = "U12" if a <= 11 else "U14" if a <= 13 else "U16" if a <= 15 else "U18" if a <= 17 else "U21"
    return grp + ("G" if g == "F" and grp != "U21" else "")


def attendance(p):
    r = rng_for(p["k"])
    joined = D(p["joined"])
    left = D(p["left"][0]) if p.get("left") else None
    elig = [i for i, s in enumerate(schedule)
            if D(s["d"]) >= joined and (left is None or D(s["d"]) <= left)
            and (s["t"] != "J" or p.get("tour"))]
    out = ["."] * len(schedule)
    if p["p"] == (0, 0):  # registered, not started yet
        return "".join(out)
    n = len(elig)
    pat_pos = {}
    for j, i in enumerate(elig):
        s = schedule[i]; d = D(s["d"])
        prob = p["p"][0] + (p["p"][1] - p["p"][0]) * (j / max(1, n - 1))
        val = None
        for a, b, v in p.get("rules", []):
            if D(a) <= d <= D(b):
                if isinstance(v, str):
                    c = pat_pos.get(a, 0); val = v[c % len(v)] == "1"; pat_pos[a] = c + 1
                else:
                    prob = v
        if s["t"] == "J":
            val = True
        if val is None:
            val = r.random() < prob
        out[i] = "1" if val else "0"
    # a first session is always attended, otherwise they never really joined
    if elig:
        out[elig[0]] = "1"
    return "".join(out)


def reviews(p, att):
    """End-of-season coach ratings for skills unlocked at the time."""
    r = rng_for(p["k"] + "rv")
    start = {"None": 1.4, "Park / social": 1.9, "School team": 2.2, "Netball": 1.9, "Rugby league": 1.8,
             "Touch football": 1.9}.get(p["prior"], 2.7)
    unlock = {"ball": 5, "shoot": 5, "team": 5, "def": 12, "iq": 22}
    cur = {k: start + r.uniform(-.4, .5) for k in unlock}
    out, count = [], 0
    for k, n, y, a, b, br in SEASONS:
        idx = [i for i, s in enumerate(schedule) if s["s"] == k]
        count += sum(1 for i in idx if att[i] == "1")
        if not any(att[i] in "01" for i in idx):
            continue
        rv_date = (b + timedelta(days=3)).isoformat()
        if D(rv_date) > TODAY:
            rv_date = TODAY.isoformat()
        if count < 5:
            continue
        rate = sum(1 for i in idx if att[i] == "1") / max(1, sum(1 for i in idx if att[i] in "01"))
        row = []
        for sk in ["ball", "shoot", "team", "def", "iq"]:
            if count >= unlock[sk]:
                cur[sk] = min(5, cur[sk] + .15 + .55 * rate + r.uniform(-.2, .25))
                row.append(max(1, min(5, round(cur[sk]))))
            else:
                row.append(0)
        out.append({"d": rv_date, "s": k, "r": row})
    return out


players = []
for p in P:
    att = attendance(p)
    rec = {
        "k": p["k"], "n": p["n"], "g": p["g"], "dob": p["dob"], "sub": p["sub"],
        "gd": {"n": p["gd"][0], "rel": p["gd"][1]}, "ph": str(rng_for(p["k"] + "ph").randint(100, 999)),
        "no": p["no"], "pos": p["pos"], "joined": p["joined"], "src": p["src"], "ref": p.get("ref"),
        "prior": p["prior"], "med": bool(p.get("med")), "photo": p.get("photo", True), "owe": p.get("owe", 0),
        "summer": {"st": p["summer"][0], "d": p["summer"][1]} if p.get("summer") else None,
        "tour": bool(p.get("tour")), "left": {"d": p["left"][0], "why": p["left"][1]} if p.get("left") else None,
        "att": att, "rv": reviews(p, att),
        "notes": [{"d": d, "by": by, "t": t} for d, by, t in p.get("notes", [])],
    }
    players.append(rec)

# player IDs by join order within join year
for yr in sorted({p["joined"][:4] for p in players}):
    same = sorted([p for p in players if p["joined"][:4] == yr], key=lambda p: (p["joined"], p["n"]))
    for i, p in enumerate(same, 1):
        p["id"] = f"SWS-{yr[2:]}{i:02d}"

data = {
    "generated": TODAY.isoformat(), "today": TODAY.isoformat(),
    "seasons": [{"k": k, "n": n, "y": y, "from": a.isoformat(), "to": b.isoformat()} for k, n, y, a, b, br in SEASONS],
    "next": {"k": NEXT[0], "n": NEXT[1], "y": NEXT[2], "from": NEXT[3].isoformat(), "tryout": "2026-10-03"},
    "schedule": schedule, "future": future, "coaches": COACHES, "finish": FINISH, "players": players,
}
out = Path(__file__).resolve().parent.parent / "southwest-sonics-app" / "dash-data.js"
out.write_text("/* Synthetic test data. Generated by tools/sonics_test_data.py. No real people. */\nwindow.SWS=" +
               json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")

# summary for checking the story holds up
LV = [(0, "Rookie"), (5, "Starter"), (12, "Hooper"), (22, "Bucket"), (35, "OG"), (50, "UNK")]
for p in players:
    s = p["att"].count("1"); lv = [n for a, n in LV if s >= a][-1]
    last10 = [c for c in p["att"] if c in "01"][-10:]
    print(f'{p["id"]} {p["n"]:<15} {age_group(p["dob"], 2026, p["g"]):<5} -> {age_group(p["dob"], 2027, p["g"]):<5} '
          f'sess {s:>3} {lv:<7} last10 {"".join(last10):<10} {"LEFT" if p["left"] else ""}')
print(len(schedule), "sessions,", len(future), "future Fridays,", out.stat().st_size, "bytes")
