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

interface Field {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

interface DbModel {
  name: string;
  table: string;
  fields: Field[];
}

interface PageComponent {
  name: string;
  type: string;
  props: Record<string, any>;
}

interface PageSpec {
  path: string;
  title: string;
  route_type: "public" | "protected";
  components: PageComponent[];
}

interface ApiRouteSpec {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  handler_name: string;
  description: string;
  input_schema: { zod: string };
  output_schema: { zod: string };
}

interface AppSpec {
  name: string;
  description: string;
  stack: any;
  pages: PageSpec[];
  api_routes: ApiRouteSpec[];
  db_models: DbModel[];
  ui_style: any;
}

const ROOT_OUTPUT = process.env.BUILDER_OUTPUT_DIR ?? "/tmp/aiforge-builds";

async function writeFileSafe(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function pageComponentToTsx(c: PageComponent): string {
  switch (c.type) {
    case "layout":
      return `<section className="space-y-4">
  <h1 className="text-2xl font-semibold">${c.name}</h1>
</section>`;
    case "form":
      return `<form className="space-y-3">
  <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700" placeholder="${c.props.placeholder ?? "Input"}" />
  <button className="px-3 py-2 rounded-md bg-cyan-400 text-slate-900 text-sm font-medium">
    ${c.props.submitLabel ?? "Submit"}
  </button>
</form>`;
    case "table":
      return `<div className="border border-slate-800 rounded-lg overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-slate-900">
      <tr>
        ${(c.props.columns ?? ["Name", "Value"]).map((col: string) => `<th className="px-3 py-2 text-left">${col}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      <tr>
        ${(c.props.columns ?? ["Name", "Value"]).map((col: string) => `<td className="px-3 py-2 text-slate-400">Sample</td>`).join("")}
      </tr>
    </tbody>
  </table>
</div>`;
    default:
      return `<div className="p-4 rounded-md bg-slate-900 border border-slate-800">
  <p>${c.name}</p>
</div>`;
  }
}

function generatePageTsx(page: PageSpec, appName: string): string {
  const components = page.components.map(pageComponentToTsx).join("\n\n      ");
  return `export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">${appName} – ${page.title}</h1>
          <p className="text-sm text-slate-400">${page.route_type === "protected" ? "Area protetta" : "Area pubblica"}</p>
        </header>
        ${components}
      </div>
    </main>
  );
}
`;
}

function generateApiRoute(route: ApiRouteSpec): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const InputSchema = ${route.input_schema.zod || "z.object({})"};
const OutputSchema = ${route.output_schema.zod || "z.object({ ok: z.boolean() })"};

export async function ${route.method.toLowerCase()}(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const input = InputSchema.parse(json);

    // TODO: implement business logic
    const result = { ok: true };

    return NextResponse.json(OutputSchema.parse(result));
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid request" }, { status: 400 });
  }
}
`;
}

function generateDbModelSql(model: DbModel): string {
  const fieldsSql = model.fields.map(f => {
    const baseType = f.type.toLowerCase();
    const sqlType =
      baseType === "uuid" ? "uuid" :
      baseType === "int" || baseType === "integer" ? "integer" :
      baseType === "bool" || baseType === "boolean" ? "boolean" :
      baseType === "json" ? "jsonb" :
      "text";

    const nullable = f.nullable ? "" : " not null";
    const primary = f.primary ? " primary key" : "";
    return `  ${f.name} ${sqlType}${nullable}${primary}`;
  }).join(",\n");

  return `create table if not exists ${model.table} (
${fieldsSql}
);
`;
}

export async function materializeApp(spec: AppSpec): Promise<{ path: string }> {
  const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const appDir = path.join(ROOT_OUTPUT, slug + "-" + Date.now().toString());

  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(appDir, "app"), { recursive: true });

  await writeFileSafe(
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
          "react-dom": "18.3.1",
          zod: "3.23.8"
        }
      },
      null,
      2
    )
  );

  for (const page of spec.pages) {
    const normalizedPath = page.path === "/" ? "" : page.path.replace(/^\//, "");
    const filePath = path.join(appDir, "app", normalizedPath, "page.tsx");
    await writeFileSafe(filePath, generatePageTsx(page, spec.name));
  }

  for (const route of spec.api_routes) {
    const normalizedPath = route.path.replace(/^\/api\//, "");
    const filePath = path.join(appDir, "app", "api", normalizedPath, "route.ts");
    await writeFileSafe(filePath, generateApiRoute(route));
  }

  if (spec.db_models?.length) {
    const sql = spec.db_models.map(generateDbModelSql).join("\n\n");
    await writeFileSafe(path.join(appDir, "db.schema.sql"), sql);
  }

  return { path: appDir };
}
