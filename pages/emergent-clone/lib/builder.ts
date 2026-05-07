import { generateCode } from './llm'

export interface BuildResult {
  success: boolean
  output: string
  files?: Record<string, string>
  error?: string
}

export async function executeBuild(prompt: string, files: Record<string, string> = {}): Promise<BuildResult> {
  try {
    // Generate code based on prompt
    const context = files && Object.keys(files).length > 0
      ? `File esistenti:\n${Object.entries(files).map(([k, v]) => `${k}:\n${v}`).join('\n\n')}`
      : undefined

    const code = await generateCode(prompt, context)

    // Extract code blocks from response
    const codeBlocks = extractCodeBlocks(code)

    return {
      success: true,
      output: code,
      files: codeBlocks,
    }
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    }
  }
}

function extractCodeBlocks(content: string): Record<string, string> {
  const files: Record<string, string> = {}
  const regex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const lang = match[1] || 'txt'
    const filename = match[2] || `file_${Object.keys(files).length}.${getExtension(lang)}`
    const code = match[3].trim()
    files[filename] = code
  }

  // If no code blocks found, treat entire content as a single file
  if (Object.keys(files).length === 0 && content.trim()) {
    files['output.txt'] = content.trim()
  }

  return files
}

function getExtension(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'ts',
    ts: 'ts',
    typescriptreact: 'tsx',
    tsx: 'tsx',
    javascript: 'js',
    js: 'js',
    javascriptreact: 'jsx',
    jsx: 'jsx',
    python: 'py',
    py: 'py',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    markdown: 'md',
    md: 'md',
    sql: 'sql',
    shell: 'sh',
    bash: 'sh',
  }
  return map[lang.toLowerCase()] || 'txt'
}
