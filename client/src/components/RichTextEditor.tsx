import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const wrapSelection = (tag: string, attributes: string = '') => {
    if (editorRef.current) {
      // Ensure editor has focus
      editorRef.current.focus();
      
      // Small delay to ensure focus is established
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          if (selectedText) {
            // For basic formatting, use execCommand which handles toggling automatically
            if (tag === 'strong') {
              document.execCommand('bold', false);
            } else if (tag === 'em') {
              document.execCommand('italic', false);
            } else if (tag === 'u') {
              document.execCommand('underline', false);
            } else if (tag === 's') {
              document.execCommand('strikeThrough', false);
            } else if (tag === 'a' && attributes) {
              // Handle links
              const hrefMatch = attributes.match(/href="([^"]+)"/);
              if (hrefMatch) {
                document.execCommand('createLink', false, hrefMatch[1]);
              }
            } else if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
              // Check if selection is already within a heading element
              let currentHeading: HTMLElement | null = null;
              let container = range.commonAncestorContainer;
              
              // Find the current heading element if it exists
              if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement!;
              }
              
              // Walk up the DOM tree to find if we're inside a heading
              let element = container as HTMLElement;
              while (element && element !== editorRef.current) {
                if (element.tagName && ['H1', 'H2', 'H3'].indexOf(element.tagName) !== -1) {
                  currentHeading = element;
                  break;
                }
                element = element.parentElement!;
              }
              
              // If we're already in a heading, replace it entirely
              if (currentHeading) {
                const newHeading = document.createElement(tag);
                newHeading.textContent = currentHeading.textContent;
                
                // Apply appropriate styling based on heading level
                if (tag === 'h1') {
                  newHeading.style.fontSize = '2.5em';
                  newHeading.style.fontWeight = 'bold';
                  newHeading.style.margin = '16px 0';
                } else if (tag === 'h2') {
                  newHeading.style.fontSize = '2em';
                  newHeading.style.fontWeight = 'bold';
                  newHeading.style.margin = '12px 0';
                } else if (tag === 'h3') {
                  newHeading.style.fontSize = '1.5em';
                  newHeading.style.fontWeight = 'bold';
                  newHeading.style.margin = '8px 0';
                }
                
                currentHeading.parentNode!.replaceChild(newHeading, currentHeading);
              } else {
                // Create new heading for selected text
                const headingElement = document.createElement(tag);
                headingElement.textContent = selectedText;
                
                // Apply appropriate styling based on heading level
                if (tag === 'h1') {
                  headingElement.style.fontSize = '2.5em';
                  headingElement.style.fontWeight = 'bold';
                  headingElement.style.margin = '16px 0';
                } else if (tag === 'h2') {
                  headingElement.style.fontSize = '2em';
                  headingElement.style.fontWeight = 'bold';
                  headingElement.style.margin = '12px 0';
                } else if (tag === 'h3') {
                  headingElement.style.fontSize = '1.5em';
                  headingElement.style.fontWeight = 'bold';
                  headingElement.style.margin = '8px 0';
                }
                
                              range.deleteContents();
              range.insertNode(headingElement);
              }
            } else if (tag === 'p') {
              const element = document.createElement('p');
              element.textContent = selectedText;
              element.style.margin = '5px 0';
              range.deleteContents();
              range.insertNode(element);
            } else {
              // For other elements, use the manual approach
              const element = document.createElement(tag);
              if (attributes) {
                if (attributes.includes('href=')) {
                  const hrefMatch = attributes.match(/href="([^"]+)"/);
                  if (hrefMatch) {
                    element.setAttribute('href', hrefMatch[1]);
                  }
                  const targetMatch = attributes.match(/target="([^"]+)"/);
                  if (targetMatch) {
                    element.setAttribute('target', targetMatch[1]);
                  }
                } else {
                  element.setAttribute('style', attributes);
                }
              }
              element.textContent = selectedText;
              range.deleteContents();
              range.insertNode(element);
            }
            
            // Clear the selection after applying formatting
            selection.removeAllRanges();
            handleInput();
          }
        }
      }, 10);
    }
  };

  const insertHTML = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        range.insertNode(fragment);
        handleInput();
      } else {
        // Insert at the end if no selection
        editorRef.current.innerHTML += html;
        handleInput();
      }
    }
  };

  const insertTable = (rows: number, cols: number) => {
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="border: 1px solid #666; padding: 8px; min-width: 100px;">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    insertHTML(tableHTML);
  };



  const ToolbarButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    active?: boolean;
  }> = ({ onClick, children, title, active = false }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
        active ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-600 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <ToolbarButton onClick={() => wrapSelection('strong')} title="Bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('em')} title="Italic">
            <span className="text-sm font-italic">i</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('u')} title="Underline">
            <span className="text-sm underline">u</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('s')} title="Strikethrough">
            <span className="text-sm line-through">S</span>
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <ToolbarButton onClick={() => wrapSelection('h1')} title="Heading 1">
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('h2')} title="Heading 2">
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('h3')} title="Heading 3">
            H3
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection('p')} title="Paragraph">
            P
          </ToolbarButton>
        </div>



        {/* Tables */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <ToolbarButton 
            onClick={() => {
              const rows = prompt('Enter number of rows (1-10):');
              const cols = prompt('Enter number of columns (1-10):');
              if (rows && cols) {
                const rowNum = parseInt(rows);
                const colNum = parseInt(cols);
                if (rowNum >= 1 && rowNum <= 10 && colNum >= 1 && colNum <= 10) {
                  insertTable(rowNum, colNum);
                }
              }
            }} 
            title="Insert Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Special Elements */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <ToolbarButton onClick={() => insertHTML('<hr style="border: none; border-top: 1px solid #666; margin: 20px 0;">')} title="Horizontal Rule">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => {
              const text = prompt('Enter quote text:');
              if (text) {
                insertHTML(`<blockquote style="border-left: 4px solid #666; padding-left: 15px; margin: 10px 0; font-style: italic;">${text}</blockquote>`);
              }
            }} 
            title="Insert Quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => {
              const url = prompt('Enter embed URL (YouTube, etc.):');
              if (url) {
                const embedHTML = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 10px 0;">
                  <iframe src="${url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
                </div>`;
                insertHTML(embedHTML);
              }
            }} 
            title="Insert Embed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Links */}
        <div className="flex gap-1">
          <ToolbarButton 
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) {
                wrapSelection('a', `href="${url}" target="_blank"`);
              }
            }} 
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[200px] p-4 bg-gray-900 text-white focus:outline-none ${
          isFocused ? 'ring-2 ring-cyan-500' : ''
        }`}
        style={{ 
          fontFamily: 'inherit',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor; 