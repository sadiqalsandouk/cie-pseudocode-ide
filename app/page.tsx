"use client"

import React, { useState } from "react"
import { Play, Code, Trash2 } from "lucide-react"
import PseudocodeEditor from "./components/PseudocodeEditor"
import SyntaxFeedback from "./components/SyntaxFeedback"
import { checkSyntax } from "./utils/syntaxChecker"
import { SyntaxCheckResult } from "./types"

export default function Home() {
  const [code, setCode] = useState(
    '// Cambridge Pseudocode IDE (9618 - 2026 Standards)\n// Write your pseudocode here using UPPERCASE keywords\n// Remember: Use ← for assignment, = only for CONSTANT\n\nPROCEDURE Example()\n   DECLARE message: STRING\n   DECLARE count: INTEGER\n   \n   message ← "Hello, Cambridge!"\n   count ← 5\n   \n   OUTPUT "Message: ", message\n   OUTPUT "Count: ", count\nENDPROCEDURE'
  )
  const [syntaxResult, setSyntaxResult] = useState<SyntaxCheckResult | null>(
    null
  )
  const [insertAtCursor, setInsertAtCursor] = useState<((text: string) => void) | null>(null)

  const handleCheckSyntax = () => {
    const result = checkSyntax(code)
    setSyntaxResult(result)
  }

  const handleClearCode = () => {
    setCode(
      "// Write your pseudocode here\n// Use UPPERCASE for all keywords\n\n"
    )
    setSyntaxResult(null)
  }

  const insertSymbol = (symbol: string) => {
    if (insertAtCursor) {
      insertAtCursor(symbol)
    } else {
      // Fallback to appending at end if cursor function not available
      setCode((prevCode) => prevCode + symbol)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Cambridge Pseudocode IDE
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Practice AS & A Level Computer Science (9618) Pseudocode
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCheckSyntax}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Check Syntax</span>
              <span className="sm:hidden">Check</span>
            </button>
            <button
              onClick={handleClearCode}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Symbol Helper Bar */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Quick Insert:
            </span>
            <button
              onClick={() => insertSymbol("←")}
              className="px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-mono text-xs sm:text-sm transition-colors"
              title="Assignment operator (left arrow)"
            >
              ← Assignment
            </button>
            <button
              onClick={() => insertSymbol("≠")}
              className="px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-mono text-xs sm:text-sm transition-colors"
              title="Not equal operator"
            >
              ≠ Not Equal
            </button>
            <button
              onClick={() => insertSymbol("≤")}
              className="px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-mono text-xs sm:text-sm transition-colors"
              title="Less than or equal"
            >
              ≤ Less/Equal
            </button>
            <button
              onClick={() => insertSymbol("≥")}
              className="px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-mono text-xs sm:text-sm transition-colors"
              title="Greater than or equal"
            >
              ≥ Greater/Equal
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center sm:text-right">
            Auto-replace: &lt;-- → ←, != → ≠, &lt;= → ≤, &gt;= → ≥
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 p-3 sm:p-6 min-w-0 h-2/3 lg:h-auto">
          <div className="h-full">
            <PseudocodeEditor 
              value={code} 
              onChange={setCode}
              onEditorReady={setInsertAtCursor}
            />
          </div>
        </div>

        {/* Right Sidebar - Syntax Feedback */}
        <div className="w-full lg:w-80 xl:w-96 2xl:w-[28rem] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-6 overflow-y-auto flex-shrink-0 h-1/3 lg:h-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Syntax Checker
            </h2>
            <p className="text-sm text-gray-600">
              Check your pseudocode against Cambridge standards
            </p>
          </div>

          {syntaxResult ? (
            <SyntaxFeedback
              result={syntaxResult}
              answerResult={null}
              onShowAnswer={() => {}}
              showAnswer={false}
              modelAnswer=""
              showModelAnswerButton={false}
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Click "Check Syntax" to validate your pseudocode against
                Cambridge International standards.
              </p>

              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-800 text-sm">
                  Cambridge 9618 Rules:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Keywords must be UPPERCASE</li>
                  <li>• Use ← for assignment, = only for CONSTANT</li>
                  <li>• Indent exactly 3 spaces per level</li>
                  <li>• Identifiers: mixed case, start with letter</li>
                  <li>• Arrays: ARRAY[1:size] OF type</li>
                  <li>• Comments start with //</li>
                  <li>• String concatenation uses &</li>
                  <li>• Use ≠ for "not equal", ≤≥ for comparisons</li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 text-sm mb-2">
                  Symbol Helper:
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  Use the Quick Insert buttons at the top or type shortcuts that
                  auto-replace
                </p>
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Auto-replacements:</div>
                  <div className="font-mono space-y-0.5">
                    <div>&lt;-- → ←</div>
                    <div>!= → ≠</div>
                    <div>&lt;= → ≤</div>
                    <div>&gt;= → ≥</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cambridge 9618 Keywords Reference */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 text-sm mb-2">
              Cambridge 9618 Keywords
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="font-mono text-blue-700">DECLARE</div>
                <div className="font-mono text-blue-700">CONSTANT</div>
                <div className="font-mono text-blue-700">TYPE/ENDTYPE</div>
                <div className="font-mono text-blue-700">IF/ENDIF</div>
                <div className="font-mono text-blue-700">CASE/ENDCASE</div>
                <div className="font-mono text-blue-700">FOR/NEXT</div>
                <div className="font-mono text-blue-700">WHILE/ENDWHILE</div>
                <div className="font-mono text-blue-700">REPEAT/UNTIL</div>
              </div>
              <div>
                <div className="font-mono text-blue-700">PROCEDURE</div>
                <div className="font-mono text-blue-700">FUNCTION</div>
                <div className="font-mono text-blue-700">INPUT/OUTPUT</div>
                <div className="font-mono text-blue-700">BYVAL/BYREF</div>
                <div className="font-mono text-blue-700">AND/OR/NOT</div>
                <div className="font-mono text-blue-700">MOD/DIV</div>
                <div className="font-mono text-blue-700">LENGTH/MID</div>
                <div className="font-mono text-blue-700">LCASE/UCASE</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200">
              <h5 className="font-medium text-blue-800 text-xs mb-1">
                Data Types:
              </h5>
              <div className="text-xs text-blue-700 font-mono">
                INTEGER, REAL, STRING, BOOLEAN, CHAR, DATE, ARRAY
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
