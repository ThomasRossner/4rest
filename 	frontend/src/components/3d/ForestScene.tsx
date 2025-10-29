import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { Tree } from './Tree';

function ForestScene() {
  const { data: forest } = useQuery('forest', () => api.getForest());

  // Generate a grid of trees based on user progress
  // This is a simplified version - will be enhanced with actual data
  const trees = forest?.trees || [];
  
  // Placeholder grid for demo
  const gridSize = 10;
  const treePositions: Array<[number, number, number]> = [];

  for (let i = 0; i < Math.min(trees.length || 5, 50); i++) {
    const x = (Math.random() - 0.5) * gridSize;
    const z = (Math.random() - 0.5) * gridSize;
    treePositions.push([x, 0, z]);
  }

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Trees */}
      {treePositions.map((position, index) => (
        <Tree key={index} position={position} />
      ))}
    </>
  );
}

export default ForestScene;
