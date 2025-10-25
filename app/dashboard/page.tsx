'use client';

import React, { useState } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';

interface TraderGroup {
    long: number;
    short: number;
    spreads?: number;
}

interface COTSection {
    marketName?: string;
    code?: string;
    asOfDate?: string;
    contractSize?: string;
    openInterest?: number;
    changeInOpenInterest?: number;
    totalChangeFromPreviousWeek?: number;
    commitments?: {
        nonCommercial: TraderGroup;
        commercial: TraderGroup;
        total: TraderGroup;
        nonReportable: TraderGroup;
    };
    changes?: {
        nonCommercial: TraderGroup;
        commercial: TraderGroup;
        total: TraderGroup;
        nonReportable: TraderGroup;
    };
    changeFromDate?: string;
    percentOfOpenInterest?: {
        nonCommercial: TraderGroup;
        commercial: TraderGroup;
        total: TraderGroup;
        nonReportable: TraderGroup;
    };
    numberOfTraders?: {
        nonCommercial: TraderGroup;
        commercial: TraderGroup;
        total: TraderGroup;
    };
}

interface COTReport {
    reportType: string;
    sections: COTSection[];
}

export default function COTParser() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<COTReport | null>(null);
    const [error, setError] = useState('');

    // 🔧 Clean helper to convert numbers safely
    const num = (x?: string) => parseFloat((x || '0').replace(/,/g, '')) || 0;

    // ✅ Robust section parser
    const parseSection = (lines: string[], startIdx: number): { section: COTSection; nextIndex: number } => {
        const section: COTSection = {};
        let i = startIdx;

        // --- MARKET HEADER ---
        const headerMatch = lines[i]?.match(/^(.+?)\s+Code-(\S+)/);
        if (headerMatch) {
            section.marketName = headerMatch[1].trim();
            section.code = headerMatch[2].trim();
            i++;
        }

        // --- AS OF DATE ---
        if (lines[i]?.includes('FUTURES ONLY POSITIONS')) {
            const dateMatch = lines[i].match(/AS OF (\d{2}\/\d{2}\/\d{2})/);
            if (dateMatch) section.asOfDate = dateMatch[1];
            i++;
        }

        // --- FIND OPEN INTEREST LINE ---
        while (i < lines.length && !lines[i].includes('OPEN INTEREST')) i++;
        if (i < lines.length && lines[i].includes('OPEN INTEREST')) {
            const contractMatch = lines[i].match(/\((.+?)\)/);
            if (contractMatch) section.contractSize = contractMatch[1];

            const oiMatch = lines[i].match(/OPEN INTEREST:\s*([\d,]+)/);
            if (oiMatch) section.openInterest = num(oiMatch[1]);

            i++;
        }

        // --- SKIP SEPARATOR LINES ---
        while (i < lines.length && lines[i].trim().startsWith('-')) i++;
        if (lines[i]?.includes('LONG') && lines[i]?.includes('SHORT')) i++;
        while (i < lines.length && lines[i].trim().startsWith('-')) i++;

        // --- COMMITMENTS ---
        if (lines[i]?.toUpperCase().includes('COMMITMENTS')) {
            i++;
            const parts = lines[i]?.trim().split(/\s+/) || [];
            if (parts.length >= 9) {
                section.commitments = {
                    nonCommercial: { long: num(parts[0]), short: num(parts[1]), spreads: num(parts[2]) },
                    commercial: { long: num(parts[3]), short: num(parts[4]) },
                    total: { long: num(parts[5]), short: num(parts[6]) },
                    nonReportable: { long: num(parts[7]), short: num(parts[8]) },
                };
            }
            i++;
        }

        // --- CHANGES FROM PREVIOUS WEEK ---
        while (i < lines.length && !lines[i].includes('CHANGES FROM') && !lines[i].includes('CHANGE IN OPEN INTEREST')) i++;
        if (i < lines.length && lines[i].includes('CHANGES FROM')) {
            const dateMatch = lines[i].match(/CHANGES FROM\s+(\d{2}\/\d{2}\/\d{2})/);
            if (dateMatch) section.changeFromDate = dateMatch[1];
            const oiChangeMatch = lines[i].match(/CHANGE IN OPEN INTEREST:\s*([\d,]+)/);
            if (oiChangeMatch) section.changeInOpenInterest = num(oiChangeMatch[1]);
            i++;

            const parts = lines[i]?.trim().split(/\s+/) || [];
            if (parts.length >= 8) {
                section.changes = {
                    nonCommercial: { long: num(parts[0]), short: num(parts[1]), spreads: num(parts[2]) },
                    commercial: { long: num(parts[3]), short: num(parts[4]) },
                    total: { long: num(parts[5]), short: num(parts[6]) },
                    nonReportable: { long: num(parts[7]), short: num(parts[8]) },
                };
                section.totalChangeFromPreviousWeek = (section.changes.total.long ?? 0) - (section.changes.total.short ?? 0);
            }
            i++;
        }

        // --- PERCENT OF OPEN INTEREST ---
        while (i < lines.length && !lines[i].includes('PERCENT OF OPEN INTEREST')) i++;
        if (i < lines.length && lines[i].includes('PERCENT OF OPEN INTEREST')) {
            i++;
            const parts = lines[i]?.trim().split(/\s+/) || [];
            if (parts.length >= 9) {
                section.percentOfOpenInterest = {
                    nonCommercial: { long: num(parts[0]), short: num(parts[1]), spreads: num(parts[2]) },
                    commercial: { long: num(parts[3]), short: num(parts[4]) },
                    total: { long: num(parts[5]), short: num(parts[6]) },
                    nonReportable: { long: num(parts[7]), short: num(parts[8]) },
                };
            }
            i++;
        }

        // --- NUMBER OF TRADERS ---
        while (i < lines.length && !lines[i].includes('NUMBER OF TRADERS')) i++;
        if (i < lines.length && lines[i].includes('NUMBER OF TRADERS')) {
            i++;
            const parts = lines[i]?.trim().split(/\s+/) || [];
            if (parts.length >= 7) {
                section.numberOfTraders = {
                    nonCommercial: { long: num(parts[0]), short: num(parts[1]), spreads: num(parts[2]) },
                    commercial: { long: num(parts[3]), short: num(parts[4]) },
                    total: { long: num(parts[5]), short: num(parts[6]) },
                };
            }
            i++;
        }

        return { section, nextIndex: i };
    };

    // ✅ Parse entire COT file into sections
    const parseCOTReport = (text: string): COTReport => {
        const lines = text.split('\n');
        const result: COTReport = { reportType: 'Disaggregated COT', sections: [] };

        let i = 0;
        while (i < lines.length) {
            if (lines[i]?.includes('Code-')) {
                const { section, nextIndex } = parseSection(lines, i);
                result.sections.push(section);
                i = nextIndex;
            } else {
                i++;
            }
        }
        return result;
    };

    // --- Handlers ---
    const handleParse = () => {
        setError('');
        setOutput(null);

        if (!input.trim()) {
            setError('Please paste COT report text');
            return;
        }

        try {
            const parsed = parseCOTReport(input);
            setOutput(parsed);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleSaveAndDownload = async () => {
        if (!output) return;

        try {
            // 🔹 Save to server-side data folder
            const response = await fetch('/api/save-cot-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(output),
            });

            if (!response.ok) {
                throw new Error('Failed to save data to server');
            }

            const result = await response.json();

            // 🔹 Trigger local file download
            const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cot-report.json';
            a.click();
            URL.revokeObjectURL(url);

            alert(`✅ Data saved successfully to server: ${result.filename}`);
        } catch (err) {
            alert(`❌ Error saving data: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // --- UI ---
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <FileText className="w-10 h-10 text-indigo-600" />
                        <h1 className="text-4xl font-bold text-gray-800">COT Report Parser</h1>
                    </div>
                    <p className="text-gray-600">Convert fixed-width COT reports to structured JSON</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Input */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Input (COT Report Text)</h2>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Paste your COT report here..."
                            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleParse}
                            className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Parse to JSON
                        </button>
                    </div>

                    {/* Output */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-700">Output (JSON)</h2>
                            {output && (
                                <button
                                    onClick={handleSaveAndDownload}
                                    className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download JSON
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="w-full h-96 p-4 border border-gray-300 rounded-lg overflow-auto bg-gray-50">
                            {output ? (
                                <pre className="font-mono text-sm text-gray-800">
                                    {JSON.stringify(output, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-gray-400 text-center mt-20">
                                    Parsed JSON will appear here...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}