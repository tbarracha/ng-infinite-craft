# Infinite Craft - Angular Edition!
## Project Design Document

# Objectives:
- Have a list of elements
- Drag & Drop elements in canvas
- Elements are merged together when dropped on top of other elements
- New element is created on merge by an LLM (Transformers.js)

---

# Classes:

### Element:
- id
- emoji
- name
- position (x, y)
- canvasId

### Element Canvas:
- Elements []