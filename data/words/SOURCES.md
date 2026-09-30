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

## 2. Word Frequency & Selection — Norwegian Dependency Treebank (NDT Bokmål) + Exam Topics

- **Resource:** Norwegian Dependency Treebank (NDT) – Norwegian Bokmål (`oai-nb-no-sbr-10`)
- **Catalogue URL:** https://www.nb.no/sprakbanken/en/resource-catalogue/oai-nb-no-sbr-10/
- **Creators / Rights holders:** Nasjonalbiblioteket — Språkbanken (in collaboration with the University of Oslo and the University of Bergen).
- **Licence:** [Creative Commons CC0 1.0 Universal (CC0 1.0 Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/) — dedicated to the public domain; commercial use is unrestricted.
- **What we use:**
  - Lemma frequency distribution across 300,000 lemmatised Norwegian Bokmål tokens, intersected with the seven core *Norskprøve muntlig* (HK-dir) topic areas (`arbeid`, `bolig`, `helse`, `familie`, `handel`, `transport`, `fritid`) to select the first 300 A1–A2 words and 50 oral exam conversation phrases.
- **Attribution (courtesy):**
  > Lemma frequency selection informed by the *Norwegian Dependency Treebank (NDT, Bokmål)* distributed by Nasjonalbiblioteket (Språkbanken) under CC0 1.0.

---

## 3. Original Examples, Cloze Sentences & L1 Translations

- All example sentences (`examples`), fill-in-the-gap context sentences (`cloze`), hints (`hint_ru`, `hint_uk`, `hint_en`), and translations (`ru`, `uk`, `en`) in `data/words/a1-a2.json` and `data/words/phrases.json` are **original material authored for NorskLive Pro** (`status: "draft"`, pending teacher review).
- **No textbook material:** Zero words Lists, dialogues, or example sentences are copied from *På vei*, *Stein på stein*, *Her på berget*, *Ny i Norge*, *God i norsk*, or any third-party coursebook.
