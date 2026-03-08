import { useState, useEffect, useRef, useCallback } from "react";


// Add this shim for window.storage
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    }
  };
}

const NODE_TYPES = {
  Concept: { color: "#60a5fa", glow: "#3b82f6", label: "Concept" },
  Field: { color: "#a78bfa", glow: "#8b5cf6", label: "Field" },
  Person: { color: "#34d399", glow: "#10b981", label: "Person" },
  Claim: { color: "#fbbf24", glow: "#f59e0b", label: "Claim" },
  Question: { color: "#f87171", glow: "#ef4444", label: "Question" },
  Example: { color: "#fb923c", glow: "#f97316", label: "Example" },
};

const EDGE_TYPES = {
  "is-a": { color: "#a78bfa", label: "is-a / part-of", dash: "" },
  "influences": { color: "#60a5fa", label: "influences / leads-to", dash: "8,4" },
  "contradicts": { color: "#f87171", label: "contradicts / supports", dash: "4,4" },
  "example-of": { color: "#fb923c", label: "example-of / instance-of", dash: "2,6" },
};

const SEED_NODES = [
  { id: "1", label: "Physics", type: "Field", x: 400, y: 300, desc: "The study of matter, energy, and the fundamental forces of nature." },
  { id: "2", label: "Mathematics", type: "Field", x: 650, y: 200, desc: "The abstract science of number, quantity, and space." },
  { id: "3", label: "Entropy", type: "Concept", x: 250, y: 180, desc: "A measure of disorder or randomness in a system." },
  { id: "4", label: "Information Theory", type: "Field", x: 150, y: 350, desc: "Mathematical study of encoding, transmission and storage of information." },
  { id: "5", label: "Claude Shannon", type: "Person", x: 100, y: 200, desc: "Mathematician who founded information theory." },
  { id: "6", label: "Thermodynamics", type: "Field", x: 350, y: 480, desc: "Branch of physics dealing with heat, work, and energy transfer." },
  { id: "7", label: "Does entropy always increase?", type: "Question", x: 550, y: 420, desc: "The second law of thermodynamics states entropy increases — but why?" },
  { id: "8", label: "Heat Death of Universe", type: "Claim", x: 700, y: 380, desc: "The hypothesis that the universe will reach maximum entropy and cease all processes." },
  { id: "9", label: "A shuffled deck of cards", type: "Example", x: 180, y: 480, desc: "A shuffled deck has higher entropy than a sorted one — more disordered arrangements exist." },
  { id: "10", label: "Calculus", type: "Concept", x: 750, y: 280, desc: "Mathematical study of continuous change, via derivatives and integrals." },
  { id: "11", label: "Evolution", type: "Concept", x: 600, y: 100, desc: "Change in heritable traits across biological populations over time." },
  { id: "12", label: "Natural Selection", type: "Concept", x: 750, y: 130, desc: "Process where organisms with favorable traits reproduce more successfully." },
  { id: "13", label: "Emergence", type: "Concept", x: 450, y: 130, desc: "Complex patterns arising from simple rules — the whole is more than the sum of parts." },
  { id: "14", label: "Reductionism", type: "Claim", x: 300, y: 80, desc: "The idea that complex systems can be fully explained by their components." },
];

const SEED_EDGES = [
  { id: "e1", source: "1", target: "3", type: "is-a" },
  { id: "e2", source: "1", target: "6", type: "is-a" },
  { id: "e3", source: "5", target: "4", type: "influences" },
  { id: "e4", source: "4", target: "3", type: "influences" },
  { id: "e5", source: "3", target: "9", type: "example-of" },
  { id: "e6", source: "6", target: "7", type: "influences" },
  { id: "e7", source: "7", target: "8", type: "influences" },
  { id: "e8", source: "2", target: "10", type: "is-a" },
  { id: "e9", source: "10", target: "1", type: "influences" },
  { id: "e10", source: "11", target: "12", type: "is-a" },
  { id: "e11", source: "12", target: "13", type: "example-of" },
  { id: "e12", source: "14", target: "13", type: "contradicts" },
  { id: "e13", source: "13", target: "1", type: "influences" },
  { id: "e14", source: "2", target: "1", type: "influences" },
  { id: "e15", source: "11", target: "3", type: "influences" },
];

const STORAGE_KEY = "knowledge-graph-v1";
function uid() { return Math.random().toString(36).slice(2, 9); }

export default function KnowledgeGraph() {
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [nodes, setNodes] = useState(SEED_NODES);
  const [edges, setEdges] = useState(SEED_EDGES);
  const [selected, setSelected] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [newNode, setNewNode] = useState({ label: "", type: "Concept", desc: "" });
  const [newEdge, setNewEdge] = useState({ source: "", target: "", type: "is-a" });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const animFrameRef = useRef(null);
  const velocities = useRef({});
  const posRef = useRef({});
  const saveTimer = useRef(null);

  // Load from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result?.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.nodes?.length && parsed.edges) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            posRef.current = {};
            parsed.nodes.forEach(n => { posRef.current[n.id] = { x: n.x, y: n.y }; });
          }
        }
      } catch {}
      setStorageReady(true);
    })();
  }, []);

  // Auto-save on change
  useEffect(() => {
    if (!storageReady) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ nodes, edges }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 1800);
      } catch { setSaveStatus("error"); }
    }, 900);
  }, [nodes, edges, storageReady]);

  // Init posRef
  useEffect(() => {
    posRef.current = {};
    nodes.forEach(n => { posRef.current[n.id] = { x: n.x, y: n.y }; });
  }, [nodes.length]);

  // Force simulation
  useEffect(() => {
    let running = true;
    const simulate = () => {
      if (!running) return;
      const pos = posRef.current;
      const vel = velocities.current;
      const ids = nodes.map(n => n.id);
      ids.forEach(id => {
        if (!vel[id]) vel[id] = { x: 0, y: 0 };
        if (!pos[id]) pos[id] = { x: 400, y: 300 };
      });
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const dx = pos[a].x - pos[b].x, dy = pos[a].y - pos[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 4000 / (dist * dist);
          vel[a].x += (dx / dist) * force; vel[a].y += (dy / dist) * force;
          vel[b].x -= (dx / dist) * force; vel[b].y -= (dy / dist) * force;
        }
      }
      edges.forEach(e => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 160) * 0.015;
        if (!vel[e.source]) vel[e.source] = { x: 0, y: 0 };
        if (!vel[e.target]) vel[e.target] = { x: 0, y: 0 };
        vel[e.source].x += (dx / dist) * force; vel[e.source].y += (dy / dist) * force;
        vel[e.target].x -= (dx / dist) * force; vel[e.target].y -= (dy / dist) * force;
      });
      ids.forEach(id => {
        vel[id].x += (500 - pos[id].x) * 0.002;
        vel[id].y += (350 - pos[id].y) * 0.002;
      });
      ids.forEach(id => {
        if (dragging === id) return;
        vel[id].x *= 0.8; vel[id].y *= 0.8;
        pos[id].x += vel[id].x; pos[id].y += vel[id].y;
      });
      setTick(t => t + 1);
      animFrameRef.current = requestAnimationFrame(simulate);
    };
    animFrameRef.current = requestAnimationFrame(simulate);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [edges, dragging, nodes.length]);

  useEffect(() => {
    if (tick % 3 !== 0) return;
    setNodes(prev => prev.map(n => {
      const p = posRef.current[n.id];
      return p ? { ...n, x: p.x, y: p.y } : n;
    }));
  }, [tick]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "knowledge-graph.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported knowledge-graph.json");
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.nodes || !parsed.edges) throw new Error();
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        posRef.current = {};
        parsed.nodes.forEach(n => { posRef.current[n.id] = { x: n.x, y: n.y }; });
        setSelected(null); setEditingNode(null);
        showToast(`Loaded ${parsed.nodes.length} nodes · ${parsed.edges.length} edges`);
      } catch { showToast("⚠ Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSvgMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === "svg") {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanStartOffset({ ...pan });
      setSelected(null);
    }
  }, [pan]);

  const handleSvgMouseMove = useCallback((e) => {
    if (dragging) {
      const rect = svgRef.current.getBoundingClientRect();
      posRef.current[dragging] = {
        x: (e.clientX - rect.left - pan.x) / zoom - dragOffset.x,
        y: (e.clientY - rect.top - pan.y) / zoom - dragOffset.y,
      };
      velocities.current[dragging] = { x: 0, y: 0 };
    } else if (isPanning) {
      setPan({ x: panStartOffset.x + (e.clientX - panStart.x), y: panStartOffset.y + (e.clientY - panStart.y) });
    }
  }, [dragging, isPanning, pan, zoom, dragOffset, panStart, panStartOffset]);

  const handleSvgMouseUp = useCallback(() => { setDragging(null); setIsPanning(false); }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(0.2, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => { if (svg) svg.removeEventListener("wheel", handleWheel); };
  }, [handleWheel]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    const node = posRef.current[nodeId] || nodes.find(n => n.id === nodeId);
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    setDragging(nodeId);
    setDragOffset({ x: mx - node.x, y: my - node.y });
    setSelected(nodeId);
  }, [nodes, pan, zoom]);

  const addNode = () => {
    if (!newNode.label.trim()) return;
    const id = uid();
    const n = { id, label: newNode.label.trim(), type: newNode.type, desc: newNode.desc, x: 400 + Math.random() * 200 - 100, y: 300 + Math.random() * 200 - 100 };
    posRef.current[id] = { x: n.x, y: n.y };
    velocities.current[id] = { x: 0, y: 0 };
    setNodes(prev => [...prev, n]);
    setNewNode({ label: "", type: "Concept", desc: "" });
    setShowAddNode(false);
    setSelected(id);
    showToast(`Added "${n.label}"`);
  };

  const addEdge = () => {
    if (!newEdge.source || !newEdge.target || newEdge.source === newEdge.target) return;
    setEdges(prev => [...prev, { id: uid(), ...newEdge }]);
    setNewEdge({ source: "", target: "", type: "is-a" });
    setShowAddEdge(false);
    showToast("Connection added");
  };

  const deleteNode = (id) => {
    const label = nodes.find(n => n.id === id)?.label;
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    setSelected(null); setEditingNode(null);
    showToast(`Deleted "${label}"`);
  };

  const deleteEdge = (id) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    showToast("Connection removed");
  };

  const saveEdit = () => {
    if (!editingNode) return;
    setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, ...editingNode } : n));
    setEditingNode(null);
    showToast("Node updated");
  };

  const selectedNode = nodes.find(n => n.id === selected);
  const connectedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : [];

  return (
    <div style={{ width: "100%", height: "100vh", background: "#020817", fontFamily: "'Space Mono','Courier New',monospace", display: "flex", flexDirection: "column", overflow: "hidden", color: "#e2e8f0" }}>

      {/* Toast notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "9px 18px", fontSize: 11, color: "#94a3b8", zIndex: 300, boxShadow: "0 4px 20px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header toolbar */}
      <div style={{ padding: "9px 14px", borderBottom: "1px solid #0f172a", display: "flex", alignItems: "center", gap: 10, background: "#040d1a", zIndex: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 10px #3b82f6" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#475569", textTransform: "uppercase" }}>Knowledge Graph</span>
          <span style={{ fontSize: 10, color: "#1e3a5f" }}>{nodes.length}n · {edges.length}e</span>
          {saveStatus === "saved" && <span style={{ fontSize: 9, color: "#34d399", letterSpacing: "0.1em" }}>● SAVED</span>}
          {saveStatus === "error" && <span style={{ fontSize: 9, color: "#f87171" }}>● SAVE FAILED</span>}
        </div>
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes…"
          style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 5, color: "#94a3b8", padding: "5px 10px", fontSize: 11, width: 140, outline: "none", fontFamily: "inherit" }} />
        <button onClick={() => { setShowAddNode(true); setShowAddEdge(false); setEditingNode(null); }} style={btnStyle("#0d2259", "#3b82f6")}>+ Node</button>
        <button onClick={() => { setShowAddEdge(true); setShowAddNode(false); setEditingNode(null); setNewEdge({ source: selected || "", target: "", type: "is-a" }); }} style={btnStyle("#0d2e1a", "#34d399")}>+ Edge</button>
        <button onClick={exportJSON} style={btnStyle("#1a1333", "#a78bfa")} title="Download as JSON">↓ Export</button>
        <button onClick={() => fileInputRef.current?.click()} style={btnStyle("#2a1f00", "#fbbf24")} title="Load from JSON">↑ Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={importJSON} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SVG Graph */}
        <svg ref={svgRef}
          style={{ flex: 1, cursor: isPanning ? "grabbing" : dragging ? "grabbing" : "grab" }}
          onMouseDown={handleSvgMouseDown} onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp} onMouseLeave={handleSvgMouseUp}>
          <defs>
            {Object.entries(EDGE_TYPES).map(([key, et]) => (
              <marker key={key} id={`arrow-${key}`} viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={et.color} opacity="0.7" />
              </marker>
            ))}
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="glowStrong"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0a1628" /><stop offset="100%" stopColor="#020817" /></radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)" />
          {Array.from({ length: 90 }, (_, i) => (
            <circle key={i} cx={`${(i * 137.5) % 100}%`} cy={`${(i * 97.3) % 100}%`}
              r={i % 7 === 0 ? 1.3 : 0.5} fill="white" opacity={0.04 + (i % 5) * 0.025} />
          ))}

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map(e => {
              const src = nodes.find(n => n.id === e.source);
              const tgt = nodes.find(n => n.id === e.target);
              if (!src || !tgt) return null;
              const et = EDGE_TYPES[e.type] || EDGE_TYPES["is-a"];
              const hi = selected && (e.source === selected || e.target === selected);
              return (
                <g key={e.id}>
                  <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={et.color} strokeWidth={hi ? 2 : 1}
                    strokeOpacity={hi ? 0.9 : 0.22} strokeDasharray={et.dash}
                    markerEnd={`url(#arrow-${e.type})`} filter={hi ? "url(#glow)" : "none"} />
                  {hi && (
                    <text x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 - 7}
                      textAnchor="middle" fontSize="9" fill={et.color} opacity="0.8" fontFamily="Space Mono,monospace">
                      {et.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const nt = NODE_TYPES[n.type] || NODE_TYPES.Concept;
              const isSel = selected === n.id;
              const isHov = hoveredNode === n.id;
              const match = search && n.label.toLowerCase().includes(search.toLowerCase());
              const dimmed = search && !match;
              const r = isSel ? 22 : isHov ? 19 : 16;
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}
                  onMouseDown={e => handleNodeMouseDown(e, n.id)}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }} opacity={dimmed ? 0.12 : 1}>
                  {(isSel || isHov) && <circle r={r + 11} fill="none" stroke={nt.glow} strokeWidth="1" opacity="0.25" filter="url(#glow)" />}
                  {isSel && <circle r={r + 20} fill="none" stroke={nt.glow} strokeWidth="0.5" opacity="0.15" />}
                  <circle r={r} fill={`${nt.color}15`} stroke={nt.color} strokeWidth={isSel ? 2.5 : 1.5}
                    filter={isSel ? "url(#glowStrong)" : isHov ? "url(#glow)" : "none"} />
                  <circle r={4} fill={nt.color} opacity={0.9} filter="url(#glow)" />
                  <text y={r + 14} textAnchor="middle" fontSize="11"
                    fill={isSel ? nt.color : "#7a8fa8"} fontWeight={isSel ? "700" : "400"}
                    fontFamily="Space Mono,monospace" style={{ pointerEvents: "none", userSelect: "none" }}>
                    {n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label}
                  </text>
                  <text y={-r - 6} textAnchor="middle" fontSize="8" fill={nt.color} opacity="0.55"
                    fontFamily="Space Mono,monospace" style={{ pointerEvents: "none", userSelect: "none" }}>
                    {n.type.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Right Panel */}
        <div style={{ width: 282, background: "#060e1c", borderLeft: "1px solid #0f1e33", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>

          {/* Legend */}
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #0f1e33" }}>
            <div style={sectionLabel}>Node Types</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
              {Object.entries(NODE_TYPES).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: v.color, boxShadow: `0 0 5px ${v.glow}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#334d6e" }}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 14px", borderBottom: "1px solid #0f1e33" }}>
            <div style={sectionLabel}>Edge Types</div>
            {Object.entries(EDGE_TYPES).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 18, height: 2, background: v.color, opacity: 0.65, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#334d6e" }}>{v.label}</span>
              </div>
            ))}
          </div>

          {/* Edit panel */}
          {editingNode && (
            <div style={{ padding: 14, borderBottom: "1px solid #0f1e33", background: "#07101f" }}>
              <div style={{ ...sectionLabel, color: "#3b82f6", marginBottom: 12 }}>✎ Edit Node</div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Label</label>
                <input value={editingNode.label} onChange={e => setEditingNode(p => ({ ...p, label: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && saveEdit()} style={inputStyle} autoFocus />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Type</label>
                <select value={editingNode.type} onChange={e => setEditingNode(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                  {Object.keys(NODE_TYPES).map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Description</label>
                <textarea value={editingNode.desc || ""} onChange={e => setEditingNode(p => ({ ...p, desc: e.target.value }))}
                  style={{ ...inputStyle, height: 64, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button onClick={saveEdit} style={{ ...btnStyle("#0d2259", "#3b82f6"), flex: 1, justifyContent: "center" }}>Save</button>
                <button onClick={() => setEditingNode(null)} style={{ ...btnStyle("#111827", "#374151"), flex: 1, justifyContent: "center" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Selected node detail */}
          {selectedNode && !editingNode && (
            <div style={{ padding: 14, flex: 1 }}>
              <div style={sectionLabel}>Selected</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: NODE_TYPES[selectedNode.type]?.color, boxShadow: `0 0 7px ${NODE_TYPES[selectedNode.type]?.glow}`, flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#c8d8ea", lineHeight: 1.35 }}>{selectedNode.label}</span>
              </div>
              <div style={{ fontSize: 9, color: NODE_TYPES[selectedNode.type]?.color, marginBottom: 10, letterSpacing: "0.12em" }}>{selectedNode.type.toUpperCase()}</div>
              {selectedNode.desc && <p style={{ fontSize: 11, color: "#2d4a6a", lineHeight: 1.65, marginBottom: 14 }}>{selectedNode.desc}</p>}

              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <button onClick={() => setEditingNode({ ...selectedNode })} style={{ ...btnStyle("#0a1e40", "#60a5fa"), flex: 1, justifyContent: "center", fontSize: 10 }}>✎ Edit</button>
                <button onClick={() => deleteNode(selected)} style={{ ...btnStyle("#1a0808", "#ef4444"), flex: 1, justifyContent: "center", fontSize: 10 }}>✕ Delete</button>
              </div>

              <div style={{ ...sectionLabel, marginBottom: 8 }}>Connections ({connectedEdges.length})</div>
              {connectedEdges.length === 0 && <p style={{ fontSize: 11, color: "#1e3a5f" }}>No connections yet.</p>}
              {connectedEdges.map(e => {
                const otherId = e.source === selected ? e.target : e.source;
                const other = nodes.find(n => n.id === otherId);
                const et = EDGE_TYPES[e.type] || EDGE_TYPES["is-a"];
                const dir = e.source === selected ? "→" : "←";
                if (!other) return null;
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, padding: "5px 8px", background: "#07101f", borderRadius: 4, border: `1px solid ${et.color}20` }}>
                    <span style={{ fontSize: 9, color: et.color, flexShrink: 0 }}>{dir}</span>
                    <span style={{ fontSize: 9, color: et.color, opacity: 0.6, flexShrink: 0 }}>{et.label.split("/")[0].trim()}</span>
                    <span style={{ fontSize: 10, color: "#4a6a8a", flex: 1, cursor: "pointer" }} onClick={() => setSelected(otherId)}>{other.label}</span>
                    <button onClick={() => deleteEdge(e.id)} title="Remove"
                      style={{ background: "none", border: "none", color: "#1e3a5f", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          {!selectedNode && !editingNode && (
            <div style={{ padding: 14 }}>
              <div style={sectionLabel}>How to use</div>
              <div style={{ fontSize: 10, color: "#1a3050", lineHeight: 2 }}>
                Click node → inspect<br />
                Click Edit → modify label, type, desc<br />
                × on connection → remove it<br />
                Drag node → reposition<br />
                Scroll → zoom · Drag bg → pan<br />
                ↓ Export → save JSON file<br />
                ↑ Import → load JSON file<br />
                Changes auto-save to browser
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddNode && (
        <Modal title="Add Node" onClose={() => setShowAddNode(false)}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Label</label>
            <input value={newNode.label} onChange={e => setNewNode(p => ({ ...p, label: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addNode()} style={inputStyle} placeholder="e.g. Quantum Entanglement" autoFocus />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Type</label>
            <select value={newNode.type} onChange={e => setNewNode(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
              {Object.keys(NODE_TYPES).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Description (optional)</label>
            <textarea value={newNode.desc} onChange={e => setNewNode(p => ({ ...p, desc: e.target.value }))}
              style={{ ...inputStyle, height: 70, resize: "vertical" }} placeholder="Brief description…" />
          </div>
          <button onClick={addNode} style={{ ...btnStyle("#0d2259", "#3b82f6"), marginTop: 4 }}>Add Node</button>
        </Modal>
      )}

      {/* Add Edge Modal */}
      {showAddEdge && (
        <Modal title="Add Connection" onClose={() => setShowAddEdge(false)}>
          <div style={fieldGroup}>
            <label style={labelStyle}>From</label>
            <select value={newEdge.source} onChange={e => setNewEdge(p => ({ ...p, source: e.target.value }))} style={inputStyle}>
              <option value="">Select source…</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Relationship</label>
            <select value={newEdge.type} onChange={e => setNewEdge(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
              {Object.entries(EDGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>To</label>
            <select value={newEdge.target} onChange={e => setNewEdge(p => ({ ...p, target: e.target.value }))} style={inputStyle}>
              <option value="">Select target…</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <button onClick={addEdge} style={{ ...btnStyle("#0d2259", "#3b82f6"), marginTop: 4 }}>Add Connection</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,8,23,0.88)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div style={{ background: "#07101f", border: "1px solid #1e293b", borderRadius: 10, padding: 22, width: 350, display: "flex", flexDirection: "column", gap: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.14em" }}>{title.toUpperCase()}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const sectionLabel = { fontSize: 9, color: "#1e3a5f", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 };
const fieldGroup = { display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 };
const labelStyle = { fontSize: 9, color: "#1e3a5f", letterSpacing: "0.12em", textTransform: "uppercase" };
const inputStyle = { background: "#030c18", border: "1px solid #0f1e33", borderRadius: 5, color: "#94a3b8", padding: "7px 10px", fontSize: 11, fontFamily: "Space Mono,'Courier New',monospace", outline: "none", width: "100%", boxSizing: "border-box" };
const btnStyle = (bg, border) => ({ background: bg, border: `1px solid ${border}60`, borderRadius: 5, color: border, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "Space Mono,'Courier New',monospace", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 4 });
