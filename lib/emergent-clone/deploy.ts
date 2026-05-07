const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID!;
const FLY_API_TOKEN = process.env.FLY_API_TOKEN!;

export async function triggerVercelDeploy(params: {
  projectName: string;
  repoUrl: string;
}): Promise<{ dashboardUrl: string }> {
  const res = await fetch("https://api.vercel.com/v10/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: params.projectName,
      gitRepository: {
        type: "github",
        repo: params.repoUrl.replace("https://github.com/", "")
      },
      framework: "nextjs",
      teamId: VERCEL_TEAM_ID
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel error: ${text}`);
  }

  const data = await res.json();
  return { dashboardUrl: `https://vercel.com/${data.accountId}/${data.name}` };
}

export async function triggerFlyDeploy(params: {
  appName: string;
  repoUrl: string;
}): Promise<{ dashboardUrl: string }> {
  return {
    dashboardUrl: `https://fly.io/apps/${params.appName}`
  };
}
