"use client"

import React from "react"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Lightbulb,
} from "lucide-react"
import { SyntaxCheckResult, AnswerCheckResult } from "../types"

interface SyntaxFeedbackProps {
  result: SyntaxCheckResult | null
  answerResult?: AnswerCheckResult | null
  onShowAnswer: () => void
  showAnswer: boolean
  modelAnswer: string
  showModelAnswerButton?: boolean
}

export default function SyntaxFeedback({
  result,
  answerResult,
  onShowAnswer,
  showAnswer,
  modelAnswer,
  showModelAnswerButton = true,
}: SyntaxFeedbackProps) {
  if (!result) {
    return null
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {result.isValid ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              Syntax Check Passed!
            </h3>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Syntax Errors Found</h3>
          </>
        )}
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2 mb-4">
          {result.errors.map((error, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-3 rounded-lg ${
                error.type === "error"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              {error.type === "error" ? (
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    error.type === "error" ? "text-red-800" : "text-yellow-800"
                  }`}
                >
                  Line {error.line}
                </p>
                <p
                  className={`text-sm ${
                    error.type === "error" ? "text-red-700" : "text-yellow-700"
                  }`}
                >
                  {error.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Correctness Feedback */}
      {answerResult && result.isValid && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            {answerResult.isCorrect ? (
              <>
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">
                  Answer Check: Correct!
                </h4>
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-orange-800">
                  Answer Check: Needs Improvement
                </h4>
              </>
            )}
            <span className="ml-auto text-sm text-purple-700 font-medium">
              {answerResult.similarity.toFixed(0)}% similarity
            </span>
          </div>

          {answerResult.feedback.length > 0 && (
            <div className="mb-3">
              {answerResult.feedback.map((feedback, index) => (
                <p key={index} className="text-sm text-purple-700 mb-1">
                  • {feedback}
                </p>
              ))}
            </div>
          )}

          {answerResult.suggestions.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <h5 className="font-medium text-yellow-800 text-sm">
                  Suggestions:
                </h5>
              </div>
              {answerResult.suggestions.map((suggestion, index) => (
                <p key={index} className="text-sm text-yellow-700 mb-1">
                  • {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {showModelAnswerButton && (
        <div className="flex gap-2">
          <button
            onClick={onShowAnswer}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {showAnswer ? "Hide Model Answer" : "Show Model Answer"}
          </button>
        </div>
      )}

      {showAnswer && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Model Answer:</h4>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
            {modelAnswer}
          </pre>
        </div>
      )}
    </div>
  )
}
