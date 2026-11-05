# Evidence dovolené 2.0

Jednoduchá webová aplikace pro evidenci dovolené až pro 50 zaměstnanců.

## Novinky verze 2.0

- české státní svátky automaticky zvýrazněné v kalendáři,
- víkendy mají vlastní světle šedou barvu,
- dnešní den má výrazný rámeček,
- tooltip s názvem svátku,
- svátky a víkendy se automaticky NEpočítají do čerpání dovolené,
- roční přehled počítá pouze pracovní dny,
- zachováno lokální ukládání přes localStorage,
- zachován export/import JSON,
- zachován tisk, přidávání a úprava zaměstnanců.

## Spuštění

Stačí otevřít `index.html`.

## GitHub Pages

Nahraj `index.html`, `style.css`, `app.js` a `README.md` do repository a v Settings → Pages nastav:

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

## Uložení dat

Aplikace nevyžaduje databázi. Data jsou uložena v prohlížeči zařízení. Pro přenos nebo zálohu použijte Nastavení → Exportovat data do JSON.
