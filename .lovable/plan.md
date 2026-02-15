

# CRM Circular Risk Intelligence System (CRIS)

## Visione
Piattaforma enterprise di governance del rischio strutturale per materie prime critiche, con design dark-theme stile Bloomberg, che integra criticality assessment, simulazione strategica, motore finanziario e dashboard executive.

---

## Fase 1 — Fondamenta e Autenticazione

### Design System & Layout
- Tema dark enterprise con palette scura (navy/charcoal), accent colors ciano/ambra per alert e stati critici
- Layout a sidebar con navigazione modulare tra i moduli principali
- Componenti base: card metriche, tabelle dati, grafici interattivi

### Autenticazione e Ruoli
- Login/registrazione con Supabase Auth
- Tre ruoli: **Admin**, **Analyst**, **Executive**
- Admin: gestione completa dati, utenti e configurazioni
- Analyst: upload BOM, simulazioni, analisi
- Executive: dashboard read-only con KPI e alert

---

## Fase 2 — Database CRM & Criticality Assessment

### Database Materie Prime Critiche
- Tabella materiali con: nome, Yale Final Criticality Score (0-100), classificazione EU CRM (SR × EI), HHI, tasso di riciclo, indicatori geopolitici, punteggi ESG fornitori
- Dataset demo precaricato con ~30 materiali critici realistici (litio, cobalto, terre rare, ecc.)
- CRUD completo per gestione materiali e fornitori

### Motore di Classificazione Automatica
- Soglie automatiche: Yale ≥ 60 = alta esposizione sistemica; Critical Quadrant UE = rilevanza regolatoria
- Segmentazione in 4 cluster:
  - **Systemic Dual Exposure** (alto Yale + EU Critical Quadrant)
  - **Product-Embedded Criticality** (alto impatto prodotto, medio rischio sistemico)
  - **Sectoral Strategic Exposure** (rilevanza settoriale elevata)
  - **Operational Backbone** (basso rischio, alta dipendenza operativa)
- Matrice 2D interattiva con posizionamento materiali nei cluster

---

## Fase 3 — BOM Upload & Risk Analysis

### Upload Bill of Materials
- Upload CSV con colonne: prodotto, materiale, grammi, prezzo €/kg
- Parsing e validazione automatica del file
- Associazione automatica ai materiali nel database CRM

### Analisi di Esposizione
- Heatmap interattiva di esposizione per prodotto (materiale × criticità × quantità × valore)
- Ranking vulnerabilità per ECU/prodotto
- Calcolo concentrazione rischio per divisione e linea di prodotto

---

## Fase 4 — Simulazione Strategica

### Scenari What-If
- Modellazione scenari configurabili:
  - Incremento tasso di riciclo (slider %)
  - Riduzione HHI tramite diversificazione fornitori
  - Implementazione blockchain per tracciabilità
  - Co-investimento in recovery hub regionali
  - Introduzione sistemi robotici di disassemblaggio
- Ricalcolo in tempo reale di: variazione rischio, spostamento cluster, riduzione dipendenza da estrazione primaria, impatto KPI ESG
- Confronto side-by-side tra scenario base e scenari alternativi

---

## Fase 5 — Motore Finanziario

### Input Parametri
- Form per: CAPEX, OPEX, capacità annua processamento, valore recuperabile per unità, tasso di sconto

### Calcoli Automatici
- Avoided procurement cost
- Payback period
- Net Present Value (NPV)
- Internal Rate of Return (IRR)
- Analisi di sensitività (tabella/grafico con variazioni parametri)
- Stress test geopolitici (simulazione shock su forniture)

### Visualizzazione
- Dashboard comparativa con grafici dinamici per scenario
- Tabelle waterfall per breakdown costi/benefici

---

## Fase 6 — Dashboard Executive

### Mappa Globale
- Mappa mondiale con esposizione CRM per paese di origine dei materiali
- Indicatori di concentrazione geografica e rischio geopolitico

### KPI e Monitoraggio
- Distribuzione cluster per divisione/prodotto
- Dipendenza geografica aggregata
- Monitoraggio volatilità prezzi (trend temporali)
- KPI di recovery circolare (% materiale recuperato, target vs actual)

### Sistema Alert
- Notifiche automatiche al superamento di soglie critiche (Yale, HHI, prezzo, concentrazione)
- Log alert con storico e azioni intraprese

