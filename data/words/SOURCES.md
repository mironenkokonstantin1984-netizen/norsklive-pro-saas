# Word Data Sources & Licences (`data/words/`)

This file documents the linguistic data sources, their licences, and required attributions for the «Слова» (`M1f`) vocabulary and phrase datasets (`data/words/a1-a2.json` and `data/words/phrases.json`).

---

## 1. Inflectional Forms & Grammatical Gender — Norsk Ordbank (Norwegian Bokmål 2005)

- **Resource:** Norsk Ordbank – Norwegian Bokmål 2005 (`oai-nb-no-sbr-5`)
- **Catalogue URL:** https://www.nb.no/sprakbanken/en/resource-catalogue/oai-nb-no-sbr-5/
- **Creators / Rights holders:** Språkrådet (The Language Council of Norway) and Universitetet i Bergen (University of Bergen, UiB), distributed by Nasjonalbiblioteket — Språkbanken (The Norwegian Language Bank).
- **Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) — permits commercial and non-commercial use, adaptation, and redistribution with attribution.
- **What we use:**
  - Canonical Bokmål lemmas (`lemma`), parts of speech (`pos`), and grammatical gender (`m`, `f`, `n`).
  - Standard inflectional paradigms (`forms`): noun indefinite/definite singular and plural (`ub_ent`, `be_ent`, `ub_fl`, `be_fl`), verb principal parts (`infinitiv`, `presens`, `preteritum`, `perfektum_partisipp`), and adjective forms (`positiv`, `flertall`, `komparativ`, `superlativ`).
- **Required Attribution:**
  > Contains morphological and lexical data from *Norsk Ordbank – Norwegian Bokmål 2005* by Språkrådet and the University of Bergen, distributed by Nasjonalbiblioteket (Språkbanken) under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.

---

## 2. Word Selection — Norskprøve Exam Topics

- **Method:** The 300 A1–A2 words and 50 oral exam conversation phrases were chosen manually by exam topic, covering the seven core *Norskprøve muntlig* (HK-dir) topic areas (`arbeid`, `bolig`, `helse`, `familie`, `handel`, `transport`, `fritid`). No automated frequency computation was performed.
- **Norwegian Dependency Treebank (NDT)** (`oai-nb-no-sbr-10`, CC0 1.0, distributed by Nasjonalbiblioteket — Språkbanken) was consulted as a reference for typical word usage in written Norwegian Bokmål, but no data from NDT is included in the dataset directly.

---

## 3. Original Examples, Cloze Sentences & L1 Translations

- All example sentences (`examples`), fill-in-the-gap context sentences (`cloze`), hints (`hint_ru`, `hint_uk`, `hint_en`), and translations (`ru`, `uk`, `en`) in `data/words/a1-a2.json` and `data/words/phrases.json` are **original material authored for NorskLive Pro** (`status: "draft"`, pending teacher review).
- **No textbook material:** Zero words Lists, dialogues, or example sentences are copied from *På vei*, *Stein på stein*, *Her på berget*, *Ny i Norge*, *God i norsk*, or any third-party coursebook.
