import { Redis } from '@upstash/redis'

let redisInstance = null

export function getRedis() {
  if (redisInstance) return redisInstance

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('⚠️ Redis non configurato - alcune funzionalità saranno disabilitate')
    // Fallback: mock in-memory per sviluppo
    const mockData = new Map()
    redisInstance = {
      async get(key) {
        const item = mockData.get(key)
        if (!item) return null
        if (item.expire && Date.now() > item.expire) {
          mockData.delete(key)
          return null
        }
        return item.value
      },
      async setex(key, seconds, value) {
        mockData.set(key, { value, expire: Date.now() + seconds * 1000 })
        return 'OK'
      },
      async set(key, value) {
        mockData.set(key, { value })
        return 'OK'
      },
      async del(key) {
        return mockData.delete(key)
      },
      async lpush(key, ...values) {
        let list = mockData.get(key)?.value || []
        list = [...values.map(JSON.parse), ...list]
        mockData.set(key, { value: list })
        return list.length
      },
      async lrange(key, start, end) {
        const list = mockData.get(key)?.value || []
        return list.slice(start, end === -1 ? list.length : end + 1)
      },
      async ltrim(key, start, end) {
        let list = mockData.get(key)?.value || []
        list = list.slice(start, end === -1 ? list.length : end + 1)
        mockData.set(key, { value: list })
        return 'OK'
      },
      async sadd(key, ...members) {
        let set = new Set(mockData.get(key)?.value || [])
        members.forEach(m => set.add(m))
        mockData.set(key, { value: [...set] })
        return set.size
      },
      async smembers(key) {
        return mockData.get(key)?.value || []
      },
      async sismember(key, member) {
        const set = new Set(mockData.get(key)?.value || [])
        return set.has(member) ? 1 : 0
      },
      async keys(pattern) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
        return [...mockData.keys()].filter(k => regex.test(k))
      },
      async publish(channel, message) {
        // Mock pubsub - no-op in memory
        console.log(`PubSub ${channel}:`, message.slice(0, 100))
        return 0
      },
      async subscribe(channel) {
        return { unsubscribe: () => {} }
      }
    }
    return redisInstance
  }

  redisInstance = new Redis({ url, token })
  return redisInstance
}
