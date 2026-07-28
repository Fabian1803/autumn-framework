export function parseRawValue(raw: string | undefined): any {
  if (!raw) return undefined;
  raw = raw.trim();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (!isNaN(Number(raw))) return Number(raw);
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      return JSON.parse(raw.replace(/'/g, '"'));
    } catch {
      return [];
    }
  }
  return raw.replace(/^["']|["']$/g, '');
}

/**
 * Extrae un bloque de llaves { ... } balanceando llaves de apertura y cierre anidadas.
 */
export function extractBalancedBlock(text: string, startIndex: number): { body: string; startIndex: number; endIndex: number } | null {
  const openBraceIndex = text.indexOf('{', startIndex);
  if (openBraceIndex === -1) return null;

  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i++) {
    if (text[i] === '{') {
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        return {
          body: text.substring(openBraceIndex + 1, i),
          startIndex: openBraceIndex,
          endIndex: i + 1
        };
      }
    }
  }
  return null;
}

export function processControlFlow(html: string, variables: Record<string, any>): string {
  let result = html;

  // 0a. Reemplazar la directiva @RouterOutlet por la etiqueta <app-router-outlet></app-router-outlet>
  result = result.replace(/@RouterOutlet/gi, '<app-router-outlet></app-router-outlet>');

  // 0b. Limpiar comentarios JSX {/* ... */}
  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // 1. Procesar cortocircuitos con .length (ej: @this.notifications.length > 0 && { ... })
  let shortLenMatch: RegExpExecArray | null;
  const shortLenRegex = /@(?:this\.)?(\w+)\.length\s*([><!=]+)\s*(\d+)\s*&&\s*/g;
  while ((shortLenMatch = shortLenRegex.exec(result)) !== null) {
    const fullMatch = shortLenMatch[0];
    const matchIndex = shortLenMatch.index;
    const varName = shortLenMatch[1];
    const op = shortLenMatch[2];
    const compVal = parseInt(shortLenMatch[3], 10);

    const block = extractBalancedBlock(result, matchIndex + fullMatch.length - 1);
    if (block) {
      const arrVal = parseRawValue(variables[varName]);
      const len = Array.isArray(arrVal) ? arrVal.length : 0;
      let isTrue = false;

      if (op === '>' || op === '>=') isTrue = len > compVal;
      else if (op === '===' || op === '==') isTrue = len === compVal;
      else if (op === '<' || op === '<=') isTrue = len < compVal;

      const replacement = isTrue ? processControlFlow(block.body, variables) : '';
      result = result.substring(0, matchIndex) + replacement + result.substring(block.endIndex);
      shortLenRegex.lastIndex = matchIndex + replacement.length;
    }
  }

  // 2. Procesar cortocircuitos simples (ej: @this.showSystemLogs && { ... })
  let shortMatch: RegExpExecArray | null;
  const shortRegex = /@(?:this\.)?(\w+)\s*&&\s*/g;
  while ((shortMatch = shortRegex.exec(result)) !== null) {
    const fullMatch = shortMatch[0];
    const matchIndex = shortMatch.index;
    const varName = shortMatch[1];

    const block = extractBalancedBlock(result, matchIndex + fullMatch.length - 1);
    if (block) {
      const val = parseRawValue(variables[varName]);
      const isTrue = Boolean(val);

      const replacement = isTrue ? processControlFlow(block.body, variables) : '';
      result = result.substring(0, matchIndex) + replacement + result.substring(block.endIndex);
      shortRegex.lastIndex = matchIndex + replacement.length;
    }
  }

  // 3. Procesar @for (item of list) { ... } @empty { ... }
  let forMatch: RegExpExecArray | null;
  const forRegex = /@for\s*\(\s*(\w+)\s+of\s+([^;)]+)(?:;\s*track\s+[^)]+)?\)\s*/g;
  while ((forMatch = forRegex.exec(result)) !== null) {
    const fullMatch = forMatch[0];
    const matchIndex = forMatch.index;
    const itemName = forMatch[1];
    const listExpr = forMatch[2];

    const bodyBlock = extractBalancedBlock(result, matchIndex + fullMatch.length - 1);
    if (bodyBlock) {
      let totalEndIndex = bodyBlock.endIndex;
      let emptyBody = '';

      // Verificar si viene seguido de @empty { ... }
      const afterBody = result.substring(bodyBlock.endIndex);
      const emptyMatch = afterBody.match(/^\s*@empty\s*/);
      if (emptyMatch) {
        const emptyBlock = extractBalancedBlock(result, bodyBlock.endIndex + emptyMatch[0].length - 1);
        if (emptyBlock) {
          emptyBody = emptyBlock.body;
          totalEndIndex = emptyBlock.endIndex;
        }
      }

      const cleanListExpr = listExpr.replace(/^this\./, '').trim();
      const listVal = parseRawValue(variables[cleanListExpr]);

      let replacement = '';
      if (Array.isArray(listVal) && listVal.length > 0) {
        replacement = listVal.map(item => {
          let itemHtml = bodyBlock.body;
          const itemRegex = new RegExp(`\\{\\s*${itemName}\\s*\\}`, 'g');
          return itemHtml.replace(itemRegex, String(item));
        }).join('\n');
      } else {
        replacement = emptyBody ? emptyBody.trim() : '';
      }

      result = result.substring(0, matchIndex) + replacement + result.substring(totalEndIndex);
      forRegex.lastIndex = matchIndex + replacement.length;
    }
  }

  // 4. Procesar @if (condition) { ... } @else { ... }
  let ifMatch: RegExpExecArray | null;
  const ifRegex = /@if\s*\(([^)]+)\)\s*/g;
  while ((ifMatch = ifRegex.exec(result)) !== null) {
    const fullMatch = ifMatch[0];
    const matchIndex = ifMatch.index;
    const condExpr = ifMatch[1];

    const ifBlock = extractBalancedBlock(result, matchIndex + fullMatch.length - 1);
    if (ifBlock) {
      let totalEndIndex = ifBlock.endIndex;
      let elseBody = '';

      // Verificar si viene seguido de @else { ... }
      const afterIf = result.substring(ifBlock.endIndex);
      const elseMatch = afterIf.match(/^\s*@else\s*/);
      if (elseMatch) {
        const elseBlock = extractBalancedBlock(result, ifBlock.endIndex + elseMatch[0].length - 1);
        if (elseBlock) {
          elseBody = elseBlock.body;
          totalEndIndex = elseBlock.endIndex;
        }
      }

      const cleanCond = condExpr.replace(/^this\./, '').trim();
      const val = parseRawValue(variables[cleanCond]);
      const isTrue = Boolean(val);

      const replacement = isTrue ? processControlFlow(ifBlock.body, variables) : (elseBody ? processControlFlow(elseBody, variables) : '');
      result = result.substring(0, matchIndex) + replacement + result.substring(totalEndIndex);
      ifRegex.lastIndex = matchIndex + replacement.length;
    }
  }

  // 5. Procesar atributos dinámicos class={this.isActive ? 'card active' : 'card'}
  result = result.replace(/class=\{\s*(?:this\.)?(\w+)\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']\s*\}/g, (match, varName, trueClass, falseClass) => {
    const val = parseRawValue(variables[varName]);
    const isTrue = Boolean(val);
    return `class="${isTrue ? trueClass : falseClass}"`;
  });

  return result;
}
