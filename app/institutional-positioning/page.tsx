'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface COTData {
    marketName?: string;
    code?: string;
    asOfDate?: string;
    openInterest?: number;
    changeInOpenInterest?: number;
    commitments?: {
        nonCommercial: { long: number; short: number; spreads: number };
        commercial: { long: number; short: number };
        total: { long: number; short: number };
        nonReportable: { long: number; short: number };
    };
    changes?: {
        nonCommercial: { long: number; short: number; spreads: number };
        commercial: { long: number; short: number };
    };
}

interface COTReport {
    reportType: string;
    sections: COTData[];
}

export default function COTTablePage() {
    const [cotData, setCotData] = useState<COTReport | null>(null);
    const [loading, setLoading] = useState(true);

    // 🟩 Define the strict list of allowed assets
    const allowedAssets = [
        'BITCOIN - CHICAGO MERCANTILE EXCHANGE',
        'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE',
        'S&P 500 Consolidated - CHICAGO MERCANTILE EXCHANGE',
        'NZ DOLLAR - CHICAGO MERCANTILE EXCHANGE',
        'NIKKEI STOCK AVERAGE YEN DENOM - CHICAGO MERCANTILE EXCHANGE',
        'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE',
        'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE',
        'EURO FX - CHICAGO MERCANTILE EXCHANGE',
        'BRITISH POUND - CHICAGO MERCANTILE EXCHANGE',
        'NASDAQ MINI - CHICAGO MERCANTILE EXCHANGE',
        'RUSSELL E-MINI - CHICAGO MERCANTILE EXCHANGE',
        'SO AFRICAN RAND - CHICAGO MERCANTILE EXCHANGE',
        'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE',
    ];

    useEffect(() => {
        fetchCOTData();
    }, []);

    const fetchCOTData = async () => {
        try {
            const response = await fetch('/api/get-latest-cot-data');
            const data = await response.json();
            setCotData(data);
        } catch (error) {
            console.error('Error fetching COT data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) =>
        num?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0';

    const calculateNetChange = (section: COTData) => {
        if (!section.commitments || !section.changes) return 0;

        const openInterest = section.openInterest ?? 0;
        const longChange = section.changes.nonCommercial.long ?? 0;
        const shortChange = section.changes.nonCommercial.short ?? 0;

        const changeInNetPosition = longChange - shortChange;

        return openInterest > 0 ? (changeInNetPosition / openInterest) * 100 : 0;
    };

    const calculateNetPosition = (section: COTData) => {
        if (!section.commitments) return 0;
        const long = section.commitments.nonCommercial.long ?? 0;
        const short = section.commitments.nonCommercial.short ?? 0;
        return long - short;
    };


    const calculateLongShortPercent = (section: COTData) => {
        const long = section.commitments?.nonCommercial.long ?? 0;
        const short = section.commitments?.nonCommercial.short ?? 0;
        const total = long + short;
        if (total === 0) return { longPercent: 0, shortPercent: 0 };
        return {
            longPercent: (long / total) * 100,
            shortPercent: (short / total) * 100,
        };
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-blue-600 bg-blue-50';
        if (change < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getPercentColor = (percent: number, isLong: boolean) => {
        if (isLong) {
            return percent > 50
                ? 'bg-blue-600/10 text-blue-700 font-semibold'
                : 'bg-blue-50 text-blue-600';
        } else {
            return percent > 50
                ? 'bg-red-600/10 text-red-700 font-semibold'
                : 'bg-red-50 text-red-600';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading COT data...</div>
            </div>
        );
    }

    if (!cotData || cotData.sections.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">No COT data available</div>
            </div>
        );
    }

    // 🟩 Only include allowed assets
    const filteredSections = cotData.sections.filter((section) => {
        const name = section.marketName?.trim().toUpperCase();
        return allowedAssets.some(
            (asset) => asset.toUpperCase().trim() === name
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-[2000px] mx-auto space-y-6">
                <Card className="border-2 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <CardTitle className="text-3xl font-bold">
                                Institutional Positioning (Selected Assets)
                            </CardTitle>
                            <Badge variant="secondary" className="text-sm px-4 py-2">
                                {cotData.sections[0]?.asOfDate || 'N/A'}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-700 hover:bg-slate-700">
                                        <TableHead className="text-white font-bold text-center sticky left-0 bg-slate-700 z-10">
                                            Asset
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Long
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Short
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Δ Long
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Δ Short
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Open Interest
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Δ Open Interest
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Long %
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Short %
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Net %
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-center">
                                            Net Position
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredSections.map((section, index) => {
                                        const netChange = calculateNetChange(section);
                                        const longChange = section.changes?.nonCommercial.long ?? 0;
                                        const shortChange = section.changes?.nonCommercial.short ?? 0;
                                        const { longPercent, shortPercent } =
                                            calculateLongShortPercent(section);

                                        return (
                                            <TableRow key={index} className="hover:bg-slate-50 border-b">
                                                <TableCell className="font-bold text-center bg-slate-700 text-white sticky left-0 z-10">
                                                    {section.marketName?.split('-')[0]?.trim() || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {formatNumber(section.commitments?.nonCommercial.long || 0)}
                                                </TableCell>
                                                <TableCell className="text-center font-medium bg-slate-50">
                                                    {formatNumber(section.commitments?.nonCommercial.short || 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-semibold ${longChange >= 0
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-red-600 bg-red-50'
                                                        }`}
                                                >
                                                    {longChange >= 0 ? '+' : ''}
                                                    {formatNumber(longChange)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-semibold ${shortChange >= 0
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-red-600 bg-red-50'
                                                        }`}
                                                >
                                                    {shortChange >= 0 ? '+' : ''}
                                                    {formatNumber(shortChange)}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold bg-slate-100">
                                                    {formatNumber(section.openInterest || 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-semibold ${(section.changeInOpenInterest ?? 0) >= 0
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-red-600 bg-red-50'
                                                        }`}
                                                >
                                                    {(section.changeInOpenInterest ?? 0) >= 0 ? '+' : ''}
                                                    {formatNumber(section.changeInOpenInterest ?? 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-bold ${getPercentColor(
                                                        longPercent,
                                                        true
                                                    )}`}
                                                >
                                                    {longPercent.toFixed(2)}%
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-bold ${getPercentColor(
                                                        shortPercent,
                                                        false
                                                    )}`}
                                                >
                                                    {shortPercent.toFixed(2)}%
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded font-bold ${getChangeColor(
                                                            netChange
                                                        )}`}
                                                    >
                                                        {netChange > 0 ? (
                                                            <ArrowUpIcon className="w-4 h-4" />
                                                        ) : netChange < 0 ? (
                                                            <ArrowDownIcon className="w-4 h-4" />
                                                        ) : null}
                                                        {netChange.toFixed(2)}%
                                                    </div>
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center font-semibold ${calculateNetPosition(section) > 0
                                                            ? 'text-blue-600 bg-blue-50'
                                                            : calculateNetPosition(section) < 0
                                                                ? 'text-red-600 bg-red-50'
                                                                : 'text-gray-600 bg-gray-50'
                                                        }`}
                                                >
                                                    {calculateNetPosition(section) >= 0 ? '+' : ''}
                                                    {formatNumber(calculateNetPosition(section))}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {filteredSections.length === 0 && (
                                <div className="text-center text-gray-500 py-6">
                                    No allowed assets found in this report.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
