# Schwarzplan Generator

**TEK TO NIK Architekten** -- Schwarzplaene aus OpenStreetMap-Daten erstellen, anpassen und exportieren.

---

## Was ist ein Schwarzplan?

Ein Schwarzplan (Figure-Ground-Diagramm) zeigt die bebaute Struktur einer Stadt: Gebaeude erscheinen schwarz auf weissem Grund. Er dient in der Architektur und Stadtplanung zur Analyse von Stadtstrukturen, Bebauungsdichten und Freiraeumen.

Diese Anwendung erstellt Schwarzplaene automatisch aus OpenStreetMap-Daten -- fuer jeden Ort weltweit.

## Installation

1. Die Datei `Schwarzplan-Portable.exe` vom Server kopieren:
   ```
   Y:\KI\Software\Schwarzplan-Portable.exe
   ```
2. Die Datei an einen beliebigen Ort auf dem eigenen Rechner ablegen (z. B. Desktop oder einen Projektordner).
3. Doppelklick auf die EXE -- die Anwendung startet sofort. Es ist keine Installation noetig.

## Bedienung

### 1. Ort suchen

Oben links im Suchfeld eine Adresse oder einen Ortsnamen eingeben. Die Karte fliegt automatisch zum Zielort. Alternativ kann die Karte mit der Maus verschoben und mit dem Scrollrad gezoomt werden.

### 2. Massstab und Papierformat waehlen

Vor dem Erfassen den gewuenschten Massstab (z. B. 1:1.000) und das Papierformat (z. B. A2 quer) einstellen. Der rote Rahmen auf der Karte zeigt den Druckbereich.

### 3. Bereich erfassen

Den Button **Bereich erfassen** klicken oder die `Leertaste` druecken. Die Anwendung laedt alle Kartendaten (Gebaeude, Strassen, Gewaesser usw.) fuer den markierten Bereich. Die Karte wird gesperrt, damit sich der Ausschnitt nicht versehentlich verschiebt.

### 4. Ebenen anpassen

Nach dem Erfassen koennen einzelne Ebenen ein- oder ausgeblendet werden:

| Ebene | Inhalt |
|-------|--------|
| Gebaeude | Alle Gebaeudegrundrisse (schwarz) |
| Strassen | Strassen und Wege |
| Gewaesser | Fluesse, Seen, Kanaele |
| Gruenflaechen | Parks, Gaerten, Spielplaetze |
| Wald | Waelder und Gehoelze |
| Eisenbahn | Schienen und Gleise |

### 5. Exportieren

Unter **Export** das gewuenschte Format waehlen:

- **SVG** -- Vektorgrafik, massstabsgetreu druckbar (z. B. fuer Illustrator oder Inkscape)
- **PDF** -- Sofort druckbar im gewaehlten Papierformat
- **DXF** -- Fuer AutoCAD, Vectorworks, ArchiCAD und andere CAD-Programme

Eine Vorschau wird angezeigt. Mit **Exportieren** wird die Datei gespeichert.

### 6. Neuen Ausschnitt waehlen

Den Button **Bereich freigeben** klicken oder die `Leertaste` druecken, um die Karte zu entsperren und einen neuen Ort zu waehlen.

## Tastenkuerzel

| Taste | Funktion |
|-------|----------|
| `Leertaste` | Bereich erfassen / freigeben |
| `Strg + E` | SVG exportieren |
| `Strg + P` | PDF exportieren |

## Kartenstile

Unter **Kartenstil** kann der Hintergrund der Karte geaendert werden (hell, dunkel, klassisch oder ohne). Der Kartenstil beeinflusst nur die Vorschau -- der Export ist immer schwarz-weiss.

## Tipps

- **Massstab zuerst waehlen** -- Der Massstab bestimmt, wie viel Flaeche geladen wird. Bei grossen Massstabszahlen (z. B. 1:2.000) wird ein groesserer Bereich erfasst.
- **Weniger Ebenen = klarerer Plan** -- Fuer einen klassischen Schwarzplan nur die Ebene "Gebaeude" aktivieren.
- **DXF fuer CAD** -- Der DXF-Export erzeugt separate Layer (BUILDINGS, ROADS, WATER usw.), die in CAD-Programmen einzeln bearbeitet werden koennen.
- **Keine Internetverbindung?** -- Die Anwendung benoetigt Internet, um Kartendaten zu laden. Bei Verbindungsproblemen erscheint eine Warnung.

## Datenquelle

Alle Kartendaten stammen von [OpenStreetMap](https://www.openstreetmap.org/) und werden ueber die Overpass API abgerufen. Die Daten sind frei verfuegbar unter der Open Database License (ODbL).

---

**TEK TO NIK Architekten** -- [tektonik.net](https://tektonik.net)
