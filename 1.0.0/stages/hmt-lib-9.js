// hmt-lib.js
(function(window) {
    'use strict';

    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    // --- CLASSES ---
    class DSERecord {
        constructor(passage, imageroi, surface) {
            this.passage = passage;
            this.imageroi = imageroi;
            this.surface = surface;
        }
    }

    class Scholion {
        constructor(scholionUrn, iliadUrn) {
            this.scholion = scholionUrn;
            this.iliad = iliadUrn;
        }
    }

    class CodexPage {
        constructor(sequence, image, urn, rv, label) {
            this.sequence = sequence;
            this.image = image;
            this.urn = urn;
            this.rv = rv;
            this.label = label;
        }
    }

    // --- CORE HMT FUNCTIONS ---
    function hmtcurrent() {
        const hmtCurrentCexUrl = "https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex";
        if (typeof CEXParser === 'undefined') {
            console.error("CEXParser not defined.");
            return Promise.reject(new Error("CEXParser not defined."));
        }
        const parser = new CEXParser();
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }

    // ... (hmtnormalized, hmtdiplomatic, hmtdse, DSE queries, hmtscholia, scholia queries, codex functions remain unchanged) ...
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') { console.error("URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance."); return []; }
        const filteredRecords = [];
        const ctsDataBlockContents = parserInstance.getBlockContents('ctsdata');
        ctsDataBlockContents.forEach(blockContent => {
            const lines = blockContent.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) return;
                const parts = trimmedLine.split('|');
                if (parts.length >= 1) {
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString);
                    if (workComponent && workComponent.endsWith('.normalized')) {
                        filteredRecords.push(trimmedLine);
                    }
                }
            });
        });
        return filteredRecords;
    }

    function hmtdiplomatic(parserInstance) {
        if (typeof URNTools === 'undefined') { console.error("URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance."); return []; }
        const filteredRecords = [];
        const ctsDataBlockContents = parserInstance.getBlockContents('ctsdata');
        ctsDataBlockContents.forEach(blockContent => {
            const lines = blockContent.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) return;
                const parts = trimmedLine.split('|');
                if (parts.length >= 1) {
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString);
                    if (workComponent && workComponent.endsWith('.diplomatic')) {
                        filteredRecords.push(trimmedLine);
                    }
                }
            });
        });
        return filteredRecords;
    }
    
    function hmtdse(parserInstance) {
        const dseRecords = [];
        const targetRelationSetUrn = "urn:cite2:hmt:hmtdse.v1:all";
        const expectedHeader = "passage|imageroi|surface";
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance to hmtdse."); return []; }
        const citeRelationSetBlockContents = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of citeRelationSetBlockContents) {
            const lines = blockContent.split('\n');
            const processedLines = [];
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('//')) processedLines.push(trimmedLine);
            }
            if (processedLines.length < 3) continue;
            let currentBlockUrn = processedLines[0].startsWith("urn|") ? processedLines[0].substring("urn|".length) : null;
            if (!currentBlockUrn) continue;
            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2];
                if (headerLine !== expectedHeader) { console.warn(`DSE Header mismatch in ${currentBlockUrn}`); continue; }
                for (let i = 3; i < processedLines.length; i++) {
                    const columns = processedLines[i].split('|');
                    if (columns.length === 3) dseRecords.push(new HMTLib.DSERecord(columns[0], columns[1], columns[2]));
                    else console.warn(`DSE wrong column count in ${currentBlockUrn}, row: "${processedLines[i]}"`);
                }
            }
        }
        return dseRecords;
    }

    function recordsforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || !Array.isArray(dseRecordsArray)) return [];
        return dseRecordsArray.filter(r => r instanceof HMTLib.DSERecord && r.surface === pageUrn);
    }

    function recordforpassage(passageUrn, dseRecordsArray) {
        if (!passageUrn || !Array.isArray(dseRecordsArray)) return null;
        return dseRecordsArray.find(r => r instanceof HMTLib.DSERecord && r.passage === passageUrn) || null;
    }

    function imageforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || !Array.isArray(dseRecordsArray)) return null;
        const recs = HMTLib.recordsforpage(pageUrn, dseRecordsArray);
        if (recs.length > 0 && recs[0].imageroi) {
            const idx = recs[0].imageroi.lastIndexOf('@');
            return idx !== -1 ? recs[0].imageroi.substring(0, idx) : recs[0].imageroi;
        }
        return null;
    }

    function hmtscholia(parserInstance) {
        const scholiaRecords = [];
        const targetUrn = "urn:cite2:hmt:commentary.v1:all";
        const expectedHeader = "scholion|iliad";
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance to hmtscholia."); return []; }
        const blocks = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of blocks) {
            const lines = blockContent.split('\n');
            const processed = [];
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed !== '' && !trimmed.startsWith('//')) processed.push(trimmed);
            }
            if (processed.length < 3) continue;
            let blockUrn = processed[0].startsWith("urn|") ? processed[0].substring("urn|".length) : null;
            if (!blockUrn || blockUrn !== targetUrn) continue;
            if (processed[2] !== expectedHeader) { console.warn(`Scholia Header mismatch in ${blockUrn}`); continue; }
            for (let i = 3; i < processed.length; i++) {
                const cols = processed[i].split('|');
                if (cols.length === 2) scholiaRecords.push(new HMTLib.Scholion(cols[0], cols[1]));
                else console.warn(`Scholia wrong column count in ${blockUrn}, row: "${processed[i]}"`);
            }
        }
        return scholiaRecords;
    }

    function passageforscholion(scholionUrn, scholiaArray) {
        if (!scholionUrn || !Array.isArray(scholiaArray)) return null;
        const found = scholiaArray.find(s => s instanceof HMTLib.Scholion && s.scholion === scholionUrn);
        return found ? found.iliad : null;
    }

    function scholiaforpassage(iliadUrn, scholiaArray) {
        if (!iliadUrn || !Array.isArray(scholiaArray)) return [];
        return scholiaArray.filter(s => s instanceof HMTLib.Scholion && s.iliad === iliadUrn).map(s => s.scholion);
    }
    
    function codex(parserInstance, codexUrnPrefix) {
        const codexPagesResult = [];
        const requiredColumns = ['urn', 'sequence', 'image', 'rv', 'label'];
        if (!(parserInstance instanceof CEXParser)) { console.error("codex: Invalid parserInstance."); return []; }
        if (typeof codexUrnPrefix !== 'string' || !codexUrnPrefix.endsWith(':')) { console.error("codex: codexUrnPrefix must end with ':'."); return []; }
        if (typeof URNTools === 'undefined') { console.error("codex: URNTools not defined."); return []; }
        const citeDataBlocks = parserInstance.getBlockContents("citedata");
        for (const blockContent of citeDataBlocks) {
            const lines = blockContent.split('\n');
            let headerLine = null, dataLinesStartIdx = -1;
            const columnIndexMap = {};
            for (let i = 0; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) continue;
                if (!headerLine) {
                    headerLine = trimmedLine;
                    headerLine.split('|').forEach((name, idx) => { columnIndexMap[name.trim()] = idx; });
                    dataLinesStartIdx = i + 1;
                    break; 
                }
            }
            if (!headerLine) continue;
            let missingColumn = false;
            for (const colName of requiredColumns) {
                if (typeof columnIndexMap[colName] === 'undefined') { console.warn(`codex: Missing column '${colName}' in header "${headerLine}"`); missingColumn = true; break; }
            }
            if (missingColumn) continue;
            for (let i = dataLinesStartIdx; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) continue;
                const columnValues = trimmedLine.split('|');
                if (columnValues.length < Object.keys(columnIndexMap).length) continue;
                const currentRowFullUrn = columnValues[columnIndexMap['urn']].trim();
                if (!URNTools.isValidCite2Urn(currentRowFullUrn)) continue;
                const rowNamespace = URNTools.cite2namespace(currentRowFullUrn);
                const rowCollection = URNTools.collectioncomponent(currentRowFullUrn);
                if (!rowNamespace || !rowCollection) continue;
                const currentRowPrefix = `urn:cite2:${rowNamespace}:${rowCollection}:`;
                if (currentRowPrefix === codexUrnPrefix) {
                    try {
                        const sequence = parseFloat(columnValues[columnIndexMap['sequence']].trim());
                        if (isNaN(sequence)) continue;
                        const image = columnValues[columnIndexMap['image']].trim();
                        const rv = columnValues[columnIndexMap['rv']].trim();
                        const label = columnValues[columnIndexMap['label']].trim();
                        codexPagesResult.push(new HMTLib.CodexPage(sequence, image, currentRowFullUrn, rv, label));
                    } catch (e) { console.error(`codex: Error creating CodexPage: ${e.message}`); }
                }
            }
        }
        return codexPagesResult;
    }

    // --- NEW METADATA FUNCTIONS ---

    /**
     * Retrieves the label for a CITE2 collection URN from 'citecollections' data.
     * @param {string} collectionCite2Urn - The CITE2 URN of the collection.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string | null} The description of the collection, or null if not found or error.
     */
    function collectionlabel(collectionCite2Urn, parserInstance) {
        if (!collectionCite2Urn || typeof collectionCite2Urn !== 'string') {
            console.error("collectionlabel: collectionCite2Urn parameter is invalid.");
            return null;
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("collectionlabel: parserInstance parameter is invalid.");
            return null;
        }

        const dataString = parserInstance.getDelimitedData("citecollections");
        if (!dataString) {
            // console.warn("collectionlabel: No data found for 'citecollections'.");
            return null;
        }

        const lines = dataString.split('\n');
        if (lines.length < 1) { // Should have at least header
             // console.warn("collectionlabel: 'citecollections' data is empty or malformed (no header).");
            return null;
        }

        // The first line is the header: URN|Description|Labelling property|Ordering property|License
        const headerParts = lines[0].split('|').map(h => h.trim());
        const urnIndex = headerParts.indexOf("URN");
        const descriptionIndex = headerParts.indexOf("Description");

        if (urnIndex === -1 || descriptionIndex === -1) {
            console.error("collectionlabel: 'URN' or 'Description' column not found in 'citecollections' header.");
            return null;
        }

        for (let i = 1; i < lines.length; i++) { // Start from 1 to skip header
            const line = lines[i].trim();
            if (line === "") continue; // Skip any potentially empty lines if not already filtered

            const rowParts = line.split('|');
            if (rowParts.length > Math.max(urnIndex, descriptionIndex)) {
                const urnValue = rowParts[urnIndex].trim();
                if (urnValue === collectionCite2Urn) {
                    return rowParts[descriptionIndex].trim();
                }
            } else {
                // console.warn(`collectionlabel: Row has insufficient columns: "${line}"`);
            }
        }
        // console.warn(`collectionlabel: URN "${collectionCite2Urn}" not found in 'citecollections'.`);
        return null; // Not found
    }

    /**
     * Retrieves and formats a label for a CTS URN from 'ctscatalog' data.
     * @param {string} textCtsUrn - The CTS URN of the text.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string | null} The formatted label, or null if not found or error.
     */
    function textlabel(textCtsUrn, parserInstance) {
        if (!textCtsUrn || typeof textCtsUrn !== 'string') {
            console.error("textlabel: textCtsUrn parameter is invalid.");
            return null;
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("textlabel: parserInstance parameter is invalid.");
            return null;
        }

        const dataString = parserInstance.getDelimitedData("ctscatalog");
        if (!dataString) {
            // console.warn("textlabel: No data found for 'ctscatalog'.");
            return null;
        }

        const lines = dataString.split('\n');
        if (lines.length < 1) { // Should have at least header
            // console.warn("textlabel: 'ctscatalog' data is empty or malformed (no header).");
            return null;
        }

        // Header: urn|citationScheme|groupName|workTitle|versionLabel|exemplarLabel|online|language
        const headerParts = lines[0].split('|').map(h => h.trim());
        const colIndices = {
            urn: headerParts.indexOf("urn"),
            groupName: headerParts.indexOf("groupName"),
            workTitle: headerParts.indexOf("workTitle"),
            versionLabel: headerParts.indexOf("versionLabel"),
            exemplarLabel: headerParts.indexOf("exemplarLabel")
        };

        // Check if all required columns for label construction are present
        if (colIndices.urn === -1 || colIndices.groupName === -1 || colIndices.workTitle === -1 || colIndices.versionLabel === -1) {
            console.error("textlabel: One or more required columns (urn, groupName, workTitle, versionLabel) not found in 'ctscatalog' header.");
            return null;
        }
        // exemplarLabel is optional for presence in header, but if present, its index is needed.
        // If not present, colIndices.exemplarLabel will be -1, handled below.

        for (let i = 1; i < lines.length; i++) { // Start from 1 to skip header
            const line = lines[i].trim();
            if (line === "") continue;

            const rowParts = line.split('|');
            
            // Ensure row is long enough for the URN column
            if (rowParts.length <= colIndices.urn) {
                // console.warn(`textlabel: Row has insufficient columns for URN: "${line}"`);
                continue;
            }

            const currentUrn = rowParts[colIndices.urn].trim();
            if (currentUrn === textCtsUrn) {
                // Ensure row is long enough for all other required parts for label
                if (rowParts.length <= colIndices.groupName || 
                    rowParts.length <= colIndices.workTitle || 
                    rowParts.length <= colIndices.versionLabel) {
                    // console.warn(`textlabel: Matched URN "${currentUrn}" but row has insufficient columns for label parts: "${line}"`);
                    return null; // or skip this row if other URNs might match
                }

                const group = rowParts[colIndices.groupName].trim();
                const work = rowParts[colIndices.workTitle].trim();
                const version = rowParts[colIndices.versionLabel].trim();
                
                let exemplar = "";
                if (colIndices.exemplarLabel !== -1 && rowParts.length > colIndices.exemplarLabel) {
                    exemplar = rowParts[colIndices.exemplarLabel].trim();
                }

                let label = `${group}, ${work} (${version})`;
                if (exemplar) {
                    label += ` ${exemplar}`;
                }
                return label;
            }
        }
        // console.warn(`textlabel: URN "${textCtsUrn}" not found in 'ctscatalog'.`);
        return null; // Not found
    }


    // Expose classes and functions
    window.HMTLib.DSERecord = DSERecord;
    window.HMTLib.Scholion = Scholion;
    window.HMTLib.CodexPage = CodexPage;

    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;
    window.HMTLib.hmtdse = hmtdse;
    window.HMTLib.recordsforpage = recordsforpage;
    window.HMTLib.recordforpassage = recordforpassage;
    window.HMTLib.imageforpage = imageforpage;
    window.HMTLib.hmtscholia = hmtscholia;
    window.HMTLib.passageforscholion = passageforscholion;
    window.HMTLib.scholiaforpassage = scholiaforpassage;
    window.HMTLib.codex = codex;
    
    window.HMTLib.collectionlabel = collectionlabel; // New
    window.HMTLib.textlabel = textlabel;         // New

})(window);