import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { convertToD2L, ConversionResult } from '@/lib/csvConverter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, AlertCircle, CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ConversionForm() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileSelect = (content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
    setResult(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!fileContent) return;

    setIsConverting(true);
    setError(null);

    try {
      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));
      const conversionResult = convertToD2L(fileContent, points);
      setResult(conversionResult);
      toast({
        title: 'Conversion Complete',
        description: `Converted ${conversionResult.questionsCount} questions with ${conversionResult.optionsCount} options.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Conversion failed';
      setError(message);
      toast({
        title: 'Conversion Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.csv', '') + '_D2L.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFileContent(null);
    setFileName('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      {!fileContent ? (
        <FileUpload onFileSelect={handleFileSelect} />
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-sm text-muted-foreground">Ready to convert</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Change File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {fileContent && !result && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Conversion Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label htmlFor="points" className="text-sm font-medium">
                Points per Question
              </Label>
              <Input
                id="points"
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 1)}
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full sm:w-auto"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to D2L Format'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Conversion Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Success Summary */}
          <Card className="bg-success/10 border-success/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-success">Conversion Successful</p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{result.questionsCount}</p>
                      <p className="text-sm text-muted-foreground">Questions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{result.optionsCount}</p>
                      <p className="text-sm text-muted-foreground">Options</p>
                    </div>
                    {result.skippedRows > 0 && (
                      <div>
                        <p className="text-2xl font-bold text-warning">{result.skippedRows}</p>
                        <p className="text-sm text-muted-foreground">Skipped</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="bg-warning/10 border-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Warnings ({result.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Download Button */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Download D2L CSV
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Convert Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
