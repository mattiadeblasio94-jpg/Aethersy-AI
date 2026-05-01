'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  tags: string[];
  links: string[];
}

interface Node {
  id: string;
  label: string;
  group: 'note' | 'tag';
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  type: 'tag' | 'link';
}

interface KnowledgeGraphProps {
  notes: Note[];
  height?: number;
}

export default function KnowledgeGraph({ notes, height = 400 }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Costruisci grafo da note
  useEffect(() => {
    const nodeMap = new Map<string, Node>();
    const linkList: Link[] = [];
    const tags = new Set<string>();

    // Raccogli tutti i tag
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });

    // Crea nodi per le note
    notes.forEach((note, i) => {
      const angle = (2 * Math.PI * i) / notes.length;
      const radius = 150;
      nodeMap.set(note.id, {
        id: note.id,
        label: note.title,
        group: 'note',
        x: 200 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        vx: 0,
        vy: 0
      });

      // Collega note ai tag
      note.tags?.forEach(tag => {
        if (!nodeMap.has(`tag-${tag}`)) {
          const tagAngle = (2 * Math.PI * Array.from(tags).indexOf(tag)) / tags.length;
          nodeMap.set(`tag-${tag}`, {
            id: `tag-${tag}`,
            label: tag,
            group: 'tag',
            x: 200 + 80 * Math.cos(tagAngle),
            y: 200 + 80 * Math.sin(tagAngle),
            vx: 0,
            vy: 0
          });
        }
        linkList.push({ source: note.id, target: `tag-${tag}`, type: 'tag' });
      });

      // Collega note alle note linkate
      note.links?.forEach(linkedTitle => {
        const linkedNote = notes.find(n => n.title === linkedTitle);
        if (linkedNote && nodeMap.has(linkedNote.id)) {
          linkList.push({ source: note.id, target: linkedNote.id, type: 'link' });
        }
      });
    });

    setNodes(Array.from(nodeMap.values()));
    setLinks(linkList);
  }, [notes]);

  // Simulazione fisica semplice
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));
        const k = 50; // costante molla
        const damping = 0.9;

        // Forza di attrazione/repulsione lungo i link
        links.forEach(link => {
          const source = newNodes.find(n => n.id === link.source);
          const target = newNodes.find(n => n.id === link.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * k; // lunghezza riposo 80

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        });

        // Repulsione tra nodi
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const a = newNodes[i];
            const b = newNodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        // Applica velocità e damping
        return newNodes.map(node => ({
          ...node,
          x: Math.max(50, Math.min(350, node.x + node.vx)),
          y: Math.max(50, Math.min(350, node.y + node.vy)),
          vx: node.vx * damping,
          vy: node.vy * damping
        }));
      });
    }, 16);

    return () => clearInterval(interval);
  }, [links]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h3 className="text-lg font-semibold mb-4 text-white">🧠 Knowledge Graph</h3>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox="0 0 400 400"
        className="overflow-visible"
      >
        {/* Links */}
        {links.map((link, i) => {
          const source = nodes.find(n => n.id === link.source);
          const target = nodes.find(n => n.id === link.target);
          if (!source || !target) return null;

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={link.type === 'tag' ? '#4b5563' : '#00ff88'}
              strokeWidth={link.type === 'tag' ? 1 : 2}
              opacity={hoveredNode ? (link.source === hoveredNode || link.target === hoveredNode ? 1 : 0.2) : 0.5}
              className="transition-opacity duration-200"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
          >
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.group === 'note' ? 12 : 8}
              fill={node.group === 'note' ? '#00ff88' : '#7b2cff'}
              opacity={hoveredNode ? (hoveredNode === node.id ? 1 : 0.3) : 0.8}
              animate={{
                scale: hoveredNode === node.id ? 1.2 : 1
              }}
              transition={{ duration: 0.15 }}
            />
            <text
              x={node.x}
              y={node.y + (node.group === 'note' ? 25 : 18)}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize={node.group === 'note' ? 10 : 8}
              className="pointer-events-none select-none"
            >
              {node.label.length > 20 ? node.label.slice(0, 17) + '...' : node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span>Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Tag</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-400" />
          <span>Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-600" />
          <span>Tag relation</span>
        </div>
      </div>
    </div>
  );
}
