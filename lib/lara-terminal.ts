/**
 * LARA TERMINAL INTERFACE — Self-Coding Capability
 * Module 03: Execute internal scripts, auto-improvement
 *
 * Security: Sandbox execution con Docker containers
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

// ============================================
// CONFIGURAZIONE SANDBOX
// ============================================

const SANDBOX_DIR = process.env.LARA_SANDBOX_DIR || '/tmp/lara-sandbox'
const DOCKER_ENABLED = process.env.LARA_DOCKER_SANDBOX === 'true'

// ============================================
// TIPI
// ============================================

export interface ScriptExecutionResult {
  success: boolean
  output: string
  error?: string
  exitCode?: number
  duration_ms: number
  language: string
  sandbox: boolean
}

export interface CodeImprovement {
  filePath: string
  originalCode: string
  improvedCode: string
  changes: {
    line: number
    type: 'fix' | 'optimize' | 'refactor' | 'security'
    description: string
  }[]
  confidence: number
}

// ============================================
// EXECUTE INTERNAL SCRIPT
// ============================================

export async function executeInternalScript(params: {
  language: 'python' | 'nodejs' | 'bash' | 'typescript'
  code: string
  sandbox?: boolean
  timeout?: number
  env?: Record<string, string>
  args?: string[]
}): Promise<ScriptExecutionResult> {
  const {
    language,
    code,
    sandbox = true,
    timeout = 30000,
    env = {},
    args = []
  } = params

  const startTime = Date.now()

  if (sandbox && DOCKER_ENABLED) {
    return executeInDocker(language, code, timeout, env, args)
  }

  if (sandbox) {
    return executeInSandbox(language, code, timeout, env, args)
  }

  return executeDirect(language, code, timeout, env, args)
}

// ============================================
// DOCKER SANDBOX (PRODUZIONE)
// ============================================

async function executeInDocker(
  language: string,
  code: string,
  timeout: number,
  env: Record<string, string>,
  args: string[]
): Promise<ScriptExecutionResult> {
  const startTime = Date.now()

  try {
    // Crea file temporaneo
    const ext = getExtension(language)
    const fileName = `script_${Date.now()}${ext}`
    const containerPath = `/app/${fileName}`

    // Scrivi codice nel file
    const filePath = path.join(SANDBOX_DIR, fileName)
    await fs.promises.writeFile(filePath, code)

    // Determina immagine Docker
    const image = getDockerImage(language)

    // Esegui in Docker
    const { stdout, stderr } = await execAsync(
      `docker run --rm ` +
      `--memory=512m --cpus=1.0 ` +
      `-v "${SANDBOX_DIR}:/app:ro" ` +
      `--network=none ` +
      `--pids-limit=50 ` +
      `--read-only ` +
      `--tmpfs /tmp:noexec,nosuid,size=100m ` +
      `${image} ${getRunCommand(language, containerPath)} ${args.join(' ')}`,
      { timeout, env: { ...process.env, ...env } }
    )

    return {
      success: true,
      output: stdout,
      error: stderr || undefined,
      duration_ms: Date.now() - startTime,
      language,
      sandbox: true
    }
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      exitCode: error.code,
      duration_ms: Date.now() - startTime,
      language,
      sandbox: true
    }
  }
}

// ============================================
// SANDBOX SIMULATA (SVILUPPO)
// ============================================

async function executeInSandbox(
  language: string,
  code: string,
  timeout: number,
  env: Record<string, string>,
  args: string[]
): Promise<ScriptExecutionResult> {
  const startTime = Date.now()

  try {
    // Crea directory sandbox
    await fs.promises.mkdir(SANDBOX_DIR, { recursive: true })

    const ext = getExtension(language)
    const fileName = `script_${Date.now()}${ext}`
    const filePath = path.join(SANDBOX_DIR, fileName)

    // Scrivi codice
    await fs.promises.writeFile(filePath, code)

    // Esegui con limitazioni
    const command = getRunCommand(language, filePath)

    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        shell: true,
        env: { ...process.env, ...env },
        timeout
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (d) => (stdout += d.toString()))
      proc.stderr?.on('data', (d) => (stderr += d.toString()))

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr || undefined,
          exitCode: code || undefined,
          duration_ms: Date.now() - startTime,
          language,
          sandbox: true
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message,
          duration_ms: Date.now() - startTime,
          language,
          sandbox: true
        })
      })
    })
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      duration_ms: Date.now() - startTime,
      language,
      sandbox: true
    }
  }
}

// ============================================
// ESECUZIONE DIRETTA (SOLO TRUSTED)
// ============================================

async function executeDirect(
  language: string,
  code: string,
  timeout: number,
  env: Record<string, string>,
  args: string[]
): Promise<ScriptExecutionResult> {
  const startTime = Date.now()

  try {
    if (language === 'python') {
      const { stdout, stderr } = await execAsync(
        `python3 -c "${escapeShell(code)}"`,
        { timeout, env: { ...process.env, ...env } }
      )
      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        duration_ms: Date.now() - startTime,
        language,
        sandbox: false
      }
    }

    if (language === 'nodejs' || language === 'typescript') {
      // Crea file temporaneo
      const fileName = `script_${Date.now()}.${language === 'typescript' ? 'ts' : 'js'}`
      const filePath = path.join(SANDBOX_DIR, fileName)
      await fs.promises.writeFile(filePath, code)

      const cmd = language === 'typescript'
        ? `npx ts-node "${filePath}"`
        : `node "${filePath}"`

      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        env: { ...process.env, ...env }
      })

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        duration_ms: Date.now() - startTime,
        language,
        sandbox: false
      }
    }

    if (language === 'bash') {
      const { stdout, stderr } = await execAsync(code, {
        timeout,
        env: { ...process.env, ...env }
      })
      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        duration_ms: Date.now() - startTime,
        language,
        sandbox: false
      }
    }

    return {
      success: false,
      output: '',
      error: `Linguaggio "${language}" non supportato`,
      duration_ms: Date.now() - startTime,
      language,
      sandbox: false
    }
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code,
      duration_ms: Date.now() - startTime,
      language,
      sandbox: false
    }
  }
}

// ============================================
// CODE IMPROVEMENT (AUTO-CODING)
// ============================================

export async function improveExistingCode(params: {
  filePath: string
  language: string
  goal: 'fix' | 'optimize' | 'refactor' | 'security'
}): Promise<CodeImprovement> {
  const { filePath, language, goal } = params

  // Leggi codice esistente
  const originalCode = await fs.promises.readFile(filePath, 'utf-8')

  // Analizza con AI
  const openai = new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Sei un esperto code reviewer.
Obiettivo: ${goal} il codice.
Linguaggio: ${language}

Analizza e fornisci:
1. Codice migliorato
2. Lista cambiamenti con tipo (fix/optimize/refactor/security)
3. Confidence score (0-1)

Formato JSON.`
      },
      {
        role: 'user',
        content: originalCode
      }
    ],
    response_format: { type: 'json_object' }
  })

  const improvement: CodeImprovement = JSON.parse(
    completion.choices[0].message.content!
  )

  improvement.filePath = filePath
  improvement.originalCode = originalCode

  // Salva versione migliorata
  const backupPath = `${filePath}.bak`
  await fs.promises.writeFile(backupPath, originalCode)
  await fs.promises.writeFile(filePath, improvement.improvedCode)

  return improvement
}

// ============================================
// MONITORAGGIO RISORSE ECS
// ============================================

export async function monitorECSResources(): Promise<{
  cpu: number
  memory: number
  disk: number
  network: { in: number; out: number }
  alert?: string
}> {
  try {
    // Linux: usa comandi di sistema
    const [cpuInfo, memInfo, diskInfo] = await Promise.all([
      execAsync('top -bn1 | grep "Cpu(s)" || echo "0"'),
      execAsync('free -m | grep Mem'),
      execAsync('df -h / | tail -1')
    ])

    const cpu = parseFloat(cpuInfo.stdout.split(',')[1]?.split(':')[1] || '0')
    const memParts = memInfo.stdout.split(/\s+/)
    const memory = (parseInt(memParts[2]) / parseInt(memParts[1])) * 100
    const diskParts = diskInfo.stdout.split(/\s+/)
    const disk = parseInt(diskParts[4]) || 0

    let alert: string | undefined

    if (cpu > 80) alert = `⚠️ CPU alta: ${cpu.toFixed(1)}%`
    else if (memory > 80) alert = `⚠️ RAM alta: ${memory.toFixed(1)}%`
    else if (disk > 90) alert = `⚠️ Disco pieno: ${disk}%`

    return { cpu, memory, disk, network: { in: 0, out: 0 }, alert }
  } catch (e) {
    console.log('Monitoraggio ECS non disponibile')
    return { cpu: 0, memory: 0, disk: 0, network: { in: 0, out: 0 } }
  }
}

// ============================================
// AUTO-IMPROVEMENT LARA
// ============================================

export async function laraSelfImprovement(params: {
  module: string
  improvementType: 'performance' | 'security' | 'features'
}): Promise<{ success: boolean; changes?: CodeImprovement }> {
  const { module, improvementType } = params

  // Mappa moduli Lara a file
  const modulePaths: Record<string, string> = {
    'lara-core': path.join(__dirname, 'lara-core.ts'),
    'cinema-studio': path.join(__dirname, 'cinema-studio.ts'),
    'terminal': path.join(__dirname, 'lara-terminal.ts'),
    'supabase': path.join(__dirname, 'supabase.ts')
  }

  const filePath = modulePaths[module]
  if (!filePath) {
    return { success: false }
  }

  const language = filePath.endsWith('.ts') ? 'typescript' : 'python'

  const improvement = await improveExistingCode({
    filePath,
    language,
    goal: improvementType === 'performance' ? 'optimize' :
          improvementType === 'security' ? 'security' : 'refactor'
  })

  return { success: true, changes: improvement }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getExtension(language: string): string {
  const exts: Record<string, string> = {
    python: '.py',
    nodejs: '.js',
    typescript: '.ts',
    bash: '.sh'
  }
  return exts[language] || '.txt'
}

function getDockerImage(language: string): string {
  const images: Record<string, string> = {
    python: 'python:3.12-slim',
    nodejs: 'node:20-slim',
    typescript: 'node:20-slim',
    bash: 'alpine:latest'
  }
  return images[language] || 'alpine:latest'
}

function getRunCommand(language: string, filePath: string): string {
  const commands: Record<string, string> = {
    python: 'python3',
    nodejs: 'node',
    typescript: 'npx ts-node',
    bash: 'sh'
  }
  return `${commands[language] || 'cat'} "${filePath}"`
}

function escapeShell(code: string): string {
  return code.replace(/"/g, '\\"').replace(/\n/g, '; ')
}

// OpenAI dynamic import
const openai = typeof window === 'undefined'
  ? require('openai')
  : null
