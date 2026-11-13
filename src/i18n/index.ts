import en from './en.json';

type Node = string | string[] | { [key: string]: Node };

const dictionaries: Record<string, Node> = { en };
let current: Node = dictionaries.en;

/** Switch language later (e.g. 'fa'). Only English exists for now. */
export function setLanguage(lang: string) {
  current = dictionaries[lang] ?? dictionaries.en;
}

function lookup(path: string): Node | undefined {
  let node: Node | undefined = current;
  for (const part of path.split('.')) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return node;
}

/**
 * Look up a UI string by dot path, e.g. t('welcome.title').
 * `{name}` placeholders are filled from `vars`.
 */
export function t(path: string, vars?: Record<string, string | number>): string {
  const node = lookup(path);
  if (typeof node !== 'string') return path;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Look up a list of strings, e.g. tList('questions.Sleep.answers'). */
export function tList(path: string): string[] {
  const node = lookup(path);
  return Array.isArray(node) ? node : [];
}
