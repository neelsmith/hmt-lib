
# HMTLib.js API Documentation

## Overview

`hmtlib.js` is a JavaScript library designed to work with publications from the Homer Multitext project (HMT). It leverages `cex-lib.js` for parsing and manipulating HMT data in CiteEXchange (CEX) format, and `urn-lib.js` for working with CTS and CITE2 URNs. This library provides functions to load HMT data, extract specific datasets like DSE records, scholia, codex information, and retrieve metadata labels.

## Dependencies

This library requires the following external libraries to be loaded **before** `hmt-lib.js`:

1.  **`cex-lib.js`**: For parsing CEX data.
    *   Available via jsDelivr: `<script src="https://cdn.jsdelivr.net/gh/neelsmith/cex-lib/cex.js"></script>`
2.  **`urn-lib.js`**: For parsing and manipulating URNs.
    *   Available via jsDelivr: `<script src="https://cdn.jsdelivr.net/gh/neelsmith/urns-lib/urn-lib.js"></script>`

These libraries provide the global objects `CEXParser` and `URNTools` respectively, which `HMTLib.js` depends on.

## Installation & Usage

### Browser

Include `cex-lib.js`, `urn-lib.js`, and then `hmt-lib.js` in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/cex-lib/cex.js"></script>
<script src="https://cdn.jsdelivr.net/gh/neelsmith/urns-lib/urn-lib.js"></script>
<script src="https://cdn.jsdelivr.net/gh/neelsmith/hmt-lib/hmt-lib.js"></script>
<script>
    // Example usage:
    async function main() {
        try {
            const hmtParser = await HMTLib.hmtcurrent();
            const codices = HMTLib.codexlist(hmtParser);
            console.log("Available codices:", codices);
        } catch (error) {
            console.error("Error using HMTLib:", error);
        }
    }
    main();
</script>
```

All public classes and functions are available under the global `HMTLib` object.

---

## Global Object: `HMTLib`

All functionalities of this library are exposed through the global `HMTLib` object.

---

## Classes

### `HMTLib.DSERecord`

Represents a Document-Surface-Element (DSE) record linking a passage to an image region on a surface.

*   **`new HMTLib.DSERecord(passage, imageroi, surface)`**
    *   **Parameters:**
        *   `passage` (String): The CTS URN of the text passage.
        *   `imageroi` (String): The CITE2 URN of the image with an optional Region of Interest (ROI).
        *   `surface` (String): The CITE2 URN of the manuscript surface (e.g., page).
    *   **Properties:**
        *   `this.passage` (String)
        *   `this.imageroi` (String)
        *   `this.surface` (String)

### `HMTLib.Scholion`

Represents a scholion record, linking a scholion text to an Iliad passage.

*   **`new HMTLib.Scholion(scholionUrn, iliadUrn)`**
    *   **Parameters:**
        *   `scholionUrn` (String): The CTS URN of the scholion text.
        *   `iliadUrn` (String): The CTS URN of the Iliad passage the scholion refers to.
    *   **Properties:**
        *   `this.scholion` (String)
        *   `this.iliad` (String)

### `HMTLib.CodexPage`

Represents a page within a codex.

*   **`new HMTLib.CodexPage(sequence, image, urn, rv, label)`**
    *   **Parameters:**
        *   `sequence` (String|Number): The sequence number of the page (will be parsed as a float).
        *   `image` (String): The CITE2 URN of the image for this page.
        *   `urn` (String): The CITE2 URN of this page object itself.
        *   `rv` (String): The recto/verso indicator (e.g., 'r', 'v').
        *   `label` (String): The human-readable label for the page.
    *   **Properties:**
        *   `this.sequence` (Number)
        *   `this.image` (String)
        *   `this.urn` (String)
        *   `this.rv` (String)
        *   `this.label` (String)

---

## Core Functions

### `HMTLib.hmtcurrent()`

Asynchronously loads the current HMT CEX data release from the official HMT GitHub repository.

*   **Parameters:** None.
*   **Returns:** (`Promise<CEXParser>`) A Promise that resolves with a `CEXParser` instance loaded with the HMT data, or rejects with an Error.
*   **Example:**
    ```javascript
    HMTLib.hmtcurrent()
        .then(parser => console.log("HMT Data Loaded!", parser.getUniqueBlockLabels()))
        .catch(error => console.error("Failed to load HMT data:", error));
    ```

---

## Data Extraction Functions

### `HMTLib.hmtnormalized(parserInstance)`

Loads the corpus of normalized editions of HMT texts.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`String[]`) An array of matching delimited-text lines (records).

### `HMTLib.hmtdiplomatic(parserInstance)`

Loads the corpus of diplomatic editions of HMT texts.


*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`String[]`) An array of matching delimited-text lines (records).

### `HMTLib.hmtdse(parserInstance)`

Loads all DSE records in the current HMT data release.


*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`HMTLib.DSERecord[]`) An array of `DSERecord` objects.

### `HMTLib.hmtscholia(parserInstance)`


Loads all records linking *scholia* to *Iliad* passages in the current HMT data release.




*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`HMTLib.Scholion[]`) An array of `Scholion` objects.

### `HMTLib.codex(parserInstance, codexUrnPrefix)`

Extracts an array of `HMTLib.CodexPage` objects from `citedata` blocks that belong to a specified codex.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
    *   `codexUrnPrefix` (String): The CITE2 URN prefix identifying the codex (e.g., "urn:cite2:hmt:msA.v1:").
*   **Returns:** (`HMTLib.CodexPage[]`) An array of `CodexPage` objects.

---

## Query Functions for DSE Records

(These functions typically operate on an array of `HMTLib.DSERecord` objects obtained from `HMTLib.hmtdse`)

### `HMTLib.recordsforpage(pageUrn, dseRecordsArray)`

Finds all `DSERecord` objects where the `surface` property matches the given page URN.

*   **Parameters:**
    *   `pageUrn` (String): The CITE2 URN of the page (surface) to search for.
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects.
*   **Returns:** (`HMTLib.DSERecord[]`) An array of matching `DSERecord` objects.

### `HMTLib.recordforpassage(passageUrn, dseRecordsArray)`

Finds the first `DSERecord` object where the `passage` property matches the given CTS URN.

*   **Parameters:**
    *   `passageUrn` (String): The CTS URN of the passage to search for.
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects.
*   **Returns:** (`HMTLib.DSERecord | null`) The matching `DSERecord` object, or `null` if not found.

### `HMTLib.imageforpage(pageUrn, dseRecordsArray)`

Finds the base image URN (without ROI) for a given page URN from an array of DSE records.

*   **Parameters:**
    *   `pageUrn` (String): The CITE2 URN identifying the page (surface).
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects.
*   **Returns:** (`String | null`) The image URN (without ROI), or `null` if not found.

---

## Query Functions for Scholia Records

(These functions typically operate on an array of `HMTLib.Scholion` objects obtained from `HMTLib.hmtscholia`)

### `HMTLib.passageforscholion(scholionUrn, scholiaArray)`

Finds the Iliad passage URN that a specific scholion URN refers to.

*   **Parameters:**
    *   `scholionUrn` (String): The CTS URN of the scholion.
    *   `scholiaArray` (`HMTLib.Scholion[]`): An array of `Scholion` objects.
*   **Returns:** (`String | null`) The CTS URN of the Iliad passage, or `null` if not found.

### `HMTLib.scholiaforpassage(iliadPassageUrn, scholiaArray)`

Finds all scholia URNs that refer to a specific Iliad passage URN.

*   **Parameters:**
    *   `iliadPassageUrn` (String): The CTS URN of the Iliad passage.
    *   `scholiaArray` (`HMTLib.Scholion[]`): An array of `Scholion` objects.
*   **Returns:** (`String[]`) An array of scholion CTS URNs.

---

## Metadata and Utility Functions

### `HMTLib.collectionlabel(collectionCite2Urn, parserInstance)`

Retrieves the human-readable label (description) for a CITE2 collection from the `citecollections` data.

*   **Parameters:**
    *   `collectionCite2Urn` (String): The CITE2 URN of the collection.
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`String | null`) The description of the collection, or `null` if not found or an error occurs.

### `HMTLib.textlabel(textCtsUrn, parserInstance)`

Retrieves and formats a human-readable label for a CTS text URN from the `ctscatalog` data.

*   **Parameters:**
    *   `textCtsUrn` (String): The CTS URN of the text.
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`String | null`) The formatted label, or `null` if not found or an error occurs.
    *   Example format: "GroupName, WorkTitle (VersionLabel) ExemplarLabel"

### `HMTLib.codexlist(parserInstance)`

Retrieves a list of CITE2 URNs for collections that are identified as codices, based on the `urn:cite2:hmt:datamodels.v1:codexmodel` in the `datamodels` block. Uses the `CEXParser.getCollectionsForModel()` method.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
*   **Returns:** (`String[]`) An array of CITE2 URN strings for codex collections.

### `HMTLib.codexmenu(parserInstance, selectName, selectId)`

Builds an HTML `<select>` menu string for choosing a codex. It uses `HMTLib.codexlist` to get the URNs and `HMTLib.collectionlabel` to get the display text for each option.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): A `CEXParser` instance loaded with HMT data.
    *   `selectName` (String): The desired `name` attribute for the `<select>` element.
    *   `selectId` (String): The desired `id` attribute for the `<select>` element.
*   **Returns:** (`String`) An HTML string representing the complete `<select>` element with its options.
*   **Example:**
    ```javascript
    // Assuming 'hmtParser' is a loaded CEXParser instance
    const menuHtml = HMTLib.codexmenu(hmtParser, "codex_select", "codexSelector");
    document.getElementById("menu-container").innerHTML = menuHtml;