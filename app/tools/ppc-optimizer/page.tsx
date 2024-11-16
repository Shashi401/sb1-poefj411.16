"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';

interface PPCData {
  id: string;
  Keyword: string;
  'Match Type': string;
  'CPC (USD)': number;
  ACOS: number;
  ROAS: number;
  'Target ACOS': number;
  'New Max Bid': number;
  [key: string]: any;
}

export default function PPCOptimizerPage() {
  const [data, setData] = useState<PPCData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const calculateNewMaxBid = (cpc: number, acos: number, targetAcos: number): number => {
    if (acos < (0.84 * targetAcos)) {
      return cpc * 1.2;
    } else {
      return (cpc / acos) * targetAcos;
    }
  };

  const findColumnValue = (row: any, possibleNames: string[]): any => {
    const columnName = Object.keys(row).find(key => 
      possibleNames.some(name => 
        key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(
          name.toLowerCase().replace(/[^a-z0-9]/g, '')
        )
      )
    );
    return columnName ? row[columnName] : '';
  };

  const processData = (rawData: any[]): PPCData[] => {
    return rawData.map((row, index) => {
      // Find CPC value using various possible column names
      const cpcValue = findColumnValue(row, ['cpc', 'cost per click', 'costperclick', 'cost']);
      const cpc = typeof cpcValue === 'number' ? cpcValue : 
                 parseFloat(cpcValue.toString().replace(/[^0-9.-]+/g, '')) || 0;

      // Find ACOS value
      const acosValue = findColumnValue(row, ['acos', 'advertising cost of sale', 'cost of sale']);
      let acos: number;
      if (typeof acosValue === 'number') {
        acos = acosValue;
      } else {
        const acosString = acosValue.toString().replace(/[^0-9.-]+/g, '');
        acos = parseFloat(acosString);
      }
      // If ACOS is already in percentage form (e.g., 15 instead of 0.15)
      const normalizedAcos = acos * 100;

      // Find ROAS value
      const roasValue = findColumnValue(row, ['roas', 'return on ad spend', 'return on spend']);
      const roas = typeof roasValue === 'number' ? roasValue :
                  parseFloat(roasValue.toString().replace(/[^0-9.-]+/g, '')) || 0;

      // Find Keyword
      const keyword = findColumnValue(row, ['keyword', 'targeting', 'search term', 'searchterm']);

      // Find Match Type
      const matchType = findColumnValue(row, ['match type', 'matchtype', 'targeting type', 'targetingtype']);

      const targetAcos = 30; // Default target ACOS

      return {
        id: `row-${index}`,
        Keyword: keyword.toString(),
        'Match Type': matchType.toString(),
        'CPC (USD)': cpc,
        ACOS: normalizedAcos,
        ROAS: roas,
        'Target ACOS': targetAcos,
        'New Max Bid': calculateNewMaxBid(cpc, normalizedAcos, targetAcos),
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setIsLoading(true);
    setData([]);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          let workbook: XLSX.WorkBook;
          
          if (file.name.endsWith('.csv')) {
            const csvText = event.target?.result as string;
            workbook = XLSX.read(csvText, { type: 'string' });
          } else {
            const binaryString = event.target?.result;
            workbook = XLSX.read(binaryString, { type: 'binary' });
          }

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON with raw values
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: '',
          });

          if (jsonData.length > 0) {
            console.log('Raw data:', jsonData[0]); // Debug log
            const processedData = processData(jsonData);
            setData(processedData);
            toast({
              title: "File loaded successfully",
              description: `Loaded ${processedData.length} rows of data`,
            });
          } else {
            throw new Error("No data found in file");
          }
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            title: "Error processing file",
            description: "Please ensure your file contains valid PPC campaign data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Failed to read the file",
          variant: "destructive",
        });
        setIsLoading(false);
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      console.error('File handling error:', error);
      toast({
        title: "Error processing file",
        description: "An unexpected error occurred while processing the file",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatValue = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleTargetACOSChange = (id: string, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    setData(prevData => 
      prevData.map(row => {
        if (row.id === id) {
          const newTargetAcos = numericValue;
          const newMaxBid = calculateNewMaxBid(row['CPC (USD)'], row.ACOS, newTargetAcos);
          return { 
            ...row, 
            'Target ACOS': newTargetAcos,
            'New Max Bid': newMaxBid
          };
        }
        return row;
      })
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PPC Data Upload</CardTitle>
          <CardDescription>
            Upload your Excel (.xlsx, .xls) or CSV file containing PPC campaign data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Campaign Data File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {(data.length > 0 || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Analysis of your PPC campaign metrics. Target ACOS can be adjusted per keyword.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="rounded-md border h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="min-w-[200px]">Keyword</TableHead>
                    <TableHead className="min-w-[120px]">Match Type</TableHead>
                    <TableHead className="min-w-[120px] text-right">CPC (USD)</TableHead>
                    <TableHead className="min-w-[120px] text-right">ACOS (%)</TableHead>
                    <TableHead className="min-w-[120px] text-right">ROAS</TableHead>
                    <TableHead className="min-w-[140px] text-right">Target ACOS (%)</TableHead>
                    <TableHead className="min-w-[140px] text-right">New Max Bid ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <span className="text-sm text-muted-foreground">Processing data...</span>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <span className="text-sm text-muted-foreground">No data available</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.Keyword}</TableCell>
                        <TableCell>{row['Match Type']}</TableCell>
                        <TableCell className="text-right">${formatValue(row['CPC (USD)'])}</TableCell>
                        <TableCell className="text-right">{formatValue(row.ACOS)}%</TableCell>
                        <TableCell className="text-right">{formatValue(row.ROAS)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={row['Target ACOS']}
                            onChange={(e) => handleTargetACOSChange(row.id, e.target.value)}
                            className="w-24 ml-auto text-right"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell className="text-right">${formatValue(row['New Max Bid'])}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}