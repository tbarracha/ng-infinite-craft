# Infinite Craft - Angular Edition!
## Project Design Document

# Objectives:
- Have a list of elements
- Drag & Drop elements in canvas
- Elements are merged together when dropped on top of other elements
- New element is created on merge by an LLM (Transformers.js)
- Save game state
- Continue merging, forever

---

# Classes:

### Element:
- id : number
- name : string
- emoji : string

### Canvas Element:
- canvasId : string
- element : Element
- position : (x, y)

- activeElements : Elements []

## This cannot be generated:
{"name":"Burning Water","emoji":" água 🔥"} -> two names in emoji
{"name":"Aeroplane lava","emoji":"💥"}