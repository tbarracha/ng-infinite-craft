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

## Generated things that should not happen:
two names in emoji:
- {"name":"Burning Water","emoji":" água 🔥"} 

merge is the result of the two names:
- {"name":"Aeroplane lava","emoji":"💥"}
- {"name":"Aeroplane+lava","emoji":"💥"}

## TODO:
- [x] Check if emoji already exists
- [x] Clamp element drag and drop
- [ ] Confetti on element merged