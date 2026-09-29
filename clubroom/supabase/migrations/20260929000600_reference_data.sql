-- Sports and their default vocabulary, divisions, skills, levels and badges.
-- Level names and skill names are copied into each club's level_config at
-- signup, where the club can rename them.

insert into public.sports (key, name, sort, vocabulary, default_divisions, default_skills, default_levels, default_badges) values
(
  'basketball', 'Basketball', 10,
  '{"event":"game","events":"games","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"division","divisions":"divisions","team":"team","court":"court","coach":"coach"}',
  '[{"name":"U10","max_age":9},{"name":"U12","min_age":10,"max_age":11},{"name":"U14","min_age":12,"max_age":13},{"name":"U16","min_age":14,"max_age":15},{"name":"U18","min_age":16,"max_age":17}]',
  '[{"key":"ball","name":"Ball handling","unlock_at":5,"blurb":"Control under pressure, both hands"},
    {"key":"shoot","name":"Shooting","unlock_at":5,"blurb":"Form, range and consistency"},
    {"key":"team","name":"Teamwork","unlock_at":5,"blurb":"Passing, talking, backing up team-mates"},
    {"key":"def","name":"Defence","unlock_at":12,"blurb":"Stance, effort and help defence"},
    {"key":"iq","name":"Court IQ","unlock_at":22,"blurb":"Reading the game, decisions, spacing"}]',
  '[{"key":"rookie","name":"Rookie","at":0,"tag":"Day one","blurb":"You are in. Name on the roster.","unlocks":"Your profile and the season schedule"},
    {"key":"starter","name":"Starter","at":5,"tag":"Earned a spot","blurb":"Five in. Your coach knows your name and how you move.","unlocks":"Coach starts rating ball handling, shooting and teamwork"},
    {"key":"hooper","name":"Hooper","at":12,"tag":"You can play","blurb":"Twelve in. You are not learning the game any more, you are playing it.","unlocks":"Your defence rating"},
    {"key":"bucket","name":"Bucket","at":22,"tag":"Automatic","blurb":"Twenty-two. Coach looks for you when it matters.","unlocks":"Your court IQ rating and your coach notes"},
    {"key":"og","name":"OG","at":35,"tag":"Respected","blurb":"Thirty-five. The young ones copy your warm-up.","unlocks":"Captain and leadership nominations"},
    {"key":"unk","name":"UNK","at":50,"tag":"Certified","blurb":"Fifty. Everyone at the courts knows exactly who you are.","unlocks":"The club honour board"}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1},"hint":"Turn up once"},
    {"key":"streak5","name":"5 in a row","rule":{"streak":5},"hint":"Five sessions without missing one"},
    {"key":"train10","name":"10 trainings","rule":{"trainings":10},"hint":"Ten trainings this season"},
    {"key":"games5","name":"5 games","rule":{"games":5},"hint":"Play five games"},
    {"key":"month","name":"Perfect month","rule":{"perfect_month":true},"hint":"A full month, nothing missed"},
    {"key":"tour","name":"Tour player","rule":{"manual":true},"hint":"Travel with the club"}]'
),
(
  'netball', 'Netball', 20,
  '{"event":"game","events":"games","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"division","divisions":"divisions","team":"team","court":"court","coach":"coach"}',
  '[{"name":"U9","max_age":8},{"name":"U11","min_age":9,"max_age":10},{"name":"U13","min_age":11,"max_age":12},{"name":"U15","min_age":13,"max_age":14},{"name":"U17","min_age":15,"max_age":16}]',
  '[{"key":"pass","name":"Passing","unlock_at":5},{"key":"foot","name":"Footwork","unlock_at":5},{"key":"team","name":"Teamwork","unlock_at":5},{"key":"def","name":"Defence","unlock_at":12},{"key":"iq","name":"Court craft","unlock_at":22}]',
  '[{"key":"l1","name":"Rookie","at":0},{"key":"l2","name":"Regular","at":5},{"key":"l3","name":"Core","at":12},{"key":"l4","name":"Anchor","at":22},{"key":"l5","name":"Leader","at":35},{"key":"l6","name":"Legend","at":50}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1}},{"key":"streak5","name":"5 in a row","rule":{"streak":5}},{"key":"games5","name":"5 games","rule":{"games":5}}]'
),
(
  'football', 'Football (soccer)', 30,
  '{"event":"match","events":"matches","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"age group","divisions":"age groups","team":"team","court":"pitch","coach":"coach"}',
  '[{"name":"U8","max_age":7},{"name":"U10","min_age":8,"max_age":9},{"name":"U12","min_age":10,"max_age":11},{"name":"U14","min_age":12,"max_age":13},{"name":"U16","min_age":14,"max_age":15},{"name":"U18","min_age":16,"max_age":17}]',
  '[{"key":"touch","name":"First touch","unlock_at":5},{"key":"pass","name":"Passing","unlock_at":5},{"key":"team","name":"Teamwork","unlock_at":5},{"key":"def","name":"Defending","unlock_at":12},{"key":"iq","name":"Game sense","unlock_at":22}]',
  '[{"key":"l1","name":"Rookie","at":0},{"key":"l2","name":"Regular","at":5},{"key":"l3","name":"Core","at":12},{"key":"l4","name":"Anchor","at":22},{"key":"l5","name":"Leader","at":35},{"key":"l6","name":"Legend","at":50}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1}},{"key":"streak5","name":"5 in a row","rule":{"streak":5}},{"key":"games5","name":"5 matches","rule":{"games":5}}]'
),
(
  'rugby_league', 'Rugby league', 40,
  '{"event":"game","events":"games","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"age group","divisions":"age groups","team":"team","court":"field","coach":"coach"}',
  '[{"name":"U6","max_age":5},{"name":"U8","min_age":6,"max_age":7},{"name":"U10","min_age":8,"max_age":9},{"name":"U12","min_age":10,"max_age":11},{"name":"U14","min_age":12,"max_age":13},{"name":"U16","min_age":14,"max_age":15}]',
  '[{"key":"catch","name":"Catch and pass","unlock_at":5},{"key":"tackle","name":"Tackle technique","unlock_at":5},{"key":"team","name":"Teamwork","unlock_at":5},{"key":"def","name":"Defensive line","unlock_at":12},{"key":"iq","name":"Game sense","unlock_at":22}]',
  '[{"key":"l1","name":"Rookie","at":0},{"key":"l2","name":"Regular","at":5},{"key":"l3","name":"Core","at":12},{"key":"l4","name":"Anchor","at":22},{"key":"l5","name":"Leader","at":35},{"key":"l6","name":"Legend","at":50}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1}},{"key":"streak5","name":"5 in a row","rule":{"streak":5}},{"key":"games5","name":"5 games","rule":{"games":5}}]'
),
(
  'afl', 'Australian rules', 50,
  '{"event":"game","events":"games","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"age group","divisions":"age groups","team":"team","court":"oval","coach":"coach"}',
  '[{"name":"U9","max_age":8},{"name":"U11","min_age":9,"max_age":10},{"name":"U13","min_age":11,"max_age":12},{"name":"U15","min_age":13,"max_age":14},{"name":"U17","min_age":15,"max_age":16}]',
  '[{"key":"kick","name":"Kicking","unlock_at":5},{"key":"mark","name":"Marking","unlock_at":5},{"key":"team","name":"Teamwork","unlock_at":5},{"key":"def","name":"Defensive pressure","unlock_at":12},{"key":"iq","name":"Game sense","unlock_at":22}]',
  '[{"key":"l1","name":"Rookie","at":0},{"key":"l2","name":"Regular","at":5},{"key":"l3","name":"Core","at":12},{"key":"l4","name":"Anchor","at":22},{"key":"l5","name":"Leader","at":35},{"key":"l6","name":"Legend","at":50}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1}},{"key":"streak5","name":"5 in a row","rule":{"streak":5}},{"key":"games5","name":"5 games","rule":{"games":5}}]'
),
(
  'other', 'Other sport', 900,
  '{"event":"game","events":"games","training":"training","trainings":"trainings","session":"session","sessions":"sessions","division":"division","divisions":"divisions","team":"team","court":"venue","coach":"coach"}',
  '[{"name":"U10","max_age":9},{"name":"U12","min_age":10,"max_age":11},{"name":"U14","min_age":12,"max_age":13},{"name":"U16","min_age":14,"max_age":15},{"name":"U18","min_age":16,"max_age":17}]',
  '[{"key":"s1","name":"Skill one","unlock_at":5},{"key":"s2","name":"Skill two","unlock_at":5},{"key":"team","name":"Teamwork","unlock_at":5},{"key":"s4","name":"Skill four","unlock_at":12},{"key":"iq","name":"Game sense","unlock_at":22}]',
  '[{"key":"l1","name":"Rookie","at":0},{"key":"l2","name":"Regular","at":5},{"key":"l3","name":"Core","at":12},{"key":"l4","name":"Anchor","at":22},{"key":"l5","name":"Leader","at":35},{"key":"l6","name":"Legend","at":50}]',
  '[{"key":"first","name":"First session","rule":{"sessions":1}},{"key":"streak5","name":"5 in a row","rule":{"streak":5}}]'
);
