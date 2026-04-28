/**
 * ECS Resource Status API
 * Monitoraggio risorse Alibaba Cloud ECS
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const resources = await getECSResources()
    return res.json(resources)
  } catch (error: any) {
    console.error('ECS status error:', error)
    return res.status(500).json({
      error: error.message,
      fallback: { cpu: 0, memory: 0, disk: 0 }
    })
  }
}

async function getECSResources() {
  const [cpuInfo, memInfo, diskInfo] = await Promise.all([
    execAsync('top -bn1 | grep "Cpu(s)" || echo "0"').catch(() => ({ stdout: '0' })),
    execAsync('free -m | grep Mem').catch(() => ({ stdout: 'Mem: 0 0 0' })),
    execAsync('df -h / | tail -1').catch(() => ({ stdout: '/dev 0 0 0 0 /' }))
  ])

  // Parse CPU
  const cpuMatch = cpuInfo.stdout.match(/(\d+\.?\d*)\s*id/)
  const cpuIdle = cpuMatch ? parseFloat(cpuMatch[1]) : 0
  const cpu = 100 - cpuIdle

  // Parse Memory
  const memParts = memInfo.stdout.split(/\s+/)
  const totalMem = parseInt(memParts[1]) || 1
  const usedMem = parseInt(memParts[2]) || 0
  const memory = (usedMem / totalMem) * 100

  // Parse Disk
  const diskParts = diskInfo.stdout.split(/\s+/)
  const disk = parseInt(diskParts[4]) || 0

  // Network stats
  const network = await getNetworkStats()

  // Alert se risorse critiche
  let alert: string | undefined
  let alertLevel: 'info' | 'warning' | 'critical' = 'info'

  if (cpu > 90 || memory > 90 || disk > 95) {
    alert = `Critico: CPU ${cpu.toFixed(1)}% | RAM ${memory.toFixed(1)}% | Disco ${disk}%`
    alertLevel = 'critical'
  } else if (cpu > 80 || memory > 80 || disk > 90) {
    alert = `Attenzione: CPU ${cpu.toFixed(1)}% | RAM ${memory.toFixed(1)}% | Disco ${disk}%`
    alertLevel = 'warning'
  }

  return {
    cpu: Math.round(cpu * 10) / 10,
    memory: Math.round(memory * 10) / 10,
    disk,
    network,
    alert,
    alertLevel,
    timestamp: new Date().toISOString()
  }
}

async function getNetworkStats() {
  try {
    const { stdout } = await execAsync('cat /proc/net/dev | grep -E "eth0|ens" | head -1')
    const parts = stdout.trim().split(/\s+/)

    return {
      in: Math.round(parseInt(parts[1]) / 1024 / 1024),  // MB ricevuti
      out: Math.round(parseInt(parts[9]) / 1024 / 1024)  // MB inviati
    }
  } catch {
    return { in: 0, out: 0 }
  }
}
