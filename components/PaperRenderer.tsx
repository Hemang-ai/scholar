import React, { useMemo } from 'react';
import MermaidDiagram from './MermaidDiagram';
import { PaperSection } from '../types';

interface PaperRendererProps {
  content: string;
}

const PaperRenderer: React.FC<PaperRendererProps> = ({ content }) => {
  
  // Custom parser to split markdown into renderable chunks
  const sections: PaperSection[] = useMemo(() => {
    const result: PaperSection[] = [];
    
    // Split by mermaid blocks first
    const mermaidRegex = /```mermaid([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      // Add text before the mermaid block
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }

      // Add the mermaid block
      result.push({
        type: 'mermaid',
        content: match[1].trim(),
      });

      lastIndex = mermaidRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return result;
  }, [content]);

  // Helper to process markdown text (headers, bold, lists, tables)
  const renderTextContent = (text: string) => {
    // Split roughly by double newlines for paragraphs
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      // Handle Tables
      if (line.trim().startsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        inTable = false;
        // Render accumulated table
        elements.push(renderTable(tableBuffer, `table-${idx}`));
        tableBuffer = [];
      }

      const trimmed = line.trim();
      if (!trimmed) return;

      // Headers
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={idx} className="text-xl font-bold text-gray-800 mt-6 mb-3 font-sans">{parseFormatting(trimmed.substring(4))}</h3>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b pb-2 font-sans">{parseFormatting(trimmed.substring(3))}</h2>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h1 key={idx} className="text-4xl font-extrabold text-gray-900 mt-4 mb-6 text-center font-sans leading-tight">{parseFormatting(trimmed.substring(2))}</h1>);
      } 
      // Lists
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(<li key={idx} className="ml-6 list-disc text-gray-800 leading-relaxed mb-1 academic-text">{parseFormatting(trimmed.substring(2))}</li>);
      } else if (/^\d+\./.test(trimmed)) {
        elements.push(<li key={idx} className="ml-6 list-decimal text-gray-800 leading-relaxed mb-1 academic-text">{parseFormatting(trimmed.replace(/^\d+\.\s*/, ''))}</li>);
      }
      // Standard Paragraphs
      else {
        elements.push(<p key={idx} className="mb-4 text-gray-800 leading-7 text-justify academic-text">{parseFormatting(trimmed)}</p>);
      }
    });

    // Flush remaining table if ends with table
    if (inTable && tableBuffer.length > 0) {
      elements.push(renderTable(tableBuffer, `table-end`));
    }

    return elements;
  };

  const renderTable = (rows: string[], key: string) => {
    // Basic Markdown Table Parser
    const headerRow = rows[0];
    const headers = headerRow.split('|').filter(c => c.trim() !== '').map(c => c.trim());
    
    // Skip divider row (contains ---)
    const bodyRows = rows.slice(2).map(row => 
      row.split('|').filter(c => c.trim() !== '').map(c => c.trim())
    );

    return (
      <div key={key} className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse border border-gray-300 text-sm academic-text">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-gray-300 px-4 py-2 font-semibold text-left text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-gray-300 px-4 py-2 text-gray-800">{parseFormatting(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-center text-gray-500 mt-2 italic">Table: Statistical Summary</p>
      </div>
    );
  };

  const parseFormatting = (text: string): React.ReactNode => {
    // Very basic bold/italic parser for React text
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="bg-white p-8 md:p-16 shadow-lg max-w-4xl mx-auto min-h-screen">
      {sections.map((section, idx) => {
        if (section.type === 'mermaid') {
          return <MermaidDiagram key={idx} chart={section.content} />;
        } else {
          return <div key={idx}>{renderTextContent(section.content)}</div>;
        }
      })}
    </div>
  );
};

export default PaperRenderer;