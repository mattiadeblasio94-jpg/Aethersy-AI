import { exec as _exec } from "child_process";
import { promisify } from "util";
import path from "path";
const exec = promisify(_exec);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;

export async function initAndPushRepo(localPath: string, repoName: string): Promise<{ repoUrl: string }> {
  const slug = repoName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const remoteRepo = `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${slug}.git`;

  await exec(`gh repo create ${GITHUB_OWNER}/${slug} --private --confirm`, {
    env: { ...process.env, GITHUB_TOKEN }
  });

  await exec(`git init`, { cwd: localPath });
  await exec(`git add .`, { cwd: localPath });
  await exec(`git commit -m "Initial AIForge generated app"`, { cwd: localPath });
  await exec(`git branch -M main`, { cwd: localPath });
  await exec(`git remote add origin ${remoteRepo}`, { cwd: localPath });
  await exec(`git push -u origin main`, { cwd: localPath });

  return { repoUrl: `https://github.com/${GITHUB_OWNER}/${slug}` };
}
