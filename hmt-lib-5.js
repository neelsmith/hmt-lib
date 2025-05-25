// hmt-lib.js
(function(window) {
    'use strict';

    // Create a namespace for the library if it doesn't exist
    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    /**
     * Represents a DSE (Document-Surface-Element) record.
     */
    class DSERecord {
        /**
         * Creates an instance of DSERecord.
         * @param {string} passage - The passage identifier.
         * @param {string} imageroi - The image ROI (Region of Interest) identifier.
         * @param {string} surface - The surface identifier.
         */
        constructor(passage, imageroi, surface) {
            this.passage = passage;
            this.imageroi = imageroi;
            this.surface = surface;
        }
    }

    /**
     * Loads the HMT current CEX data source from a predefined URL.
     * @returns {Promise<CEXParser>} A Promise that resolves with the CEXParser instance.
     */
    function hmtcurrent() {
        const hmtCurrentCexUrl = "https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex";

        if (typeof CEXParser === 'undefined') {
            console.error("CEXParser is not defined. Ensure cex-lib.js is loaded before hmt-lib.js.");
            return Promise.reject(new Error("CEXParser is not defined. Ensure cex-lib.js is loaded."));
        }

        const parser = new CEXParser();
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }

    /**
     * Filters records from 'ctsdata' blocks where the CTS URN's work component
     * ends with '.normalized'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string[]} An array of matching delimited-text lines.
     */
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded.");
            return [];
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtnormalized.");
            return [];
        }

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

    /**
     * Filters records from 'ctsdata' blocks where the CTS URN's work component
     * ends with '.diplomatic'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string[]} An array of matching delimited-text lines.
     */
    function hmtdiplomatic(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded.");
            return [];
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtdiplomatic.");
            return [];
        }

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

    /**
     * Extracts DSE (Document-Surface-Element) records from 'citerelationset' blocks
     * specifically from 'urn:cite2:hmt:hmtdse.v1:all'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {DSERecord[]} An array of DSERecord objects.
     */
    function hmtdse(parserInstance) {
        const dseRecords = [];
        const targetRelationSetUrn = "urn:cite2:hmt:hmtdse.v1:all";
        const expectedHeader = "passage|imageroi|surface";

        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtdse.");
            return [];
        }

        const citeRelationSetBlockContents = parserInstance.getBlockContents("citerelationset");

        for (const blockContent of citeRelationSetBlockContents) {
            const lines = blockContent.split('\n');
            const processedLines = []; // Store non-empty, non-comment lines

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('//')) {
                    processedLines.push(trimmedLine);
                }
            }

            // A valid block for DSE needs at least URN, label, header, and one data line.
            // But we'll check for URN, label, header first (min 3 lines).
            if (processedLines.length < 3) {
                // console.warn("Skipping citerelationset block: not enough processed lines for URN, label, and header.");
                continue;
            }

            let currentBlockUrn = null;
            if (processedLines[0].startsWith("urn|")) {
                currentBlockUrn = processedLines[0].substring("urn|".length);
            } else {
                // console.warn("Skipping citerelationset block: First processed line does not start with 'urn|'. Line: " + processedLines[0]);
                continue;
            }

            // Optional: check for label line
            // if (!processedLines[1].startsWith("label|")) {
            //     console.warn("Skipping citerelationset block: Second processed line does not start with 'label|'. Line: " + processedLines[1]);
            //     continue;
            // }

            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2];
                if (headerLine !== expectedHeader) {
                    console.warn(`Skipping DSE block ${currentBlockUrn}: Header mismatch. Expected "${expectedHeader}", found "${headerLine}".`);
                    continue;
                }

                // Data rows start from index 3 of processedLines
                for (let i = 3; i < processedLines.length; i++) {
                    const dataLine = processedLines[i];
                    const columns = dataLine.split('|');

                    if (columns.length === 3) { // passage, imageroi, surface
                        const record = new DSERecord(columns[0], columns[1], columns[2]);
                        dseRecords.push(record);
                    } else {
                        console.warn(`Skipping data row in DSE block ${currentBlockUrn}: Incorrect number of columns. Expected 3, found ${columns.length}. Row: "${dataLine}"`);
                    }
                }
            }
        }
        return dseRecords;
    }

    // Expose functions and class via the HMTLib namespace
    window.HMTLib.DSERecord = DSERecord;
    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;
    window.HMTLib.hmtdse = hmtdse;

})(window);