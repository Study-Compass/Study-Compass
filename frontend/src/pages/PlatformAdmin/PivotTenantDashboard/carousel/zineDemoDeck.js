/**
 * The reference issue, deck-shaped.
 *
 * Identical content to the concept deck, expressed as a PivotCarouselDeck
 * document. It is example data for the editor, not server content: the seed
 * button POSTs this exact object, so nothing here is duplicated on the backend.
 *
 * Cover images are `asset:<name>` tokens rather than URLs, because a document
 * cannot know webpack's hashed asset paths. zineDeck.js resolves them; decks
 * built in the editor carry ordinary URLs and never hit that path.
 *
 * Generated from the original concept data — do not hand-edit; edit a real
 * deck in the editor instead.
 */

export const ZINE_DEMO_DECK = {
  "title": "issue 014 — oakland",
  "batchWeek": null,
  "edition": "night",
  "issue": {
    "number": "014",
    "city": "oakland",
    "dateline": "thu 05 sep",
    "week": "week of 01–07 sep",
    "scanned": "214"
  },
  "voice": {
    "entries": {},
    "tokens": {}
  },
  "slides": [
    {
      "type": "cover",
      "values": {
        "name": "sorry u missed it",
        "tagline": "everything that happened while you were home",
        "caption": "above: basement set: dj oyinbo, warehouse off 14th"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "basement set: dj oyinbo",
            "host": "nadine + the 14th st crew",
            "whenLabel": "11:00 pm",
            "location": "warehouse off 14th",
            "image": "asset:court"
          },
          "values": {}
        }
      ]
    },
    {
      "type": "wall",
      "values": {
        "title": "the wall",
        "kicker": "four of seven"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "free throw contest",
            "host": "mosswood rec",
            "whenLabel": "6:00 pm",
            "location": "mosswood park",
            "image": "asset:meadow"
          },
          "values": {
            "tags": [
              "free",
              "all ages"
            ]
          }
        },
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "16mm shorts + q&a",
            "host": "the new parkway",
            "whenLabel": "7:30 pm",
            "location": "474 24th st",
            "image": "asset:canopy"
          },
          "values": {
            "tags": [
              "actual film",
              "q&a after"
            ]
          }
        },
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "night market on 8th",
            "host": "chinatown merchants assoc.",
            "whenLabel": "5:00 pm",
            "location": "8th & webster",
            "image": "asset:coast"
          },
          "values": {
            "tags": [
              "cash only",
              "kids everywhere"
            ]
          }
        },
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "blitz chess, lakeside",
            "host": "lake merritt irregulars",
            "whenLabel": "4:00 pm",
            "location": "lake merritt pergola",
            "image": "asset:dandelions"
          },
          "values": {
            "tags": [
              "free",
              "bring a board"
            ]
          }
        }
      ]
    },
    {
      "type": "card",
      "values": {
        "slug": "last night"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "basement set: dj oyinbo",
            "host": "nadine + the 14th st crew",
            "whenLabel": "11:00 pm",
            "location": "warehouse off 14th",
            "image": "asset:court"
          },
          "values": {
            "tags": [
              "no phones",
              "cash at the door",
              "forty people"
            ],
            "note": "sold out in six minutes. you were not on the list."
          }
        }
      ]
    },
    {
      "type": "notice",
      "values": {
        "slug": "in absentia",
        "cut": "you, not here"
      },
      "options": {
        "knockoutShape": 1
      },
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "basement set: dj oyinbo",
            "host": "nadine + the 14th st crew",
            "whenLabel": "11:00 pm",
            "location": "warehouse off 14th",
            "image": "asset:court"
          },
          "values": {
            "tags": [
              "no phones",
              "cash at the door",
              "forty people"
            ],
            "note": "sold out in six minutes. you were not on the list."
          }
        }
      ]
    },
    {
      "type": "dispatch",
      "values": {
        "slug": "dispatch",
        "insteadLabel": "meanwhile"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "basement set: dj oyinbo",
            "host": "nadine + the 14th st crew",
            "whenLabel": "11:00 pm",
            "location": "warehouse off 14th",
            "image": "asset:court"
          },
          "values": {
            "tags": [
              "no phones",
              "cash at the door",
              "forty people"
            ],
            "runOfShow": [
              {
                "t": "11:00",
                "what": "doors. thirty people, all standing at the back"
              },
              {
                "t": "12:10",
                "what": "the room turned. nobody decided to, it just did"
              },
              {
                "t": "01:35",
                "what": "someone rolled the loading door up for air"
              },
              {
                "t": "02:20",
                "what": "last record. no encore, no lights up"
              }
            ],
            "scene": "The PA was a house system in a room with no treatment, so the bass got to you through the floor before it got to you through the air. A guy at the door asked people not to film and — this almost never happens — everyone just didn’t.",
            "instead": "you were asleep by eleven-thirty"
          }
        }
      ]
    },
    {
      "type": "notice",
      "values": {
        "slug": "in absentia",
        "cut": "you, not here"
      },
      "options": {
        "knockoutShape": 2
      },
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "night market on 8th",
            "host": "chinatown merchants assoc.",
            "whenLabel": "5:00 pm",
            "location": "8th & webster",
            "image": "asset:coast"
          },
          "values": {
            "tags": [
              "cash only",
              "kids everywhere",
              "ran late"
            ],
            "note": "ran four hours longer than posted."
          }
        }
      ]
    },
    {
      "type": "dispatch",
      "values": {
        "slug": "dispatch",
        "insteadLabel": "meanwhile"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "last call listening party",
            "host": "roof at the kapor",
            "whenLabel": "9:00 pm",
            "location": "uptown rooftop",
            "image": null
          },
          "values": {
            "tags": [
              "no talking",
              "one album",
              "byo"
            ],
            "runOfShow": [
              {
                "t": "21:00",
                "what": "forty people sit down on a roof"
              },
              {
                "t": "21:04",
                "what": "side a. the talking stops on its own"
              },
              {
                "t": "21:38",
                "what": "side b, twice, by unanimous non-verbal agreement"
              },
              {
                "t": "22:30",
                "what": "nobody wants to be the first to leave"
              }
            ],
            "scene": "One album, start to finish, on a roof, with the rule that you do not talk during it. The rule held. Forty adults sat in the cold and listened to a record the way you did when you were fifteen.",
            "instead": "you had this album on in the background, doing something else"
          }
        }
      ]
    },
    {
      "type": "card",
      "values": {
        "slug": "last night"
      },
      "options": {},
      "events": [
        {
          "eventId": null,
          "label": null,
          "snapshot": {
            "name": "blitz chess, lakeside",
            "host": "lake merritt irregulars",
            "whenLabel": "4:00 pm",
            "location": "lake merritt pergola",
            "image": "asset:dandelions"
          },
          "values": {
            "tags": [
              "free",
              "bring a board",
              "eleven years running"
            ],
            "note": "they play every thursday. they have for eleven years."
          }
        }
      ]
    },
    {
      "type": "receipt",
      "values": {
        "footer": "no refunds. it already happened.",
        "stamp": "0 attended"
      },
      "options": {},
      "events": []
    },
    {
      "type": "back",
      "values": {
        "kicker": "this took ninety seconds to read",
        "line": "next thursday you find out on monday",
        "sub": "just go tells you what is on this week, before it is last night.",
        "url": "justgo.lol"
      },
      "options": {},
      "events": []
    }
  ]
};
