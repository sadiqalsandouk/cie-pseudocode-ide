"use client";

import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

interface PseudocodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  onEditorReady?: (insertAtCursor: (text: string) => void) => void;
}

export default function PseudocodeEditor({
  value,
  onChange,
  readOnly = false,
  onEditorReady,
}: PseudocodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Function to insert text at cursor position
    const insertAtCursor = (text: string) => {
      if (editor) {
        const position = editor.getPosition();
        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        );
        const operation = {
          range: range,
          text: text,
          forceMoveMarkers: true,
        };
        editor.executeEdits("insert-symbol", [operation]);
        editor.focus();
      }
    };

    // Handle auto-replacement of shortcuts while preserving cursor position
    let isReplacing = false;

    editor.onDidChangeModelContent((e: any) => {
      if (isReplacing) return; // Prevent infinite loops

      const model = editor.getModel();
      if (!model) return;

      // Check if we have a simple text insertion (typing)
      const isSimpleInsertion =
        e.changes.length === 1 &&
        e.changes[0].rangeLength === 0 &&
        e.changes[0].text.length === 1;

      if (!isSimpleInsertion) return;

      const replacements = [
        { pattern: "<--", replacement: "←" },
        { pattern: "!=", replacement: "≠" },
        { pattern: "<=", replacement: "≤" },
        { pattern: ">=", replacement: "≥" },
      ];

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        const position = editor.getPosition();
        if (!position) return;

        const currentLine = model.getLineContent(position.lineNumber);

        // Check each replacement pattern
        for (const { pattern, replacement } of replacements) {
          // Look for the pattern ending at the cursor position
          const beforeCursor = currentLine.substring(0, position.column - 1);

          if (beforeCursor.endsWith(pattern)) {
            isReplacing = true;

            // Calculate the range to replace
            const startColumn = position.column - pattern.length;
            const endColumn = position.column;

            const replaceRange = new monaco.Range(
              position.lineNumber,
              startColumn,
              position.lineNumber,
              endColumn
            );

            editor.executeEdits("auto-replace", [
              {
                range: replaceRange,
                text: replacement,
                forceMoveMarkers: false,
              },
            ]);

            // Set cursor position after the replacement
            const newPosition = new monaco.Position(
              position.lineNumber,
              startColumn + replacement.length
            );
            editor.setPosition(newPosition);

            isReplacing = false;
            break; // Only replace the first match
          }
        }
      });
    });

    // Call the callback with the insertAtCursor function
    if (onEditorReady) {
      onEditorReady(insertAtCursor);
    }

    // Register the custom pseudocode language
    if (
      !monaco.languages
        .getLanguages()
        .some((lang: any) => lang.id === "pseudocode")
    ) {
      monaco.languages.register({ id: "pseudocode" });

      // Define syntax highlighting rules
      monaco.languages.setMonarchTokensProvider("pseudocode", {
        keywords: [
          // Variable and constant declarations
          "DECLARE",
          "CONSTANT",
          "TYPE",
          "ENDTYPE",
          "DEFINE",
          // Data types
          "INTEGER",
          "REAL",
          "CHAR",
          "STRING",
          "BOOLEAN",
          "DATE",
          "ARRAY",
          "OF",
          "SET",
          // Control structures
          "IF",
          "THEN",
          "ELSE",
          "ENDIF",
          "ELSEIF",
          "CASE",
          "ENDCASE",
          "OTHERWISE",
          "FOR",
          "TO",
          "NEXT",
          "STEP",
          "WHILE",
          "ENDWHILE",
          "REPEAT",
          "UNTIL",
          "BREAK",
          // Procedures and functions
          "PROCEDURE",
          "ENDPROCEDURE",
          "FUNCTION",
          "ENDFUNCTION",
          "RETURN",
          "RETURNS",
          "CALL",
          "BYVAL",
          "BYREF",
          // Input/Output
          "INPUT",
          "OUTPUT",
          // File handling
          "OPENFILE",
          "READFILE",
          "WRITEFILE",
          "CLOSEFILE",
          "SEEK",
          "GETRECORD",
          "PUTRECORD",
          // Operators and logic
          "AND",
          "OR",
          "NOT",
          "MOD",
          "DIV",
          // Boolean values
          "TRUE",
          "FALSE",
          // String functions
          "RIGHT",
          "LEFT",
          "LENGTH",
          "MID",
          "LCASE",
          "UCASE",
          // Numeric functions
          "INT",
          "RAND",
        ],

        operators: [
          "←",
          "=",
          "≠",
          "<>",
          "<",
          ">",
          "≤",
          "<=",
          "≥",
          ">=",
          "+",
          "-",
          "*",
          "/",
          "^",
          "&",
        ],

        // The main tokenizer for our language
        tokenizer: {
          root: [
            // Keywords
            [
              /\b(DECLARE|CONSTANT|TYPE|ENDTYPE|DEFINE|INTEGER|REAL|CHAR|STRING|BOOLEAN|DATE|ARRAY|OF|SET|IF|THEN|ELSE|ENDIF|ELSEIF|CASE|ENDCASE|OTHERWISE|FOR|TO|NEXT|STEP|WHILE|ENDWHILE|REPEAT|UNTIL|BREAK|PROCEDURE|ENDPROCEDURE|FUNCTION|ENDFUNCTION|RETURN|RETURNS|CALL|BYVAL|BYREF|INPUT|OUTPUT|OPENFILE|READFILE|WRITEFILE|CLOSEFILE|SEEK|GETRECORD|PUTRECORD|AND|OR|NOT|MOD|DIV|TRUE|FALSE|RIGHT|LEFT|LENGTH|MID|LCASE|UCASE|INT|RAND)\b/,
              "keyword",
            ],

            // Identifiers and numbers
            [/[a-zA-Z][a-zA-Z0-9_]*/, "variable"], // All identifiers (mixed case allowed in Cambridge)
            [/[0-9][a-zA-Z0-9_]*/, "variable.invalid"], // Variables starting with numbers (invalid)
            [/\d+(\.\d+)?/, "number"],

            // Strings and CHAR literals
            [/"([^"\\]|\\.)*$/, "string.invalid"], // non-terminated string
            [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
            [/'([^'\\]|\\.)*$/, "string.invalid"], // non-terminated char
            [/'[^']*'/, "string.char"], // CHAR literals with single quotes
            [/'/, "string.invalid"], // unclosed single quote

            // Comments
            [/\/\/.*$/, "comment"],

            // Assignment operator
            [/←/, "operator.assignment"],

            // Other operators
            [/[=≠<>≤≥]|<=|>=|<>/, "operator.comparison"],
            [/[+\-*/^&]/, "operator.arithmetic"],

            // Delimiters
            [/[{}()\[\]]/, "@brackets"],
            [/[,;:]/, "delimiter"],

            // Whitespace
            [/[ \t\r\n]+/, "white"],
          ],

          string: [
            [/[^\\"]+/, "string"],
            [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
          ],
        },
      });

      // Define the theme
      monaco.editor.defineTheme("pseudocode-theme", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
          { token: "variable", foreground: "001080" }, // Blue color for all valid identifiers
          {
            token: "variable.invalid",
            foreground: "ff0000",
            fontStyle: "underline",
          },
          { token: "number", foreground: "098658" },
          { token: "string", foreground: "a31515" },
          { token: "string.char", foreground: "a31515" },
          { token: "string.invalid", foreground: "ff0000" },
          { token: "comment", foreground: "008000", fontStyle: "italic" },
          {
            token: "operator.assignment",
            foreground: "0000ff",
            fontStyle: "bold",
          },
          { token: "operator.comparison", foreground: "800080" },
          { token: "operator.arithmetic", foreground: "800080" },
          { token: "delimiter", foreground: "000000" },
        ],
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#000000",
          "editorLineNumber.foreground": "#999999",
          "editor.selectionBackground": "#add6ff",
          "editor.inactiveSelectionBackground": "#e5ebf1",
        },
      });

      // Set the theme
      monaco.editor.setTheme("pseudocode-theme");
    }
  };

  return (
    <div className="h-full border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language="pseudocode"
        theme="pseudocode-theme"
        value={value}
        onChange={(newValue) => {
          if (newValue) {
            onChange(newValue);
          } else {
            onChange("");
          }
        }}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
          lineNumbers: "on",
          rulers: [],
          wordWrap: "off",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 3,
          insertSpaces: true,
          detectIndentation: false,
          readOnly,
          renderWhitespace: "boundary",
          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            highlightActiveIndentation: true,
          },
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          quickSuggestions: false,
          parameterHints: { enabled: false },
          codeLens: false,
          contextmenu: false,
        }}
      />
    </div>
  );
}
