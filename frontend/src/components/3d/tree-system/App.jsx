import { useState } from "react"
import { OrbitControls } from "@react-three/drei"
import { Canvas } from '@react-three/fiber';
import { useControls } from "leva"

import FullTree from "./components/Oak"
import SceneController from "./components/SceneController"
import { SphereGeometry } from "three";

export default function App() {
  const [maxGlobalPoints, setMaxGlobalPoints] = useState(100);

  const { globalPoints } = useControls({
    globalPoints: {
      value: 0,
      min: 0,
      max: maxGlobalPoints,
    }
  });

  return (
    <div id="canvasContainer" style={{ background: 'blue', height: '80vh', width: '80vw' }}>
        <Canvas shadows camera={{ position: [0, 12, 22], fov: 50 }}>    
            <OrbitControls zoomSpeed={0.2} zoomToCursor/>
            {/* <ambientLight intensity={100} /> */}
            {/* <axesHelper args={[5]} /> */}
            <gridHelper args={[10, 10]} />
            
            <SceneController 
              globalPoints={globalPoints} 
              maxPoints={maxGlobalPoints} 
              treeGrowSteps={30} 
              // maxTrees={10} 
            />
            {/* <FullTree />
            <group position={[5, 2, 5]}>
              <FullTree />
            </group> */}

        </Canvas>
    </div>
  )
}