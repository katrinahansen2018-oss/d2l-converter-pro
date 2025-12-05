import { ConversionForm } from '@/components/ConversionForm';
import { FileSpreadsheet } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">D2L Converter</h1>
              <p className="text-sm text-muted-foreground">MCQ CSV to Brightspace Format</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Convert Your Questions
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Transform your MCQ CSV files into D2L Brightspace Question Library format. 
            Upload, convert, and download — all in your browser.
          </p>
        </div>

        <ConversionForm />

        {/* Format Info */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">Input Format</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your source CSV should have these columns:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Q Type</code> — Question type (MC)</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Q Text</code> — Question stem</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Question</code> — Question prompt</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Answer</code> — Answer choice text</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Answer Match</code> — Correct/Incorrect</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Notes</code> — Feedback text</li>
            </ul>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">Output Format</h3>
            <p className="text-sm text-muted-foreground mb-3">
              D2L Brightspace Question Library format with:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">NewQuestion</code> — MC type indicator</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">QuestionText</code> — Combined stem</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Points</code> — Question value</li>
              <li>• <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Option</code> — Answer with weight</li>
              <li className="pt-2 text-xs italic">Weight: 100 = correct, 0 = incorrect</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">
            All processing happens locally in your browser. No data is uploaded to any server.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
