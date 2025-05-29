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
this.sequence = parseFloat(sequence); // Ensure sequence is numeric
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
console.error("hmtcurrent: CEXParser is not defined. Ensure cex-lib.js is loaded.");
return Promise.reject(new Error("CEXParser is not defined."));
        }
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
// URNTools.workcomponent might not exist or might not be the right tool if URNs are not fully canonical
// A simple string check for ".normalized" in the URN might be more robust if URNTools is missing/old
let workComponent = '';
if (typeof URNTools.workcomponent === 'function') {
    workComponent = URNTools.workcomponent(urnString);
} else if (urnString.includes('.normalized')) { // Fallback if URNTools.workcomponent is not available
    workComponent = '.normalized'; // Dummy value to pass the check
}

if (workComponent && workComponent.endsWith('.normalized')) {
filteredRecords.push(trimmedLine);
                    } else if (urnString.includes('.normalized') && typeof URNTools.workcomponent !== 'function') {
                        // Fallback for cases where URNTools.workcomponent is unavailable but URN contains the target string
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
let workComponent = '';
if (typeof URNTools.workcomponent === 'function') {
    workComponent = URNTools.workcomponent(urnString);
} else if (urnString.includes('.diplomatic')) { // Fallback
    workComponent = '.diplomatic';
}
if (workComponent && workComponent.endsWith('.diplomatic')) {
filteredRecords.push(trimmedLine);
                    } else if (urnString.includes('.diplomatic') && typeof URNTools.workcomponent !== 'function') {
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
if (!(parserInstance instanceof CEXParser)) { console.error("hmtdse: Invalid parserInstance."); return []; }
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
if (headerLine !== expectedHeader) { console.warn(`hmtdse: Header mismatch in ${currentBlockUrn}. Expected "${expectedHeader}", found "${headerLine}".`); continue; }
for (let i = 3; i < processedLines.length; i++) {
const columns = processedLines[i].split('|');
if (columns.length === 3) {
dseRecords.push(new HMTLib.DSERecord(columns[0], columns[1], columns[2]));
                    } else {
console.warn(`hmtdse: Incorrect column count in ${currentBlockUrn}, row: "${processedLines[i]}"`);
                    }
                }
            }
        }
return dseRecords;
    }

function recordsforpage(pageUrn, dseRecordsArray) {
if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) { console.error("recordsforpage: Invalid input."); return []; }
return dseRecordsArray.filter(r => r instanceof HMTLib.DSERecord && r.surface === pageUrn);
    }

function recordforpassage(passageUrn, dseRecordsArray) {
if (!passageUrn || typeof passageUrn !== 'string' || !Array.isArray(dseRecordsArray)) { console.error("recordforpassage: Invalid input."); return null; }
return dseRecordsArray.find(r => r instanceof HMTLib.DSERecord && r.passage === passageUrn) || null;
    }

function imageforpage(pageUrn, dseRecordsArray) {
if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) { console.error("imageforpage: Invalid input."); return null; }
const recs = HMTLib.recordsforpage(pageUrn, dseRecordsArray);
if (recs.length > 0 && recs[0].imageroi && typeof recs[0].imageroi === 'string') {
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
const processed = [];
for (const line of lines) {
const trimmed = line.trim();
if (trimmed !== '' && !trimmed.startsWith('//')) processed.push(trimmed);
            }
if (processed.length < 3) continue;
let blockUrn = processed[0].startsWith("urn|") ? processed[0].substring("urn|".length) : null;
if (!blockUrn) continue;
if (blockUrn === targetUrn) {
if (processed[2] !== expectedHeader) { console.warn(`hmtscholia: Header mismatch in ${blockUrn}. Expected "${expectedHeader}", found "${processed[2]}".`); continue; }
for (let i = 3; i < processed.length; i++) {
const cols = processed[i].split('|');
if (cols.length === 2) {
scholiaRecords.push(new HMTLib.Scholion(cols[0], cols[1]));
                    } else {
console.warn(`hmtscholia: Incorrect column count in ${blockUrn}, row: "${processed[i]}"`);
                    }
                }
            }
        }
return scholiaRecords;
    }

function passageforscholion(scholionUrn, scholiaArray) {
if (!scholionUrn || typeof scholionUrn !== 'string' || !Array.isArray(scholiaArray)) { console.error("passageforscholion: Invalid input."); return null; }
const found = scholiaArray.find(s => s instanceof HMTLib.Scholion && s.scholion === scholionUrn);
return found ? found.iliad : null;
    }

function scholiaforpassage(iliadUrn, scholiaArray) {
if (!iliadUrn || typeof iliadUrn !== 'string' || !Array.isArray(scholiaArray)) { console.error("scholiaforpassage: Invalid input."); return []; }
return scholiaArray.filter(s => s instanceof HMTLib.Scholion && s.iliad === iliadUrn).map(s => s.scholion);
    }
function codex(parserInstance, codexUrnPrefix) {
const codexPagesResult = [];
const requiredColumns = ['urn', 'sequence', 'image', 'rv', 'label'];
if (!(parserInstance instanceof CEXParser)) { console.error("codex: Invalid parserInstance provided."); return []; }
if (typeof codexUrnPrefix !== 'string' || !codexUrnPrefix.endsWith(':')) { console.error("codex: codexUrnPrefix must be a string ending with a colon."); return []; }
if (typeof URNTools === 'undefined') { console.error("codex: URNTools is not defined."); return []; }
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
if (typeof columnIndexMap[colName] === 'undefined') { console.warn(`codex: Skipping citedata block - header missing '${colName}'. Header: "${headerLine}"`); missingColumn = true; break; }
            }
if (missingColumn) continue;
for (let i = dataLinesStartIdx; i < lines.length; i++) {
const trimmedLine = lines[i].trim();
if (trimmedLine === '' || trimmedLine.startsWith('//')) continue;
const columnValues = trimmedLine.split('|');
let maxRequiredIndex = 0;
for (const rc of requiredColumns) { if (columnIndexMap[rc] > maxRequiredIndex) maxRequiredIndex = columnIndexMap[rc]; }
if (columnValues.length <= maxRequiredIndex) continue;
const currentRowFullUrn = columnValues[columnIndexMap['urn']].trim();

// Check if URNTools and its functions are available before calling
let isValid = false;
if (typeof URNTools.isValidCite2Urn === 'function') {
    isValid = URNTools.isValidCite2Urn(currentRowFullUrn);
} else {
    // Fallback or warning if URNTools.isValidCite2Urn is not available
    // console.warn("codex: URNTools.isValidCite2Urn is not available. Assuming URN is valid if it starts with 'urn:cite2:'.");
    isValid = currentRowFullUrn.startsWith("urn:cite2:");
}
if (!isValid) continue;

const rowNamespace = (typeof URNTools.cite2namespace === 'function') ? URNTools.cite2namespace(currentRowFullUrn) : currentRowFullUrn.split(':')[2];
const rowCollection = (typeof URNTools.collectioncomponent === 'function') ? URNTools.collectioncomponent(currentRowFullUrn) : currentRowFullUrn.split(':')[3];

if (!rowNamespace || !rowCollection) continue;
const currentRowPrefix = `urn:cite2:${rowNamespace}:${rowCollection}:`;
if (currentRowPrefix === codexUrnPrefix) {
try {
const sequenceStr = columnValues[columnIndexMap['sequence']].trim();
if (isNaN(parseFloat(sequenceStr))) continue;
const image = columnValues[columnIndexMap['image']].trim();
const rv = columnValues[columnIndexMap['rv']].trim();
const label = columnValues[columnIndexMap['label']].trim();
codexPagesResult.push(new HMTLib.CodexPage(sequenceStr, image, currentRowFullUrn, rv, label));
                    } catch (e) { console.error(`codex: Error creating CodexPage for row "${trimmedLine}". Error: ${e.message}`); }
                }
            }
        }
return codexPagesResult;
    }

function collectionlabel(collectionCite2Urn, parserInstance) {
if (!collectionCite2Urn || typeof collectionCite2Urn !== 'string') { console.error("collectionlabel: collectionCite2Urn invalid."); return null; }
if (!(parserInstance instanceof CEXParser)) { console.error("collectionlabel: parserInstance invalid."); return null; }
const dataString = parserInstance.getDelimitedData("citecollections");
if (!dataString) return null;
const lines = dataString.split('\n');
if (lines.length < 1) return null;
const headerParts = lines[0].split('|').map(h => h.trim());
const urnIndex = headerParts.indexOf("URN");
const descriptionIndex = headerParts.indexOf("Description");
if (urnIndex === -1 || descriptionIndex === -1) { console.error("collectionlabel: 'URN' or 'Description' not in 'citecollections' header."); return null; }
for (let i = 1; i < lines.length; i++) {
const line = lines[i].trim();
if (line === "") continue;
const rowParts = line.split('|');
if (rowParts.length > Math.max(urnIndex, descriptionIndex)) {
if (rowParts[urnIndex].trim() === collectionCite2Urn) {
return rowParts[descriptionIndex].trim();
                }
            }
        }
return null;
    }

function textlabel(textCtsUrn, parserInstance) {
if (!textCtsUrn || typeof textCtsUrn !== 'string') { console.error("textlabel: textCtsUrn invalid."); return null; }
if (!(parserInstance instanceof CEXParser)) { console.error("textlabel: parserInstance invalid."); return null; }
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
if (colIndices.urn === -1 || colIndices.groupName === -1 || colIndices.workTitle === -1 || colIndices.versionLabel === -1) { console.error("textlabel: Required columns not in 'ctscatalog' header."); return null; }
for (let i = 1; i < lines.length; i++) {
const line = lines[i].trim();
if (line === "") continue;
const rowParts = line.split('|');
if (rowParts.length <= colIndices.urn) continue;
if (rowParts[colIndices.urn].trim() === textCtsUrn) {
if (rowParts.length <= Math.max(colIndices.groupName, colIndices.workTitle, colIndices.versionLabel)) return null;
const group = rowParts[colIndices.groupName].trim();
const work = rowParts[colIndices.workTitle].trim();
const version = rowParts[colIndices.versionLabel].trim();
let exemplar = "";
if (colIndices.exemplarLabel !== -1 && rowParts.length > colIndices.exemplarLabel && rowParts[colIndices.exemplarLabel]) {
exemplar = rowParts[colIndices.exemplarLabel].trim();
                }
let label = `${group}, ${work} (${version})`;
if (exemplar) {
label += ` ${exemplar}`; // Added space before exemplar
                }
return label;
            }
        }
return null;
    }

function codexlist(parserInstance) {
if (!(parserInstance instanceof CEXParser)) { console.error("codexlist: Invalid parserInstance."); return []; }
if (typeof parserInstance.getCollectionsForModel !== 'function') { console.error("codexlist: parserInstance.getCollectionsForModel is not a function."); return []; }
const targetModelValue = "urn:cite2:hmt:datamodels.v1:codexmodel";
try {
return parserInstance.getCollectionsForModel(targetModelValue);
        } catch (e) {
console.error("codexlist: Error calling parserInstance.getCollectionsForModel:", e);
return [];
        }
    }

function codexmenu(parserInstance, selectName, selectId) {
if (!(parserInstance instanceof CEXParser)) {
console.error("codexmenu: Invalid parserInstance.");
return `<select name="${selectName}" id="${selectId}"><option value="">Error: Invalid Parser</option></select>`;
        }
if (typeof HMTLib.codexlist !== 'function') {
console.error("codexmenu: HMTLib.codexlist is not defined.");
return `<select name="${selectName}" id="${selectId}"><option value="">Error: codexlist fn missing</option></select>`;
        }
if (typeof HMTLib.collectionlabel !== 'function') {
console.error("codexmenu: HMTLib.collectionlabel is not defined.");
return `<select name="${selectName}" id="${selectId}"><option value="">Error: collectionlabel fn missing</option></select>`;
        }

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
const selectHtml = `<select name="${selectName}" id="${selectId}">\n${optionsHtml}</select>`;
return selectHtml;
    }

// --- NEW text_for_hmturn FUNCTION ---
/**
 * Retrieves text from a corpus based on a passage identifier and exemplar.
 * Modifies the passage identifier to include the exemplar, and for scholia,
 * searches for .lemma and .comment versions.
 *
 * @param {string} passageIdentifier - The base CTS URN for the passage (e.g., "urn:cts:greekLit:tlg0012.tlg001.msA:1.1").
 * @param {string} exemplar - The exemplar to append (e.g., "normalized", "diplomatic").
 * @param {string} corpusString - A string containing the corpus data, with each entry as "URN|text" on a new line.
 * @returns {string} A string containing all matching lines from the corpus (URN|text), joined by newlines. Returns an empty string if no matches or on error.
 */
function text_for_hmturn(passageIdentifier, exemplar, corpusString) {
    if (typeof passageIdentifier !== 'string' || passageIdentifier.trim() === '') {
        // console.warn("text_for_hmturn: passageIdentifier must be a non-empty string. Received:", passageIdentifier);
        return ""; // Fail quietly if passageIdentifier is invalid, as it might come from data.
    }
    if (typeof exemplar !== 'string' || exemplar.trim() === '') {
        console.error("text_for_hmturn: exemplar must be a non-empty string. Received:", exemplar);
        return "";
    }
    if (typeof corpusString !== 'string') {
        console.error("text_for_hmturn: corpusString must be a string. Received type:", typeof corpusString);
        return "";
    }

    const parts = passageIdentifier.split(':');
    // According to prompt, input passageIdentifier has 5 colon-separated parts.
    // Example: urn:cts:greekLit:tlg0012.tlg001.msA:1.1
    // parts[0]=urn, parts[1]=cts, parts[2]=greekLit, parts[3]=tlg0012.tlg001.msA, parts[4]=1.1
    if (parts.length !== 5) {
        console.warn(`text_for_hmturn: passageIdentifier was expected to have 5 colon-separated parts. Received: "${passageIdentifier}" which has ${parts.length} parts. Cannot reliably construct search URN.`);
        return "";
    }
    
    // The 4th part (index 3) identifies the work. Append ".exemplar" to it.
    const workComponentOriginal = parts[3];
    const modifiedWorkComponent = `${workComponentOriginal}.${exemplar}`;
    
    // Construct the base URN for searching (before .lemma/.comment for scholia)
    const baseSearchUrn = `${parts[0]}:${parts[1]}:${parts[2]}:${modifiedWorkComponent}:${parts[4]}`;

    const SCHOLION_PREFIX = "urn:cts:greekLit:tlg5026";
    const isScholion = baseSearchUrn.startsWith(SCHOLION_PREFIX);
    
    const searchUrns = [];
    if (isScholion) {
        searchUrns.push(`${baseSearchUrn}.lemma`);
        searchUrns.push(`${baseSearchUrn}.comment`);
    } else {
        searchUrns.push(baseSearchUrn);
    }
    
    // For debugging:
    // console.log(`text_for_hmturn: Input URN: ${passageIdentifier}, Exemplar: ${exemplar}`);
    // console.log(`text_for_hmturn: Constructed base search URN: ${baseSearchUrn}`);
    // console.log(`text_for_hmturn: Is Scholion: ${isScholion}, Final search URNs: ${searchUrns.join(', ')}`);

    const corpusLines = corpusString.split('\n');
    const matchedLines = [];

    for (const line of corpusLines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;

        const pipeIndex = trimmedLine.indexOf('|');
        if (pipeIndex === -1) continue; // Malformed line, no pipe delimiter
        
        const currentUrnInCorpus = trimmedLine.substring(0, pipeIndex);
        
        if (searchUrns.includes(currentUrnInCorpus)) {
            matchedLines.push(trimmedLine);
        }
    }

    return matchedLines.join('\n');
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
window.HMTLib.text_for_hmturn = text_for_hmturn; // New function exposed

})(window);