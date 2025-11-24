import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!window.mermaid) {
        setError('Mermaid.js library not loaded.');
        return;
      }

      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Merriweather, serif', // Match academic font
          flowchart: {
            htmlLabels: true,
            curve: 'basis'
          }
        });

        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        
        // Render the diagram
        const { svg } = await window.mermaid.render(id, chart);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError("Diagram syntax error.");
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="my-8 p-6 bg-amber-50 border-l-4 border-amber-600 rounded-r-sm no-break-inside print:border print:border-gray-300">
        <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2 font-sans">
          Figure Rendering Limitation
        </h4>
        <p className="text-sm text-amber-800 mb-4 academic-text italic">
          The conceptual framework generated for this section contains complex relationships that could not be visually rendered. 
          Please use the <strong>Edit Paper</strong> button to manually correct the syntax (ensure all labels are in double quotes).
        </p>
        <div className="bg-white border border-amber-200 p-4 rounded shadow-inner">
             <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">
                {chart}
            </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 flex flex-col items-center justify-center break-inside-avoid">
      <div 
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }} 
        className="w-full overflow-x-auto flex justify-center bg-white p-4"
      />
      <p className="mt-4 text-sm text-gray-600 italic font-serif text-center">
        <strong>Figure 1.</strong> Theoretical Framework and Process Flow.
      </p>
    </div>
  );
};

export default MermaidDiagram;