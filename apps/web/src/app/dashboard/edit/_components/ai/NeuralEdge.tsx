import React, { memo } from 'react';
import { BaseEdge, Edge, EdgeProps, getBezierPath } from '@xyflow/react';
import { motion } from 'framer-motion';

type AnimatedEdge = Edge<{ animated?: boolean }>;

export const NeuralEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<AnimatedEdge>) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isFlowing = !!data?.animated;

  return (
    <>
      {/* Main Base Path */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeDasharray: isFlowing ? 'none' : '4 4',
          strokeWidth: isFlowing ? 1.5 : 1,
          opacity: isFlowing ? 0.45 : 0.15,
          stroke: isFlowing ? '#64748b' : '#334155',
        }} 
      />
      
      {isFlowing && (
        <>
          {[0].map((delay, i) => (
            <motion.circle
              key={`${id}-p-${i}`}
              r="2"
              fill="#e2e8f0"
              initial={{ offsetDistance: "0%", opacity: 0 }}
              animate={{ 
                offsetDistance: "100%", 
                opacity: [0, 0.7, 0],
              }}
              transition={{ 
                duration: 2.4, 
                repeat: Infinity, 
                ease: "linear", 
                delay 
              }}
              style={{ 
                offsetPath: `path('${edgePath}')`,
              }}
            />
          ))}
        </>
      )}
    </>
  );
});

NeuralEdge.displayName = 'NeuralEdge';
