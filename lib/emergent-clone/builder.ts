import { generateCode } from './llm'
import fs from "fs/promises";
import path from "path";

export interface BuildResult {
  success: boolean
  output: string
  files?: Record<string, string>
  error?: string
}

export async function executeBuild(prompt: string, files: Record<string, string> = {}): Promise<BuildResult> {
  try {
    const context = files && Object.keys(files).length > 0 ? `File esistenti:\n${Object.entries(files).map(([k, v]) => `${k}:\n${v}`).join('\n\n')}` : undefined
    const code = await generateCode(prompt, context)
    const codeBlocks = extractCodeBlocks(code)
    return { success: true, output: code, files: codeBlocks }
  } catch (error: any) {
    return { success: false, output: '', error: error.message }
  }
}

function extractCodeBlocks(content: string): Record<string, string> {
  const files: Record<string, string> = {}
  const regex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const lang = match[1] || 'txt'
    const filename = match[2] || `file_${Object.keys(files).length}.${getExtension(lang)}`
    files[filename] = match[3].trim()
  }
  if (Object.keys(files).length === 0 && content.trim()) files['output.txt'] = content.trim()
  return files
}

function getExtension(lang: string): string {
  const map: Record<string, string> = { typescript: 'ts', ts: 'ts', typescriptreact: 'tsx', tsx: 'tsx', javascript: 'js', js: 'js', javascriptreact: 'jsx', jsx: 'jsx', python: 'py', py: 'py', css: 'css', scss: 'scss', html: 'html', json: 'json', markdown: 'md', md: 'md', sql: 'sql', shell: 'sh', bash: 'sh' }
  return map[lang.toLowerCase()] || 'txt'
}

interface AppSpec {
  name: string;
  pages: { path: string; components: string[] }[];
  api_routes: { path: string; description: string }[];
  db_models: { name: string; fields: { name: string; type: string }[] }[];
}

const ROOT_OUTPUT = process.env.BUILDER_OUTPUT_DIR ?? "/tmp/aiforge-builds";

export async function materializeApp(spec: AppSpec): Promise<{ path: string }> {
  const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const appDir = path.join(ROOT_OUTPUT, slug + "-" + Date.now().toString());

  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, "app"), { recursive: true });

  // basic package.json
  await fs.writeFile(
    path.join(appDir, "package.json"),
    JSON.stringify(
      {
        name: slug,
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        },
        dependencies: {
          next: "14.2.3",
          react: "18.3.1",
          "react-dom": "18.3.1"
        }
      },
      null,
      2
    )
  );

  // generate pages
  for (const page of spec.pages) {
    const filePath = path.join(appDir, "app", page.path, "page.tsx");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const content = `export default function Page() {
  return (
    <main>
      <h1>${spec.name} - ${page.path}</h1>
      <p>Generated skeleton page.</p>
    </main>
  );
}
`;
    await fs.writeFile(filePath, content);
  }

  // TODO: generate api routes, db models, etc.

  return { path: appDir };
}
