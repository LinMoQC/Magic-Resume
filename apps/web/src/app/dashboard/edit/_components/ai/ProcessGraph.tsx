import React, { useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LogEntry } from '@/store/useResumeOptimizerStore';
import { NeuralNode } from './NeuralNode';
import { NeuralEdge } from './NeuralEdge';
import { NodeInspector } from './NodeInspector';

interface ProcessGraphProps {
  logs: LogEntry[];
  isLoading: boolean;
}

const nodeTypes = { neural: NeuralNode } as unknown as NodeTypes;
const edgeTypes = { neural: NeuralEdge } as unknown as EdgeTypes;

export const ProcessGraph: React.FC<ProcessGraphProps> = ({ logs }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const { nodes, edges } = useMemo(() => {
    // --- 核心几何常量 ---
    const X_START = 0;       // preparer 的起点
    const X_STEP = 420;      // 水平间距
    const Y_CENTER = 450;    // 中轴高度
    const Y_GAP = 350;       // 轨道上下间距

    /**
     * getPosition - 强制三轨放射映射
     * 确保 preparer 是 1，发出三条独立的平行线
     */
    const getPosition = (id: string) => {
      const lowerId = id.toLowerCase();

      // 0. 唯一源头
      if (lowerId.includes('preparer')) return { x: X_START, y: Y_CENTER };
      if (lowerId.includes('rag_knowledge')) return { x: X_STEP, y: -50 };

      // --- 轨 A: 简历研究 (Top) ---
      if (lowerId.includes('resume_analyzer')) return { x: X_STEP, y: Y_CENTER - Y_GAP };
      if (lowerId.includes('resume_web_search')) return { x: X_STEP * 2, y: Y_CENTER - Y_GAP };

      // --- 轨 B: JD 研究 (Middle) ---
      if (lowerId.includes('jd_analyzer')) return { x: X_STEP, y: Y_CENTER };
      if (lowerId.includes('jd_web_search')) return { x: X_STEP * 2, y: Y_CENTER};

      // --- 轨 C: 公司研究 (Bottom) ---
      if (lowerId.includes('company_analysis') || lowerId.includes('corp_intel')) return { x: X_STEP, y: Y_CENTER + Y_GAP };
      if (lowerId.includes('company_interview_search') || lowerId.includes('interview_spy')) return { x: X_STEP * 2, y: Y_CENTER + Y_GAP };

      // --- 辅助轨: 深层研究 ---
      if (lowerId.includes('prepare_research')) return { x: X_STEP, y: Y_CENTER + Y_GAP * 2 };
      if (lowerId.includes('query_writer'))     return { x: X_STEP * 1.8, y: Y_CENTER + Y_GAP * 2 };
      if (lowerId.includes('web_searcher'))     return { x: X_STEP * 2.6, y: Y_CENTER + Y_GAP * 2 };
      if (lowerId.includes('reflection'))       return { x: X_STEP * 3.4, y: Y_CENTER + Y_GAP * 2 };

      // --- 收束区 ---
      if (lowerId.includes('combiner') || lowerId.includes('research_combiner')) return { x: X_STEP * 3.2, y: Y_CENTER };
      if (lowerId.includes('strategic_analyzer')) return { x: X_STEP * 4.4, y: Y_CENTER };
      
      // Stage 3: Rewriting
      const REWRITE_X_BASE = X_STEP * 5.6; 
      
      // 1. 进入重写准备
      if (lowerId.includes('prepare_rewriter') || lowerId.includes('route_next_rewrite')) {
        return { x: REWRITE_X_BASE - X_STEP * 0.5, y: Y_CENTER };
      }
      
      // 2. Orchestrator
      if (lowerId.includes('rewrite_sections_parent')) {
        return { x: REWRITE_X_BASE, y: Y_CENTER }; 
      }

      if (lowerId === 'rewrite_section') {
        return { x: REWRITE_X_BASE + X_STEP * 1.5, y: Y_CENTER }; 
      }
      
      // 4. 合并阶段 (Assembler)
      if (lowerId.includes('combine_sections')) {
        return { x: REWRITE_X_BASE + X_STEP * 3.0, y: Y_CENTER };
      }
      
      // 5. 对抗性评估 (Critique) - 位于组装之后，水平位置向右移动
      if (lowerId.includes('critique')) {
        return { x: REWRITE_X_BASE + X_STEP * 1.5, y: Y_CENTER + 350 }; 
      }
      
      // 6. 最终结果
      if (lowerId.includes('final')) {
        return { x: REWRITE_X_BASE + X_STEP * 5.5, y: Y_CENTER };
      }

      // Default: Place in a "Processing Hub" near the center to avoid skewing fitView
      return { x: X_STEP * 1.5, y: Y_CENTER + 150 };
    };

    const initialNodes: Node[] = logs
      .filter(log => {
        const id = log.id.toLowerCase();
        // 隐藏内部冗余节点
        if (id.includes('prepare_rewriter') || id.includes('route_next_rewrite')) return false;
        return true;
      })
      .map((log) => {
        const position = getPosition(log.id);
        if (!position) return null;
        return {
          id: log.id,
          type: 'neural',
          position,
          width: 280,   // Explicit width for fitView calculation
          height: 190,  // Explicit height for fitView calculation
          data: { title: log.title, status: log.status, id: log.id, isInteractive: true },
          selected: log.id === selectedNodeId,
        } as Node;
      })
      .filter((node): node is Node => node !== null);

    const initialEdges: Edge[] = [];
    // 辅助连线函数：智能匹配（处理精确匹配与重名字段）
    const connect = (srcKey: string, tgtKey: string) => {
      const findNode = (key: string) => {
        const lowerKey = key.toLowerCase();
        
        // 1. 特殊：如果 key 是 'rewrite_section'，优先寻找 EXACT MATCH 以防混淆
        if (lowerKey === 'rewrite_section') {
          const exact = logs.find(l => l.id.toLowerCase() === 'rewrite_section');
          if (exact) return exact;
        }

        const exact = logs.find(l => l.id.toLowerCase() === lowerKey);
        if (exact) return exact;
        
        return logs.find(l => {
          const skipParent = (lowerKey === 'rewrite_section' && l.id.toLowerCase().includes('parent'));
          return l.id.toLowerCase().includes(lowerKey) && !skipParent;
        });
      };

      const srcNode = findNode(srcKey) || (srcKey === 'preparer' ? {id: 'preparer'} : null);
      const tgtNode = findNode(tgtKey);
      
      // CRITICAL FIX: Only connect if both nodes are actually in the RENDERED list
      const srcExists = initialNodes.some(n => n.id === srcNode?.id);
      const tgtExists = initialNodes.some(n => n.id === tgtNode?.id);

      if (srcNode && tgtNode && srcExists && tgtExists && srcNode.id !== tgtNode.id) {
        initialEdges.push({
          id: `e-${srcNode.id}-${tgtNode.id}`,
          source: srcNode.id,
          target: tgtNode.id,
          type: 'neural',
          animated: true,
          data: { animated: true },
        });
      }
    };

    // --- 核心逻辑：从起点发射三支箭 ---
    connect('preparer', 'resume_analyzer');           // 射向简历轨
    connect('preparer', 'jd_analyzer');               // 射向 JD 轨
    connect('preparer', 'company_analysis');          // 公司画像并行轨
    connect('preparer', 'prepare_research');          // (可选)射向深层轨

    // --- 轨道内部串联 ---
    connect('resume_analyzer', 'resume_web_search');
    connect('jd_analyzer', 'jd_web_search');
    connect('company_analysis', 'company_interview_search');
    connect('prepare_research', 'query_writer');
    connect('query_writer', 'web_searcher');
    connect('web_searcher', 'reflection');

    // --- 汇聚到收束点 ---
    const finalCombiner = logs.find(l => l.id.toLowerCase().includes('combiner') || l.id.toLowerCase().includes('research_combiner'))?.id;
    if (finalCombiner) {
      ['resume_web_search', 'jd_web_search', 'company_interview_search', 'reflection'].forEach(key => {
        const src = logs.find(l => l.id.toLowerCase().includes(key))?.id;
        if (src) {
           initialEdges.push({ 
             id: `e-join-${src}`, 
             source: src, 
             target: finalCombiner, 
             type: 'neural', 
             animated: true,
             data: { animated: true }
           });
        }
      });
    }

    // --- 主执行线串联 ---
    // Strict linear sequence to ensure no gaps
    connect('research_combiner', 'strategic_analyzer'); // Explicitly connect the strategy bridge
    
    const MAIN_SEQ = [
      'strategic_analyzer',
      'rewrite_sections_parent', 
      'combine_sections', 
      'adversarial_critique',
      'final_answer'
    ];
    for (let i = 0; i < MAIN_SEQ.length - 1; i++) {
        connect(MAIN_SEQ[i], MAIN_SEQ[i+1]);
    }

    // --- Special Connections for Visual Organization ---
    // Returning edge from critique to the orchestrator to show re-entry into the optimization zone
    connect('adversarial_critique', 'rewrite_sections_parent');

    return { nodes: initialNodes, edges: initialEdges };
  }, [logs, selectedNodeId]);

  // 自动缩放效果：当节点数量增加时，平滑调整视图
  // 我们使用 setTimeout 确保节点已经渲染并计算出尺寸
  // 自动缩放策略：
  // 1. 初始展开（研究阶段）：Fit View 以展示整体结构
  // 2. 后期展开（重写阶段）：平移跟随最新节点（向右延伸），且不改变缩放比例（避免忽大忽小）
  React.useEffect(() => {
    if (rfInstance && nodes.length > 0) {
      const timer = setTimeout(() => {
        // 阈值：9 个节点大致覆盖了前期的并行研究轨道
        if (nodes.length <= 8) {
          rfInstance.fitView({ 
            padding: 0.15, 
            duration: 1000,
            minZoom: 0.5,
            maxZoom: 1.2
          });
        } else {
          if(nodes.length === 13){
            const targetNode = nodes[nodes.length - 1];
            rfInstance.setCenter(
              targetNode.position.x - 140, // 偏移量，用于居中显示 280px 宽的节点
              targetNode.position.y, 
              { 
                zoom: 0.5,
                duration: 1000
              }
            );
            return
          }
          // 平移到最新节点（假定为列表中的最后一个）
          const targetNode = nodes[nodes.length - 1];
          if (targetNode) {
            const currentZoom = rfInstance.getZoom();

            rfInstance.setCenter(
              targetNode.position.x - 140, // 偏移量，用于居中显示 280px 宽的节点
              targetNode.position.y +100, 
              { 
                zoom: currentZoom, // 保持当前缩放比例
                duration: 1000
              }
            );

            rfInstance.fitView({ 
              padding: 0.45, 
              duration: 1000,
              minZoom: 0.5,
              maxZoom: 1.2
          });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [rfInstance, nodes]);

  return (
    <div className="w-full h-full relative bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.5}
        maxZoom={1.2}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        translateExtent={[[-1000, -1000], [8000, 3000]]} // Expanded for V7 complexity
        onInit={setRfInstance}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        zoomOnScroll={false}
        panOnDrag={false}
        panOnScroll={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1f26" gap={60} size={1} className="opacity-40" />

      </ReactFlow>
      
      {/* Sidebar Inspector Overlay */}
      <NodeInspector 
        nodeId={selectedNodeId}
        nodeData={logs.find(l => l.id === selectedNodeId) ?? null}
        isOpen={!!selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
};