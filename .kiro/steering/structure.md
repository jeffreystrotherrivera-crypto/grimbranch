# GrimBranch — Structure Steering

```
.
├── index.html            # page shell: Play / Map / Workshop views
├── styles.css            # candlelit gothic theme
├── story.js              # built-in story text (Twee-style) + format docs
├── validator.js          # parser + validator (browser and Node)
├── app.js                # UI logic, map rendering, narration
├── tests/
│   └── validator.test.mjs  # Node test suite for parser + validator
├── screenshots/          # Devpost gallery images
├── demo/                 # demo-video capture scripts and final video
├── .kiro/
│   ├── steering/         # product.md, tech.md, structure.md
│   ├── specs/grimbranch/ # requirements.md, design.md, tasks.md
│   └── hooks/            # agent hook definitions (JSON)
├── FORM-ANSWERS.md       # drafted Devpost submission answers
├── LICENSE               # MIT
└── README.md
```

Rules:

- The `.kiro` directory is part of the product. Never gitignore it.
- Keep the app dependency-free. If a feature seems to need a library, write
  the small version of it instead.
- Tests live in `tests/` and run with plain `node`, no test framework.
