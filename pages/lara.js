import LaraChat from '../components/LaraChat'
import { v4 as uuidv4 } from 'uuid'

export default function LaraPage() {
  return (
    <LaraChat
      userId="demo_user"
      sessionId={uuidv4()}
      placeholder="Dimmi cosa vuoi fare — Lara lo esegue..."
    />
  )
}
