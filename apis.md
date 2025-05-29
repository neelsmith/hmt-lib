
# `hmtlib.js` version 1.1.0: API Documentation


## Overview

`hmtlib.js` provides a collection of classes and functions to interact with and process data from the Homer Multitext project. This data is typically sourced from CEX (CITE Exchange) files. The library assists in tasks such as parsing CEX data, retrieving specific text editions, linking text passages to manuscript images, and generating user interface elements like selection menus.

All functionalities are exposed under the global `window.HMTLib` namespace.

**Dependencies:**

*   `cex-lib.js`: Provides the `CEXParser` class, essential for loading and parsing CEX data.
*   `urn-lib.js`: Provides `URNTools`, used for parsing and manipulating URNs (Uniform Resource Names).


## Installation & Usage

### Browser

Include `cex-lib.js`, `urn-lib.js`, and then `hmt-lib.js` in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/cex-lib/cex.js"></script>
<script src="https://cdn.jsdelivr.net/gh/neelsmith/urns-lib/urn-lib.js"></script>
<script src="https://cdn.jsdelivr.net/gh/neelsmith/hmt-lib@1.1.0/hmt-lib.js"></script>
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

## Classes

### `HMTLib.DSERecord`
Represents a DSE (Document-Surface-Element) record, which links a text passage to an image region of interest (ROI) on a specific manuscript surface.

*   **Constructor:** `new HMTLib.DSERecord(passage, imageroi, surface)`
    *   `passage` (String): The CTS URN of the text passage.
    *   `imageroi` (String): The CITE2 URN of the image ROI.
    *   `surface` (String): The CITE2 URN of the manuscript surface (page).
*   **Properties:**
    *   `this.passage`: Stores the `passage` URN.
    *   `this.imageroi`: Stores the `imageroi` URN.
    *   `this.surface`: Stores the `surface` URN.

### `HMTLib.Scholion`
Represents a scholion record, linking a scholion passage URN to an Iliad passage URN it comments on.

*   **Constructor:** `new HMTLib.Scholion(scholionUrn, iliadUrn)`
    *   `scholionUrn` (String): The CTS URN of the scholion passage.
    *   `iliadUrn` (String): The CTS URN of the Iliad passage being commented on.
*   **Properties:**
    *   `this.scholion`: Stores the `scholionUrn`.
    *   `this.iliad`: Stores the `iliadUrn`.

### `HMTLib.CodexPage`
Represents a page in a codex (manuscript).

*   **Constructor:** `new HMTLib.CodexPage(sequence, image, urn, rv, label)`
    *   `sequence` (String|Number): The sequence number of the page in the codex. It's parsed into a float.
    *   `image` (String): The CITE2 URN of the image representing this page.
    *   `urn` (String): The CITE2 URN identifying this codex page record.
    *   `rv` (String): Recto ('r') or Verso ('v') indicator for the page.
    *   `label` (String): A human-readable label for the page (e.g., "folio 1 recto").
*   **Properties:**
    *   `this.sequence`: Stores the numeric `sequence`.
    *   `this.image`: Stores the `image` URN.
    *   `this.urn`: Stores the `urn`.
    *   `this.rv`: Stores the `rv` indicator.
    *   `this.label`: Stores the `label`.

---

## Core HMT Functions

### `HMTLib.hmtcurrent()`
Asynchronously loads the current HMT project data from the canonical CEX file URL.

*   **Parameters:** None.
*   **Returns:** `Promise<CEXParser>` - A Promise that resolves to a `CEXParser` instance loaded with the HMT data. Rejects with an Error if `CEXParser` is not defined or if loading fails.
*   **Requires:** `CEXParser` global object.

### `HMTLib.hmtnormalized(parserInstance)`
Extracts all lines from 'ctsdata' blocks in a `CEXParser` instance where the URN's work component ends with `.normalized`.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `String[]` - An array of strings. Each string is a full line (URN|text) from the 'ctsdata' block matching the criteria. Returns an empty array on error or if no matches.
*   **Requires:** `URNTools` for robust URN parsing (with a fallback to string matching if `URNTools.workcomponent` is unavailable).

### `HMTLib.hmtdiplomatic(parserInstance)`
Extracts all lines from 'ctsdata' blocks in a `CEXParser` instance where the URN's work component ends with `.diplomatic`.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `String[]` - An array of strings. Each string is a full line (URN|text) from the 'ctsdata' block matching the criteria. Returns an empty array on error or if no matches.
*   **Requires:** `URNTools` for robust URN parsing (with a fallback to string matching if `URNTools.workcomponent` is unavailable).

### `HMTLib.hmtdse(parserInstance)`
Parses 'citerelationset' blocks from a `CEXParser` instance to extract DSE records, specifically targeting the "urn:cite2:hmt:hmtdse.v1:all" relation set.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `HMTLib.DSERecord[]` - An array of `DSERecord` objects. Returns an empty array on error or if no DSE records are found.

### `HMTLib.recordsforpage(pageUrn, dseRecordsArray)`
Filters an array of `DSERecord` objects to find those matching a specific page URN.

*   **Parameters:**
    *   `pageUrn` (String): The CITE2 URN of the manuscript surface (page).
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects to search.
*   **Returns:** `HMTLib.DSERecord[]` - An array of `DSERecord` objects that are on the specified page. Returns an empty array if inputs are invalid or no matches.

### `HMTLib.recordforpassage(passageUrn, dseRecordsArray)`
Finds the first `DSERecord` object in an array that matches a specific passage URN.

*   **Parameters:**
    *   `passageUrn` (String): The CTS URN of the text passage.
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects to search.
*   **Returns:** `HMTLib.DSERecord|null` - The first matching `DSERecord` object, or `null` if inputs are invalid or no match.

### `HMTLib.imageforpage(pageUrn, dseRecordsArray)`
Extracts the base image URN for a given page URN from an array of DSE records. It strips the ROI part (e.g., "@0.1,0.2,0.3,0.4") from the `imageroi` property.

*   **Parameters:**
    *   `pageUrn` (String): The CITE2 URN of the manuscript surface (page).
    *   `dseRecordsArray` (`HMTLib.DSERecord[]`): An array of `DSERecord` objects.
*   **Returns:** `String|null` - The base image CITE2 URN, or `null` if inputs are invalid, no records for the page are found, or the record lacks an `imageroi` property.

### `HMTLib.hmtscholia(parserInstance)`
Parses 'citerelationset' blocks from a `CEXParser` instance to extract scholia relationship records, specifically targeting the "urn:cite2:hmt:commentary.v1:all" relation set.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `HMTLib.Scholion[]` - An array of `Scholion` objects. Returns an empty array on error or if no scholia records.

### `HMTLib.passageforscholion(scholionUrn, scholiaArray)`
Finds the Iliad passage URN that a given scholion URN comments on.

*   **Parameters:**
    *   `scholionUrn` (String): The CTS URN of the scholion passage.
    *   `scholiaArray` (`HMTLib.Scholion[]`): An array of `Scholion` objects to search.
*   **Returns:** `String|null` - The Iliad passage CTS URN, or `null` if inputs are invalid or the scholion is not found.

### `HMTLib.scholiaforpassage(iliadUrn, scholiaArray)`
Finds all scholia URNs that comment on a given Iliad passage URN.

*   **Parameters:**
    *   `iliadUrn` (String): The CTS URN of the Iliad passage.
    *   `scholiaArray` (`HMTLib.Scholion[]`): An array of `Scholion` objects to search.
*   **Returns:** `String[]` - An array of scholion CTS URNs. Returns an empty array if inputs are invalid or no scholia for the passage.

### `HMTLib.codex(parserInstance, codexUrnPrefix)`
Extracts `CodexPage` objects for a specific codex from 'citedata' blocks. It looks for records where the CITE2 URN starts with the given `codexUrnPrefix`.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
    *   `codexUrnPrefix` (String): The CITE2 URN prefix for the desired codex (e.g., "urn:cite2:hmt:msA.v1:"). **Must end with a colon.**
*   **Returns:** `HMTLib.CodexPage[]` - An array of `CodexPage` objects for the specified codex. Returns an empty array on error or if no pages.
*   **Requires:** `URNTools` for robust URN parsing (with fallbacks).

### `HMTLib.collectionlabel(collectionCite2Urn, parserInstance)`
Retrieves the human-readable description (label) for a CITE2 collection URN from the 'citecollections' block in the CEX data.

*   **Parameters:**
    *   `collectionCite2Urn` (String): The CITE2 URN of the collection.
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `String|null` - The description of the collection, or `null` if inputs are invalid, collection not found, or data malformed.

### `HMTLib.textlabel(textCtsUrnInput, parserInstance)`
Retrieves a formatted human-readable label for a CTS text URN from the 'ctscatalog' block in the CEX data.
The input `textCtsUrnInput` is normalized before searching:

1.  If the URN has 5 colon-separated parts:
    *   The work identifier (4th part of URN, e.g., `tlg0012.tlg001.msA.normalized`) is examined. If it has 4 period-separated sub-parts, the 4th sub-part is dropped (e.g., becomes `tlg0012.tlg001.msA`).
    *   The passage reference (5th part of URN, e.g., `1.1`) is dropped.
2.  The search is performed using the URN representing the text version, ending with a colon (e.g., `urn:cts:greekLit:tlg0012.tlg001.msA:`).
*   **Parameters:**
    *   `textCtsUrnInput` (String): The CTS URN of the text (can include passage or version details).
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `String|null` - A formatted label (e.g., "Homeric epic, Iliad (Venetus A manuscript) text"), or `null` if inputs are invalid, text not found, or data malformed.

### `HMTLib.codexlist(parserInstance)`
Retrieves a list of CITE2 collection URNs that conform to the HMT codex data model ("urn:cite2:hmt:datamodels.v1:codexmodel") from the CEX data.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): An initialized CEXParser instance.
*   **Returns:** `String[]` - An array of CITE2 URNs for codex collections. Returns an empty array on error or if the parser lacks `getCollectionsForModel` or no such collections.

### `HMTLib.codexmenu(parserInstance, selectName, selectId)`
Builds an HTML `<select>` menu for choosing a codex. Uses `HMTLib.codexlist` to get URNs and `HMTLib.collectionlabel` for option text.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): The CEXParser instance.
    *   `selectName` (String): The 'name' attribute for the `<select>` element.
    *   `selectId` (String): The 'id' attribute for the `<select>` element.
*   **Returns:** `String` - An HTML string representing the `<select>` element. Returns an error message within the select element if dependencies are missing.

### `HMTLib.text_for_hmturn(passageIdentifier, exemplar, corpusInput)`
Retrieves text from a corpus based on a passage identifier and exemplar.
The input `passageIdentifier` must be a 5-part CTS URN (e.g., `urn:cts:greekLit:tlg0012.tlg001.msA:1.1`). The function appends `.{exemplar}` to the work component (4th part) of this URN.
If the resulting URN starts with "urn:cts:greekLit:tlg5026" (indicating a scholion), it searches for versions of this URN ending in `.lemma` and `.comment` in the corpus. Otherwise, it searches for the URN with the appended exemplar directly.

*   **Parameters:**
    *   `passageIdentifier` (String): The base CTS URN for the passage.
    *   `exemplar` (String): The exemplar to append (e.g., "normalized", "diplomatic").
    *   `corpusInput` (String|String[]): A string containing the corpus data (each "URN|text" on a new line) OR an array of such "URN|text" strings.
*   **Returns:** `String` - A string containing all matching lines from the corpus (URN|text), joined by newlines. Returns an empty string if no matches or on error.

### `HMTLib.iliads(parserInstance)`
Gets all text identifiers (URNs) for versions of the Iliad from the 'ctscatalog'. Iliad identifiers are expected to start with "urn:cts:greekLit:tlg0012".

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): The CEXParser instance.
*   **Returns:** `String[]` - A list of CTS URNs for versions of the Iliad. Returns an empty array on error or if no Iliad versions.

### `HMTLib.iliadsmenu(parserInstance, selectName, selectId)`
Builds an HTML `<select>` menu for choosing an Iliad version from the catalog. Uses `HMTLib.iliads` to get the list of Iliad URNs and `HMTLib.textlabel` to generate the display text for each option.

*   **Parameters:**
    *   `parserInstance` (`CEXParser`): The CEXParser instance.
    *   `selectName` (String): The 'name' attribute for the `<select>` element.
    *   `selectId` (String): The 'id' attribute for the `<select>` element.
*   **Returns:** `String` - An HTML string representing the `<select>` element. Returns an error message within the select element if dependencies are missing.

### `HMTLib.iliadbooks(iliadVersionUrn, textCorpusArray)`
Finds all unique book numbers for a given Iliad version from a text corpus.
The `iliadVersionUrn` (e.g., "urn:cts:greekLit:tlg0012.tlg001.msA:") is processed: if its work identifier (4th part, like `tlg0012.tlg001.msA`) has 3 period-separated subparts, ".diplomatic" is appended to it before searching the corpus. The corpus is then searched for URNs starting with this (potentially modified) URN prefix. The book number is extracted from the 5th part of matching URNs (e.g., "1" from "...:1.1").

*   **Parameters:**
    *   `iliadVersionUrn` (String): The base CTS URN of the Iliad version, **ending with a colon.**
    *   `textCorpusArray` (String[]): An array of strings, where each string is a pipe-delimited "URN|text" line. This corpus is searched.
*   **Returns:** `String[]` - A sorted list of unique book numbers (as strings) found. Returns an empty array on error or if no books.

### `HMTLib.iliadlines(iliadBookUrn, textCorpusArray)`
Finds all URNs for lines within a specific book of an Iliad version from a text corpus.
The input `iliadBookUrn` (e.g., "urn:cts:greekLit:tlg0012.tlg001.msA:1") is processed: if its work identifier (4th part, like `tlg0012.tlg001.msA`) has 3 period-separated subparts, ".diplomatic" is appended to it. The search prefix is then constructed by appending a dot to this (potentially modified) URN (e.g., "urn:cts:greekLit:tlg0012.tlg001.msA.diplomatic:1.").

*   **Parameters:**
    *   `iliadBookUrn` (String): The CTS URN specifying the Iliad version and book (e.g., "urn:cts:greekLit:tlg0012.tlg001.msA:1"). This URN should **NOT end with a colon.**
    *   `textCorpusArray` (String[]): An array of strings, where each string is a pipe-delimited "URN|text" line. This corpus is searched.
*   **Returns:** `String[]` - A list of full CTS URNs for lines found in that book of that Iliad version. Returns an empty array on error or if no lines.
