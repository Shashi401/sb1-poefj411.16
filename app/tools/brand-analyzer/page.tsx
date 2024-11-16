"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

interface BrandShareData {
  'Search Query': string;
  'Impressions: Brand Share %': number;
  'Clicks: Brand Share %': number;
  'Cart Adds: Brand Share %': number;
}

export default function BrandAnalyzerPage() {
  const [data, setData] = useState<BrandShareData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processData = (rawData: any[]): BrandShareData[] => {
    return rawData
      .filter(row => {
        // Convert percentage strings to numbers and handle both decimal and percentage formats
        const impressionShare = parseFloat(row['Impressions: Brand Share %'].toString().replace('%', '')) / 100;
        const clickShare = parseFloat(row['Clicks: Brand Share %'].toString().replace('%', '')) / 100;
        const cartAddsShare = parseFloat(row['Cart Adds: Brand Share %'].toString().replace('%', '')) / 100;

        // Apply the filtering conditions
        return (
          impressionShare < cartAddsShare &&
          clickShare < cartAddsShare &&
          impressionShare < 0.8
        );
      })
      .map(row => ({
        'Search Query': row['Search Query'],
        'Impressions: Brand Share %': parseFloat(row['Impressions: Brand Share %'].toString().replace('%', '')) / 100,
        'Clicks: Brand Share %': parseFloat(row['Clicks: Brand Share %'].toString().replace('%', '')) / 100,
        'Cart Adds: Brand Share %': parseFloat(row['Cart Adds: Brand Share %'].toString().replace('%', '')) / 100,
      }));
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

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON with raw values
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: '',
            range: 1  // Start reading from the second row
          });

          if (jsonData.length > 0) {
            const processedData = processData(jsonData);
            setData(processedData);
            toast({
              title: "File loaded successfully",
              description: `Found ${processedData.length} opportunities for brand share improvement`,
            });
          } else {
            throw new Error("No data found in file");
          }
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            title: "Error processing file",
            description: "Please ensure your file contains valid brand metrics data",
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

  const formatPercentage = (value: number): string => {
    return (value * 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%';
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please load and analyze data before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format data for export with percentages
      const exportData = data.map(row => ({
        'Search Query': row['Search Query'],
        'Impressions: Brand Share %': formatPercentage(row['Impressions: Brand Share %']),
        'Clicks: Brand Share %': formatPercentage(row['Clicks: Brand Share %']),
        'Cart Adds: Brand Share %': formatPercentage(row['Cart Adds: Brand Share %']),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 40 }, // Search Query
        { wch: 20 }, // Impressions
        { wch: 20 }, // Clicks
        { wch: 20 }, // Cart Adds
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Brand Share Analysis');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `brand-share-analysis-${timestamp}`;

      if (format === 'xlsx') {
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        XLSX.writeFile(wb, `${filename}.csv`);
      }

      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()} file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Share Analysis</CardTitle>
          <CardDescription>
            Upload your Excel (.xlsx, .xls) or CSV file to analyze brand share metrics and identify opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Brand Metrics File</Label>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Brand Share Opportunities</CardTitle>
              <CardDescription>
                Search queries where brand share metrics indicate growth potential
              </CardDescription>
            </div>
            {data.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="rounded-md border h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="min-w-[300px]">Search Query</TableHead>
                    <TableHead className="text-right">Impression Share</TableHead>
                    <TableHead className="text-right">Click Share</TableHead>
                    <TableHead className="text-right">Cart Adds Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <span className="text-sm text-muted-foreground">Processing data...</span>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        <span className="text-sm text-muted-foreground">No opportunities found</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row['Search Query']}</TableCell>
                        <TableCell className="text-right">{formatPercentage(row['Impressions: Brand Share %'])}</TableCell>
                        <TableCell className="text-right">{formatPercentage(row['Clicks: Brand Share %'])}</TableCell>
                        <TableCell className="text-right">{formatPercentage(row['Cart Adds: Brand Share %'])}</TableCell>
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