import { SyntaxError, SyntaxCheckResult } from '../types';

// Cambridge 9618 2026 pseudocode keywords (must be uppercase)
const KEYWORDS = [
  // Variable and constant declarations
  'DECLARE', 'CONSTANT', 'TYPE', 'ENDTYPE', 'DEFINE',
  // Data types
  'INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'DATE', 'ARRAY', 'OF', 'SET',
  // Control structures
  'IF', 'THEN', 'ELSE', 'ENDIF', 'ELSEIF',
  'CASE', 'ENDCASE', 'OTHERWISE',
  'FOR', 'TO', 'NEXT', 'STEP',
  'WHILE', 'ENDWHILE', 'REPEAT', 'UNTIL',
  'BREAK', // Loop control - ends current loop immediately
  // Procedures and functions
  'PROCEDURE', 'ENDPROCEDURE', 'FUNCTION', 'ENDFUNCTION', 'RETURN', 'RETURNS',
  'CALL', 'BYVAL', 'BYREF',
  // Input/Output
  'INPUT', 'OUTPUT',
  // File handling
  'OPENFILE', 'READFILE', 'WRITEFILE', 'CLOSEFILE', 'SEEK', 'GETRECORD', 'PUTRECORD',
  // Operators and logic
  'AND', 'OR', 'NOT', 'MOD', 'DIV',
  // Boolean values
  'TRUE', 'FALSE',
  // String functions
  'RIGHT', 'LEFT', 'LENGTH', 'MID', 'LCASE', 'UCASE',
  // Numeric functions
  'INT', 'RAND'
];

// Block keywords that require matching pairs
const BLOCK_KEYWORDS = {
  'IF': 'ENDIF',
  'FOR': 'NEXT',
  'WHILE': 'ENDWHILE',
  'REPEAT': 'UNTIL',
  'PROCEDURE': 'ENDPROCEDURE',
  'FUNCTION': 'ENDFUNCTION',
  'CASE': 'ENDCASE',
  'TYPE': 'ENDTYPE'
};

export function checkSyntax(code: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const lines = code.split('\n');
  const blockStack: Array<{ keyword: string, line: number }> = [];
  const arrayDeclarations = new Map<string, { start: number, end: number, line: number }>();
  const declaredVariables = new Set<string>();
  const variableTypes = new Map<string, { type: string, line: number }>();
  const declaredFunctions = new Set<string>();

  // Check if there's any actual pseudocode content (not just comments)
  const hasActualCode = lines.some(line => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('//');
  });

  if (!hasActualCode) {
    errors.push({
      line: 1,
      message: 'No pseudocode content found. Please write some pseudocode.',
      type: 'error'
    });
    return { isValid: false, errors };
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    let hasUnclosedString = false;
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('//')) {
      return;
    }

    // Check indentation (should be multiples of 3 spaces)
    const leadingSpaces = line.length - line.trimStart().length;
    if (leadingSpaces % 3 !== 0) {
      errors.push({
        line: lineNumber,
        message: 'Indentation should be multiples of 3 spaces',
        type: 'warning'
      });
    }

    // Check for proper assignment operator (strict Cambridge rule)
    // Only flag = as error if it's actually an assignment (not a comparison in IF/WHILE)
    if (trimmedLine.includes('=') && !trimmedLine.includes('<=') && !trimmedLine.includes('>=') && !trimmedLine.includes('<>') && !trimmedLine.startsWith('CONSTANT')) {
      // Don't flag = in conditional statements (IF, WHILE, UNTIL)
      const isInConditional = /\b(IF|WHILE|UNTIL)\b/.test(trimmedLine);
      if (!isInConditional && !trimmedLine.includes('←')) {
        errors.push({
          line: lineNumber,
          message: 'Use ← for assignment instead of = (Cambridge rule)',
          type: 'error'
        });
      }
    }

    // Check for mixed case identifiers (Cambridge allows mixed case but must start with letter)
    const identifierMatches = trimmedLine.match(/\b[a-zA-Z][a-zA-Z0-9_]*\b/g);
    if (identifierMatches) {
      identifierMatches.forEach(identifier => {
        if (!KEYWORDS.includes(identifier.toUpperCase())) {
          // Check if identifier starts with number (invalid)
          if (/^\d/.test(identifier)) {
            errors.push({
              line: lineNumber,
              message: `Identifier '${identifier}' cannot start with a number`,
              type: 'error'
            });
          }
          // Check if contains invalid characters
          if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(identifier)) {
            errors.push({
              line: lineNumber,
              message: `Identifier '${identifier}' contains invalid characters`,
              type: 'error'
            });
          }
        }
      });
    }

    // Extract words from the line
    const words = trimmedLine.split(/\s+/);
    
    // Check for valid pseudocode structure
    const hasValidStructure = 
      words.some(word => KEYWORDS.includes(word.toUpperCase())) || // Contains Cambridge keywords
      trimmedLine.includes('←') || // Assignment operator
      /^[a-zA-Z_][a-zA-Z0-9_]*\s*←/.test(trimmedLine) || // Variable assignment pattern
      /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(trimmedLine) || // Constant assignment pattern
      trimmedLine.includes(':') // Type declarations (like in DECLARE statements)
    
    // If line has no valid structure, it's an error (stricter validation)
    if (!hasValidStructure) {
      errors.push({
        line: lineNumber,
        message: 'This line does not appear to be valid pseudocode. Use Cambridge keywords and proper syntax.',
        type: 'error'
      });
    }
    
    // Check if line starts with valid keywords (for non-expression lines)
    if (words.length > 0 && words[0].match(/^[A-Z]+$/)) {
      const firstWord = words[0];
      
      // Check if it's a valid keyword or identifier
      if (!KEYWORDS.includes(firstWord) && !firstWord.match(/^[A-Z][A-Z0-9_]*$/)) {
        errors.push({
          line: lineNumber,
          message: `Unknown keyword: ${firstWord}`,
          type: 'error'
        });
      }

      // Handle block keywords
      if (BLOCK_KEYWORDS[firstWord]) {
        blockStack.push({ keyword: firstWord, line: lineNumber });
      }

      // Handle closing keywords
      const closingKeywords = Object.values(BLOCK_KEYWORDS);
      if (closingKeywords.includes(firstWord) || firstWord === 'NEXT' || firstWord === 'UNTIL') {
        if (blockStack.length === 0) {
          errors.push({
            line: lineNumber,
            message: `Unexpected ${firstWord} without matching opening`,
            type: 'error'
          });
        } else {
          const lastBlock = blockStack.pop()!;
          const expectedClosing = BLOCK_KEYWORDS[lastBlock.keyword];
          
          if (firstWord !== expectedClosing && 
              !(lastBlock.keyword === 'FOR' && firstWord === 'NEXT') &&
              !(lastBlock.keyword === 'REPEAT' && firstWord === 'UNTIL')) {
            errors.push({
              line: lineNumber,
              message: `Expected ${expectedClosing} but found ${firstWord}`,
              type: 'error'
            });
          }
        }
      }
    }

    // Check for lowercase keywords, but ignore words inside strings
    // Simple approach: remove all quoted strings and comments first, then check remaining words
    let lineWithoutStrings = trimmedLine;
    // Remove comments first (everything after //)
    lineWithoutStrings = lineWithoutStrings.replace(/\/\/.*$/, '');
    // Remove double-quoted strings
    lineWithoutStrings = lineWithoutStrings.replace(/"[^"]*"/g, '');
    // Remove single-quoted strings  
    lineWithoutStrings = lineWithoutStrings.replace(/'[^']*'/g, '');
    
    const wordsOutsideStrings = lineWithoutStrings.split(/\s+/);
    
    wordsOutsideStrings.forEach(word => {
      const upperWord = word.toUpperCase();
      if (KEYWORDS.includes(upperWord) && word !== upperWord && word.length > 0) {
        errors.push({
          line: lineNumber,
          message: `Keyword '${word}' should be uppercase: '${upperWord}'`,
          type: 'error'
        });
      }
    });

    // Check for common invalid keywords from other languages
    const invalidKeywords = ['CONTINUE', 'DO', 'SWITCH', 'DEFAULT', 'TRY', 'CATCH'];
    words.forEach(word => {
      if (invalidKeywords.includes(word.toUpperCase())) {
        errors.push({
          line: lineNumber,
          message: `'${word}' is not a valid Cambridge pseudocode keyword`,
          type: 'error'
        });
      }
    });


        // Check for proper variable declarations and track arrays
    if (trimmedLine.startsWith('DECLARE')) {
      if (!trimmedLine.includes(':')) {
        errors.push({
          line: lineNumber,
          message: 'DECLARE statement must specify variable type with colon (:)',
          type: 'error'
        });
      } else {
        // Track all variable declarations and check for redeclaration
        const declarePart = trimmedLine.substring(7).trim(); // Remove "DECLARE"
        const colonIndex = declarePart.indexOf(':');
        if (colonIndex !== -1) {
          const beforeColon = declarePart.substring(0, colonIndex).trim();
          const afterColon = declarePart.substring(colonIndex + 1).trim();
          const variableNames = beforeColon.split(',').map(name => name.trim());
          
          variableNames.forEach(varName => {
            if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
              const varNameLower = varName.toLowerCase();
              
              // Check if variable name is a reserved keyword
              if (KEYWORDS.includes(varName.toUpperCase())) {
                errors.push({
                  line: lineNumber,
                  message: `'${varName}' is a reserved keyword and cannot be used as a variable name`,
                  type: 'error'
                });
                return; // Skip further processing for this variable
              }
              
              // Check for redeclaration
              if (declaredVariables.has(varNameLower)) {
                const previousType = variableTypes.get(varNameLower);
                if (previousType && previousType.type !== afterColon) {
                  errors.push({
                    line: lineNumber,
                    message: `Variable '${varName}' redeclared with different type. Previously declared as ${previousType.type} on line ${previousType.line}`,
                    type: 'error'
                  });
                } else {
                  errors.push({
                    line: lineNumber,
                    message: `Variable '${varName}' already declared on line ${previousType?.line || 'unknown'}`,
                    type: 'warning'
                  });
                }
              } else {
                declaredVariables.add(varNameLower);
                variableTypes.set(varNameLower, { type: afterColon, line: lineNumber });
              }
            }
          });
        }

        // Track array declarations for bounds checking
        const arrayMatch = trimmedLine.match(/DECLARE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*ARRAY\[(\d+):(\d+)\]/i);
        if (arrayMatch) {
          const arrayName = arrayMatch[1].toLowerCase();
          const startIndex = parseInt(arrayMatch[2]);
          const endIndex = parseInt(arrayMatch[3]);
          arrayDeclarations.set(arrayName, { start: startIndex, end: endIndex, line: lineNumber });
        }
      }
    }

    // Check for proper CONSTANT declarations (Cambridge rule: only literals, no expressions)
    if (trimmedLine.startsWith('CONSTANT')) {
      if (!trimmedLine.includes('=')) {
        errors.push({
          line: lineNumber,
          message: 'CONSTANT must be assigned a value using =',
          type: 'error'
        });
      }
      // CONSTANT should use = not ←
      if (trimmedLine.includes('←')) {
        errors.push({
          line: lineNumber,
          message: 'CONSTANT declarations use = not ←',
          type: 'error'
        });
      }
      
      // Auto-declare constant names as variables
      const constantMatch = trimmedLine.match(/CONSTANT\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/i);
      if (constantMatch) {
        const constantName = constantMatch[1];
        declaredVariables.add(constantName.toLowerCase());
        // Constants don't have explicit types, so we'll use a generic type
        variableTypes.set(constantName.toLowerCase(), { type: 'CONSTANT', line: lineNumber });
      }
    }

    // Check ARRAY declarations follow Cambridge format (only on DECLARE lines)
    if (trimmedLine.startsWith('DECLARE') && trimmedLine.includes('ARRAY')) {
      if (!trimmedLine.includes('[') || !trimmedLine.includes(']')) {
        errors.push({
          line: lineNumber,
          message: 'ARRAY declaration must include index range in square brackets [start:end]',
          type: 'error'
        });
      }
      if (!trimmedLine.includes('OF')) {
        errors.push({
          line: lineNumber,
          message: 'ARRAY declaration must include OF keyword',
          type: 'error'
        });
      }
    }

    // Check FOR loop syntax
    if (trimmedLine.startsWith('FOR')) {
      if (!trimmedLine.includes('←') || !trimmedLine.includes('TO')) {
        errors.push({
          line: lineNumber,
          message: 'FOR loop must use format: FOR variable ← start TO end',
          type: 'error'
        });
      }
    }

    // Check CASE statement format
    if (trimmedLine.startsWith('CASE OF')) {
      if (!trimmedLine.includes('OF')) {
        errors.push({
          line: lineNumber,
          message: 'CASE statement must use format: CASE OF variable',
          type: 'error'
        });
      }
    }

    // Check for invalid parentheses in WHILE conditions
    if (trimmedLine.startsWith('WHILE')) {
      if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
        errors.push({
          line: lineNumber,
          message: 'WHILE conditions should not use parentheses in Cambridge pseudocode',
          type: 'error'
        });
      }
    }

    // Check for unclosed strings
    const stringMatches = trimmedLine.match(/"/g);
    if (stringMatches && stringMatches.length % 2 !== 0) {
      hasUnclosedString = true;
      errors.push({
        line: lineNumber,
        message: 'Unclosed string - missing closing quote',
        type: 'error'
      });
    }

    // Check for CHAR literal format (single quotes)
    const charMatches = trimmedLine.match(/'[^']*'/g);
    if (charMatches) {
      charMatches.forEach(charLiteral => {
        const content = charLiteral.slice(1, -1); // Remove quotes
        if (content.length === 0) {
          errors.push({
            line: lineNumber,
            message: 'Empty CHAR literal - CHAR must contain exactly one character',
            type: 'error'
          });
        } else if (content.length > 1 && !content.startsWith('\\')) {
          errors.push({
            line: lineNumber,
            message: 'CHAR literal can only contain one character. Use double quotes for strings',
            type: 'error'
          });
        }
      });
    }

    // Check for invalid CHAR syntax (double quotes for CHAR)
    if (trimmedLine.match(/DECLARE\s+\w+\s*:\s*CHAR/) && trimmedLine.includes('"')) {
      errors.push({
        line: lineNumber,
        message: 'CHAR literals must use single quotes (\'), not double quotes (")',
        type: 'error'
      });
    }

    // Check for CHAR variable assignments with double quotes
    if (trimmedLine.includes('←')) {
      const assignMatch = trimmedLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*←\s*"[^"]*"/);
      if (assignMatch) {
        const varName = assignMatch[1].toLowerCase();
        const varType = variableTypes.get(varName);
        if (varType && varType.type.toUpperCase() === 'CHAR') {
          errors.push({
            line: lineNumber,
            message: `CHAR variable '${assignMatch[1]}' must use single quotes (\') for character literals, not double quotes (")`,
            type: 'error'
          });
        }
      }
    }

    // Check array bounds
    const arrayAccessMatch = trimmedLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]/g);
    if (arrayAccessMatch) {
      arrayAccessMatch.forEach(access => {
        const match = access.match(/([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]/);
        if (match) {
          const arrayName = match[1].toLowerCase();
          const accessIndex = parseInt(match[2]);
          const arrayInfo = arrayDeclarations.get(arrayName);
          
          if (arrayInfo) {
            if (accessIndex < arrayInfo.start || accessIndex > arrayInfo.end) {
              errors.push({
                line: lineNumber,
                message: `Array index ${accessIndex} is out of bounds. Array '${match[1]}' valid range is [${arrayInfo.start}:${arrayInfo.end}]`,
                type: 'error'
              });
            }
          }
        }
      });
    }

    // Check for variable usage without declaration
    // Check assignments
    if (trimmedLine.includes('←')) {
      const assignmentMatch = trimmedLine.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*←/);
      if (assignmentMatch) {
        const varName = assignmentMatch[1];
        if (!declaredVariables.has(varName.toLowerCase())) {
          errors.push({
            line: lineNumber,
            message: `Variable '${varName}' must be declared before use`,
            type: 'error'
          });
        }
      }
    }

    // Check variable usage in OUTPUT, INPUT, and expressions (skip if unclosed string)
    if (!hasUnclosedString && (trimmedLine.includes('OUTPUT') || trimmedLine.includes('INPUT') || 
        trimmedLine.includes('IF') || trimmedLine.includes('WHILE'))) {
      // Find variables being used (exclude keywords and strings)
      let lineToCheck = lineWithoutStrings; // Use version without strings
      const variableMatches = lineToCheck.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      
      if (variableMatches) {
        variableMatches.forEach(match => {
          // Skip if it's a keyword
          if (KEYWORDS.includes(match.toUpperCase())) return;
          // Skip if it's the statement keyword itself
          if (['OUTPUT', 'INPUT', 'IF', 'WHILE', 'THEN'].includes(match.toUpperCase())) return;
          // Skip if it's a function name
          if (lineToCheck.includes(match + '(')) return;
          
          if (!declaredVariables.has(match.toLowerCase())) {
            errors.push({
              line: lineNumber,
              message: `Variable '${match}' must be declared before use`,
              type: 'error'
            });
          }
        });
      }
    }

    // Check CALL usage (should not be used with functions)
    if (trimmedLine.startsWith('CALL ')) {
      const callMatch = trimmedLine.match(/CALL\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (callMatch) {
        const calledName = callMatch[1].toLowerCase();
        if (declaredFunctions.has(calledName)) {
          errors.push({
            line: lineNumber,
            message: `CALL should not be used with functions. Use function calls directly: ${callMatch[1]}(...)`,
            type: 'error'
          });
        }
      }
    }

    // Check OPENFILE syntax
    if (trimmedLine.startsWith('OPENFILE')) {
      const openfileMatch = trimmedLine.match(/OPENFILE\s+\S+\s+FOR\s+(\w+)/i);
      if (openfileMatch) {
        const mode = openfileMatch[1].toUpperCase();
        if (!['READ', 'WRITE', 'APPEND'].includes(mode)) {
          errors.push({
            line: lineNumber,
            message: `Invalid file mode '${mode}'. Valid modes are: READ, WRITE, APPEND`,
            type: 'error'
          });
        }
      } else if (trimmedLine.includes('FOR')) {
        // OPENFILE statement with FOR but invalid format
        errors.push({
          line: lineNumber,
          message: 'OPENFILE syntax should be: OPENFILE filename FOR mode (READ/write/append)',
          type: 'error'
        });
      }
    }

    // Check for common invalid file modes (handled by OPENFILE rule)
    if (trimmedLine.startsWith('OPENFILE')) {
      if (trimmedLine.match(/\b(READONLY|WRITEONLY|READWRITE)\b/i)) {
        // Let the OPENFILE-specific rule handle the exact message; avoid duplicates
      }
    }

    // Check for wrong loop endings
    if (trimmedLine.startsWith('FOR') && lines.some((line, idx) => 
        idx > index && line.trim().startsWith('ENDFOR'))) {
      const endforLine = lines.findIndex((line, idx) => 
        idx > index && line.trim().startsWith('ENDFOR'));
      if (endforLine !== -1) {
        errors.push({
          line: endforLine + 1,
          message: 'FOR loops must end with NEXT, not ENDFOR',
          type: 'error'
        });
      }
    }

    // Check for proper function/procedure syntax and auto-declare parameters
    if (trimmedLine.startsWith('FUNCTION')) {
      if (!trimmedLine.includes('RETURNS')) {
        errors.push({
          line: lineNumber,
          message: 'FUNCTION must specify return type with RETURNS',
          type: 'error'
        });
      }
      
      // Track function names
      const functionNameMatch = trimmedLine.match(/FUNCTION\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (functionNameMatch) {
        declaredFunctions.add(functionNameMatch[1].toLowerCase());
      }
      
      // Auto-declare function parameters
      const paramMatch = trimmedLine.match(/FUNCTION\s+\w+\s*\((.*?)\)/i);
      if (paramMatch && paramMatch[1].trim()) {
        const params = paramMatch[1].split(',');
        params.forEach(param => {
          const paramParts = param.trim().split(':');
          if (paramParts.length === 2) {
            const paramName = paramParts[0].trim();
            const paramType = paramParts[1].trim();
            if (paramName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
              declaredVariables.add(paramName.toLowerCase());
              variableTypes.set(paramName.toLowerCase(), { type: paramType, line: lineNumber });
            }
          }
        });
      }
    }

    if (trimmedLine.startsWith('PROCEDURE')) {
      // Auto-declare procedure parameters
      const paramMatch = trimmedLine.match(/PROCEDURE\s+\w+\s*\((.*?)\)/i);
      if (paramMatch && paramMatch[1].trim()) {
        const params = paramMatch[1].split(',');
        params.forEach(param => {
          const paramParts = param.trim().split(':');
          if (paramParts.length === 2) {
            const paramName = paramParts[0].trim();
            const paramType = paramParts[1].trim();
            if (paramName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
              declaredVariables.add(paramName.toLowerCase());
              variableTypes.set(paramName.toLowerCase(), { type: paramType, line: lineNumber });
            }
          }
        });
      }
    }
  });

  // Check for unmatched blocks
  blockStack.forEach(block => {
    errors.push({
      line: block.line,
      message: `Unmatched ${block.keyword} - missing ${BLOCK_KEYWORDS[block.keyword]}`,
      type: 'error'
    });
  });

  // Check for extra closing keywords (like extra ENDIF)
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'ENDIF' || trimmedLine === 'ENDWHILE' || 
        trimmedLine === 'ENDPROCEDURE' || trimmedLine === 'ENDFUNCTION' ||
        trimmedLine === 'ENDCASE' || trimmedLine === 'ENDTYPE') {
      
      // Count opening and closing blocks up to this line
      let openCount = 0;
      let closeCount = 0;
      
      for (let i = 0; i <= index; i++) {
        const checkLine = lines[i].trim();
        if (trimmedLine === 'ENDIF') {
          if (checkLine.startsWith('IF ')) openCount++;
          if (checkLine === 'ENDIF') closeCount++;
        } else if (trimmedLine === 'ENDWHILE') {
          if (checkLine.startsWith('WHILE ')) openCount++;
          if (checkLine === 'ENDWHILE') closeCount++;
        } else if (trimmedLine === 'ENDPROCEDURE') {
          if (checkLine.startsWith('PROCEDURE ')) openCount++;
          if (checkLine === 'ENDPROCEDURE') closeCount++;
        } else if (trimmedLine === 'ENDFUNCTION') {
          if (checkLine.startsWith('FUNCTION ')) openCount++;
          if (checkLine === 'ENDFUNCTION') closeCount++;
        } else if (trimmedLine === 'ENDCASE') {
          if (checkLine.startsWith('CASE ')) openCount++;
          if (checkLine === 'ENDCASE') closeCount++;
        } else if (trimmedLine === 'ENDTYPE') {
          if (checkLine.startsWith('TYPE ')) openCount++;
          if (checkLine === 'ENDTYPE') closeCount++;
        }
      }
      
      if (closeCount > openCount) {
        errors.push({
          line: lineNumber,
          message: `Extra ${trimmedLine} - no matching opening block`,
          type: 'error'
        });
      }
    }
  });

  // Check LENGTH function type usage
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    const lengthMatches = trimmedLine.match(/LENGTH\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi);
    if (lengthMatches) {
      lengthMatches.forEach(match => {
        const varMatch = match.match(/LENGTH\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/i);
        if (varMatch) {
          const varName = varMatch[1].toLowerCase();
          const varType = variableTypes.get(varName);
          
          if (varType) {
            const type = varType.type.toUpperCase();
            if (!type.includes('STRING') && !type.includes('ARRAY')) {
              errors.push({
                line: lineNumber,
                message: `LENGTH() can only be used with STRING or ARRAY variables, not ${varType.type}`,
                type: 'error'
              });
            }
          }
        }
      });
    }
  });

  // Check for empty loop bodies (warning)
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('FOR ') && trimmedLine.includes(' TO ')) {
      // Look for the corresponding NEXT
      let nextLineIndex = -1;
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i].trim();
        if (nextLine.startsWith('NEXT ')) {
          nextLineIndex = i;
          break;
        }
        // If we hit another control structure, stop looking
        if (nextLine.startsWith('FOR ') || nextLine.startsWith('WHILE ') || 
            nextLine.startsWith('IF ') || nextLine.startsWith('PROCEDURE ') ||
            nextLine.startsWith('FUNCTION ')) {
          break;
        }
      }
      
      if (nextLineIndex !== -1 && nextLineIndex === index + 1) {
        errors.push({
          line: lineNumber,
          message: 'Empty FOR loop body - consider adding statements or removing the loop',
          type: 'warning'
        });
      }
    }
  });

  // Deduplicate errors (same line + same message)
  const uniqueErrors: SyntaxError[] = [];
  const errorKeys = new Set<string>();
  
  errors.forEach(error => {
    const key = `${error.line}:${error.message}`;
    if (!errorKeys.has(key)) {
      errorKeys.add(key);
      uniqueErrors.push(error);
    }
  });

  return {
    isValid: uniqueErrors.filter(e => e.type === 'error').length === 0,
    errors: uniqueErrors
  };
}
