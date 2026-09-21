// Server-only fallback vocabulary. Your private custom vocabulary should be supplied
// through the PLANET_VOCAB_JSON Vercel environment variable instead of being
// committed to the public repository.
export const FALLBACK_VOCABULARY = {
  sun: {
    people: ['leader','authority figure'],
    events: ['recognition','visibility','decision'],
    qualities: ['confidence','clarity','focus'],
    places: ['public place','center of activity'],
    objects: ['light','display']
  },
  moon: {
    people: ['family member','caretaker'],
    events: ['change of mood','public activity','home concern'],
    qualities: ['sensitivity','adaptation','memory'],
    places: ['home','food place','waterside'],
    objects: ['water','food']
  },
  mercury: {
    people: ['messenger','student','merchant'],
    events: ['conversation','message','short trip','transaction'],
    qualities: ['speed','curiosity','analysis'],
    places: ['shop','school','office','transit stop'],
    objects: ['phone','document','vehicle']
  },
  venus: {
    people: ['partner','artist','friend'],
    events: ['social contact','agreement','attraction','purchase'],
    qualities: ['harmony','beauty','comfort'],
    places: ['restaurant','art venue','shop'],
    objects: ['jewelry','clothing','decor']
  },
  mars: {
    people: ['athlete','mechanic','worker'],
    events: ['competition','argument','rapid movement','physical effort'],
    qualities: ['urgency','heat','courage','force'],
    places: ['gym','workshop','construction area'],
    objects: ['tools','machinery','metal']
  },
  jupiter: {
    people: ['teacher','advisor','mentor'],
    events: ['learning','opportunity','expansion','guidance'],
    qualities: ['optimism','growth','generosity'],
    places: ['school','court','religious place'],
    objects: ['book','certificate']
  },
  saturn: {
    people: ['elder','manager','official'],
    events: ['delay','restriction','duty','repair'],
    qualities: ['patience','discipline','caution'],
    places: ['government building','industrial area'],
    objects: ['barrier','structure','clock']
  },
  uranus: {
    people: ['innovator','outsider'],
    events: ['surprise','disruption','technical change'],
    qualities: ['independence','instability','novelty'],
    places: ['technology venue'],
    objects: ['electronics','network equipment']
  },
  neptune: {
    people: ['artist','healer'],
    events: ['confusion','inspiration','misdirection'],
    qualities: ['imagination','uncertainty','sensitivity'],
    places: ['waterside','cinema','retreat'],
    objects: ['camera','music','liquid']
  },
  pluto: {
    people: ['investigator','powerful figure'],
    events: ['intense encounter','hidden issue','major change'],
    qualities: ['intensity','focus','transformation'],
    places: ['restricted area','underground place'],
    objects: ['locked container']
  },
  rahu: {
    people: ['stranger','unusual contact'],
    events: ['novel encounter','amplification','unexpected desire'],
    qualities: ['obsession','novelty','ambition'],
    places: ['foreign or unfamiliar place'],
    objects: ['technology','unfamiliar object']
  },
  ketu: {
    people: ['solitary person','specialist'],
    events: ['separation','completion','withdrawal'],
    qualities: ['detachment','precision','disinterest'],
    places: ['quiet place','isolated area'],
    objects: ['old or discarded object']
  }
};
