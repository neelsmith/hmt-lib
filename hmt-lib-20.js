// hmt-lib.js
(function(window) {
    'use strict';

    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    // --- CLASSES ---
    // (DSERecord, Scholion, CodexPage classes remain as they were)
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
            this.sequence = parseFloat(sequence);
            this.image = image;
            this.urn = urn;
            this.rv = rv;
            this.label = label;
        }
    }

    // --- CORE HMT FUNCTIONS ---
    // (All previous functions: hmtcurrent, hmtnormalized, hmtdiplomatic, hmtdse, 
    //  DSE queries, hmtscholia, scholia queries, codex, collectionlabel, 
    //  textlabel, codexlist, codexmenu, text_for_dserecord - remain as they were)
    function hmtcurrent() {
        const hmtCurrentCexUrl = "https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex";
        if (typeof CEXParser === 'undefined') { console.error("hmtcurrent: CEXParser not defined."); return Promise.reject(new Error("CEXParser not defined.")); }
        const parser = new CEXParser();
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') { console.error("hmtnormalized: URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("hmtnormalized: Invalid parserInstance."); return []; }
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
        if (typeof URNTools === 'undefined') { console.error("hmtdiplomatic: URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("hmtdiplomatic: Invalid parserInstance."); return []; }
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
        const targetUrn = "urn:cite2:hmt:hmtdse.v1:all";
        const expectedHeader = "passage|imageroi|surface";
        if (!(parserInstance instanceof CEXParser)) { console.error("hmtdse: Invalid parserInstance."); return []; }
        const blocks = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of blocks) {
            const lines = blockContent.split('\n');
            const processed = lines.map(l => l.trim()).filter(l => l && !l.startsWith('//'));
            if (processed.length < 3) continue;
            if (processed[0].substring("urn|".length) === targetUrn && processed[2] === expectedHeader) {
                for (let i = 3; i < processed.length; i++) {
                    const cols = processed[i].split('|');
                    if (cols.length === 3) dseRecords.push(new HMTLib.DSERecord(cols[0], cols[1], cols[2]));
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
        if (!(parserInstance instanceof CEXParser)) { console.error("hmtscholia: Invalid parserInstance."); return []; }
        const blocks = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of blocks) {
            const lines = blockContent.split('\n');
            const processed = lines.map(l => l.trim()).filter(l => l && !l.startsWith('//'));
            if (processed.length < 3) continue;
            if (processed[0].substring("urn|".length) === targetUrn && processed[2] === expectedHeader) {
                for (let i = 3; i < processed.length; i++) {
                    const cols = processed[i].split('|');
                    if (cols.length === 2) scholiaRecords.push(new HMTLib.Scholion(cols[0], cols[1]));
                }
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
                if (typeof columnIndexMap[colName] === 'undefined') { missingColumn = true; break; }
            }
            if (missingColumn) continue;
            for (let i = dataLinesStartIdx; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) continue;
                const columnValues = trimmedLine.split('|');
                let maxRequiredIndex = 0;
                requiredColumns.forEach(rc => { if (columnIndexMap[rc] > maxRequiredIndex) maxRequiredIndex = columnIndexMap[rc]; });
                if (columnValues.length <= maxRequiredIndex) continue;
                const currentRowFullUrn = columnValues[columnIndexMap['urn']].trim();
                if (!URNTools.isValidCite2Urn(currentRowFullUrn)) continue;
                const parsedUrn = URNTools.parseCite2Urn(currentRowFullUrn);
                if (!parsedUrn.valid || !parsedUrn.namespace || !parsedUrn.collection) continue;
                const currentRowPrefix = `urn:cite2:${parsedUrn.namespace}:${parsedUrn.collection}:`;
                if (currentRowPrefix === codexUrnPrefix) {
                    try {
                        const sequenceStr = columnValues[columnIndexMap['sequence']].trim();
                        if (isNaN(parseFloat(sequenceStr))) continue;
                        const image = columnValues[columnIndexMap['image']].trim();
                        const rv = columnValues[columnIndexMap['rv']].trim();
                        const label = columnValues[columnIndexMap['label']].trim();
                        codexPagesResult.push(new HMTLib.CodexPage(sequenceStr, image, currentRowFullUrn, rv, label));
                    } catch (e) { console.error(`codex: Error creating CodexPage: ${e.message}`); }
                }
            }
        }
        return codexPagesResult;
    }
    function collectionlabel(collectionCite2Urn, parserInstance) {
        if (!collectionCite2Urn || !(parserInstance instanceof CEXParser)) return null;
        const dataString = parserInstance.getDelimitedData("citecollections");
        if (!dataString) return null;
        const lines = dataString.split('\n');
        if (lines.length < 1) return null;
        const headerParts = lines[0].split('|').map(h => h.trim());
        const urnIndex = headerParts.indexOf("URN");
        const descriptionIndex = headerParts.indexOf("Description");
        if (urnIndex === -1 || descriptionIndex === -1) return null;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "") continue;
            const rowParts = line.split('|');
            if (rowParts.length > Math.max(urnIndex, descriptionIndex) && rowParts[urnIndex].trim() === collectionCite2Urn) {
                return rowParts[descriptionIndex].trim();
            }
        }
        return null;
    }
    function textlabel(textCtsUrn, parserInstance) {
        if (!textCtsUrn || !(parserInstance instanceof CEXParser)) return null;
        const dataString = parserInstance.getDelimitedData("ctscatalog");
        if (!dataString) return null;
        const lines = dataString.split('\n');
        if (lines.length < 1) return null;
        const headerParts = lines[0].split('|').map(h => h.trim());
        const colIndices = {
            urn: headerParts.indexOf("urn"), groupName: headerParts.indexOf("groupName"),
            workTitle: headerParts.indexOf("workTitle"), versionLabel: headerParts.indexOf("versionLabel"),
            exemplarLabel: headerParts.indexOf("exemplarLabel")
        };
        if (colIndices.urn === -1 || colIndices.groupName === -1 || colIndices.workTitle === -1 || colIndices.versionLabel === -1) return null;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "") continue;
            const rowParts = line.split('|');
            if (rowParts.length <= colIndices.urn) continue;
            if (rowParts[colIndices.urn].trim() === textCtsUrn) {
                if (rowParts.length <= Math.max(colIndices.groupName, colIndices.workTitle, colIndices.versionLabel)) return null;
                let label = `${rowParts[colIndices.groupName].trim()}, ${rowParts[colIndices.workTitle].trim()} (${rowParts[colIndices.versionLabel].trim()})`;
                if (colIndices.exemplarLabel !== -1 && rowParts.length > colIndices.exemplarLabel && rowParts[colIndices.exemplarLabel].trim()) {
                    label += ` ${rowParts[colIndices.exemplarLabel].trim()}`;
                }
                return label;
            }
        }
        return null;
    }
    function codexlist(parserInstance) {
        if (!(parserInstance instanceof CEXParser)) { console.error("codexlist: Invalid parserInstance."); return []; }
        if (typeof parserInstance.getCollectionsForModel !== 'function') { console.error("codexlist: parserInstance.getCollectionsForModel not a function."); return []; }
        const targetModelValue = "urn:cite2:hmt:datamodels.v1:codexmodel";
        try {
            return parserInstance.getCollectionsForModel(targetModelValue);
        } catch (e) { console.error("codexlist: Error calling getCollectionsForModel:", e); return []; }
    }
    function codexmenu(parserInstance, selectName, selectId) {
        if (!(parserInstance instanceof CEXParser)) { console.error("codexmenu: Invalid parserInstance."); return `<select name="${selectName}" id="${selectId}"><option value="">Error: Invalid Parser</option></select>`; }
        if (typeof HMTLib.codexlist !== 'function') { console.error("codexmenu: HMTLib.codexlist missing."); return `<select name="${selectName}" id="${selectId}"><option value="">Error: codexlist fn missing</option></select>`; }
        if (typeof HMTLib.collectionlabel !== 'function') { console.error("codexmenu: HMTLib.collectionlabel missing."); return `<select name="${selectName}" id="${selectId}"><option value="">Error: collectionlabel fn missing</option></select>`; }
        let optionsHtml = '';
        const codexUrns = HMTLib.codexlist(parserInstance);
        if (codexUrns.length === 0) {
            optionsHtml = '<option value="">No codices found</option>';
        } else {
            codexUrns.forEach(urn => {
                const label = HMTLib.collectionlabel(urn, parserInstance);
                const displayLabel = label ? label : urn;
                const escapedUrn = urn.replace(/"/g, "&quot;");
                const escapedDisplayLabel = displayLabel.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                optionsHtml += `<option value="${escapedUrn}">${escapedDisplayLabel}</option>\n`;
            });
        }
        return `<select name="${selectName}" id="${selectId}">\n${optionsHtml}</select>`;
    }
    function text_for_dserecord(dseRecord, exemplarId, textCorpusString) {
        if (!(dseRecord instanceof HMTLib.DSERecord) || typeof dseRecord.passage !== 'string') {
            console.error("text_for_dserecord: Invalid dseRecord input."); return "";
        }
        // This function will now call the generalized text_for_hmturn
        return HMTLib.text_for_hmturn(dseRecord.passage, exemplarId, textCorpusString);
    }

    // --- NEW text_for_hmturn FUNCTION ---
    /**
     * Retrieves text content from a corpus string based on a text identifier string and an exemplar ID.
     * Modifies the text identifier URN with the exemplar ID, then searches a corpus
     * for matching text(s). Handles scholia by looking for .lemma and .comment versions.
     *
     * @param {string} textIdentifierString - The base CTS URN of the text.
     * @param {string} exemplarId - The exemplar identifier (e.g., "normalized", "diplomatic").
     * @param {string} textCorpusString - A pipe-delimited string where each line is "URN|Text Content".
     * @returns {string} The found text content, or concatenated texts (for scholia lemma/comment)
     *                   separated by double newlines. Returns an empty string if no text is found
     *                   or if inputs are invalid.
     */
    function text_for_hmturn(textIdentifierString, exemplarId, textCorpusString) {
        if (typeof textIdentifierString !== 'string' || textIdentifierString.trim() === "") {
            console.error("text_for_hmturn: Invalid or empty textIdentifierString input.");
            return "";
        }
        if (!exemplarId || typeof exemplarId !== 'string' || exemplarId.trim() === "") {
            console.error("text_for_hmturn: Invalid or empty exemplarId input.");
            return "";
        }
        if (typeof textCorpusString !== 'string') {
            console.error("text_for_hmturn: Invalid textCorpusString input.");
            return "";
        }

        const basePassageUrn = textIdentifierString;
        const urnParts = basePassageUrn.split(':');

        if (urnParts.length !== 5) {
            console.error(`text_for_hmturn: Malformed basePassageUrn "${basePassageUrn}". Expected 5 colon-separated parts.`);
            return "";
        }

        // Modify the 4th part (work identifier, 0-indexed part 3)
        urnParts[3] = `${urnParts[3]}.${exemplarId.trim()}`;
        const modifiedUrn = urnParts.join(':');

        const searchUrns = [];
        const scholionPrefix = "urn:cts:greekLit:tlg5026"; 
        
        if (modifiedUrn.startsWith(scholionPrefix)) {
            searchUrns.push(modifiedUrn + ".lemma");
            searchUrns.push(modifiedUrn + ".comment");
        } else {
            searchUrns.push(modifiedUrn);
        }

        const corpusLines = textCorpusString.split('\n');
        const foundTexts = [];

        for (const line of corpusLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue; 

            const lineParts = trimmedLine.split('|');
            if (lineParts.length < 2) { 
                continue;
            }

            const corpusUrn = lineParts[0].trim();
            const corpusText = lineParts.slice(1).join('|').trim(); 

            if (searchUrns.includes(corpusUrn)) {
                foundTexts.push(corpusText);
            }
        }
        return foundTexts.join("\n\n");
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
    window.HMTLib.collectionlabel = collectionlabel;
    window.HMTLib.textlabel = textlabel;
    window.HMTLib.codexlist = codexlist; 
    window.HMTLib.codexmenu = codexmenu;
    window.HMTLib.text_for_dserecord = text_for_dserecord;
    window.HMTLib.text_for_hmturn = text_for_hmturn; // New function

})(window);