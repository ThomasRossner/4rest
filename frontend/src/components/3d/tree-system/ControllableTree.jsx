import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

// 
export default function ControllableTree({
  position,
  rotation,
  growth: trunkGrowth,
  sizeFactor = 1,
  trunkHeightFactor = 1,
  branchCountFactor = 1,
  branchLengthFactor = 1,
  maxTreeGrowSteps=10,
  maxTrunkGrowth=0.9,
  maxTwigGrowth=0.9,
  leafTint,
}) {
  const trunkAnchorScale = useMemo(
    () => new THREE.Vector3(trunkGrowth, trunkGrowth * trunkHeightFactor, trunkGrowth),
    [trunkGrowth, trunkHeightFactor]
  );


    // console.log("Controller globalPoints:", globalPoints);
  // console.log("ControllableTree props - num:", num, "growth*steps:", Math.floor(trunkGrowth * maxTreeGrowSteps));

  const trunk = useGLTF("/models/beechTrunk.glb")
  const twig = useGLTF("/models/beechTwig.glb")
  const leaf = useGLTF("/models/beechLeaf.glb")

  const trunkMesh = useMemo(() => {
    return trunk.scene.children.find(o => o.isMesh)
  }, [trunk])

  //twig stuff
  const twigAnchors = useMemo(() => {
    const arr = []
    trunk.scene.traverse(o => {
      if (o.name.startsWith("twigAnchor")) arr.push(o)
    })
  //   console.log(num, "trunk:", trunk);
  //   console.log(num, "twigAnchors:", arr);
    return arr
  }, [trunk])

  const twigMesh = useMemo(() => {
    // console.log(num, "twig:", twig);
    return twig.scene.children.find(o => o.isMesh)
  }, [twig])

  const maxTwigs = useMemo(() => {
    // console.log(num, "maxTwigs = twigAnchors.length:", twigAnchors.length);
    return twigAnchors.length
  }, [twigAnchors]);
  
  const maxTwigGrowSteps = useMemo(() => {
    // console.log(num, "maxTwigGrowSteps:", maxTreeGrowSteps/maxTwigs);
    return /* maxTreeGrowSteps / maxTwigs */ 15
  }, [maxTreeGrowSteps, maxTwigs]);

  const newTwigSteps = useMemo(() => {
    let steps = (maxTreeGrowSteps - maxTwigGrowSteps) / maxTwigs;
    // console.log(num, "newTwigSteps:", steps);
    return steps;
  }, [maxTreeGrowSteps, maxTwigGrowSteps, maxTwigs]);

  const twigCount = useMemo(() => {
    const baseCount = Math.floor(
      Math.min(trunkGrowth * maxTreeGrowSteps, (maxTreeGrowSteps - maxTwigGrowSteps)) /
      (maxTreeGrowSteps - maxTwigGrowSteps) * maxTwigs
    );
    let count = Math.floor(baseCount * branchCountFactor);
    count = Math.min(maxTwigs, count);
    // console.log(num, "twigCount:", count);
    return count;
  }, [trunkGrowth, maxTwigGrowSteps, maxTreeGrowSteps, maxTwigs, branchCountFactor]);

// leaf stuff
  const leafAnchors = useMemo(() => {
    const arr = []
    twig.scene.traverse(o => {
      if (o.name.startsWith("leafAnchor")) arr.push(o)
    })
    return arr
  }, [twig])

  const leafMesh = useMemo(() => {
    return leaf.scene.children.find(o => o.isMesh)
  }, [leaf])

  const leafMaterial = useMemo(() => {
    if (!leafMesh?.material || !leafTint) return leafMesh?.material;
    const base = Array.isArray(leafMesh.material) ? leafMesh.material[0] : leafMesh.material;
    const tinted = base.clone();
    tinted.color.set(leafTint);
    return tinted;
  }, [leafMesh, leafTint]);

  const maxLeaves = useMemo(() => {
    return leafAnchors.length
  }, [leafAnchors]);

  const maxLeafGrowSteps = useMemo(() => {
    return maxTreeGrowSteps / maxLeaves
  }, [maxTwigGrowSteps, maxLeaves]);

  const newLeafSteps = useMemo(() => {
    let steps = (maxTwigGrowSteps - maxLeafGrowSteps) / maxLeaves;
    return steps;
  }, [maxTwigGrowSteps, maxLeafGrowSteps, maxLeaves]);

  const twigRef = useRef()
  const leafRef = useRef()

  useLayoutEffect(() => {
    
  }, [])

  useLayoutEffect(() => {

    if (!twigRef.current) return
    if (!leafRef.current) return

    // Zuerst alle Instanzen verstecken, damit nicht versehentlich alte Positionen angezeigt werden, wenn die Anzahl der Twigs oder Blätter abnimmt.
    const hiddenMatrix = new THREE.Matrix4().makeScale(0,0,0)
    for (let i = 0; i < maxTwigs; i++) {
      twigRef.current.setMatrixAt(i, hiddenMatrix)
      for (let j = 0; j < maxLeaves; j++) {
        leafRef.current.setMatrixAt(i*maxLeaves + j, hiddenMatrix)
      }
    }

    // for (let i = 0; i < maxLeaves * maxTwigs; i++) {
    //   leafRef.current.setMatrixAt(i, hiddenMatrix)
    // }
    const twigMatrix = new THREE.Matrix4()
    const leafMatrix = new THREE.Matrix4()

    const twigAnchorMatrix = new THREE.Matrix4()
    const leafAnchorMatrix = new THREE.Matrix4()

    // let allLeafIndex = maxTwigs * maxLeaves * num; // Startindex für die Blätter dieses Baumes, basierend auf der Anzahl der Twigs und Blätter pro Twig und der Baumnummer (num)
    let allLeafIndex = 0; 
    twigAnchors.slice(0, Math.min(twigCount, maxTwigs)).map((twigAnchor, twigIndex) => {
      const twigGrowth = Math.min((trunkGrowth*maxTreeGrowSteps - (twigIndex+1) * newTwigSteps) / maxTwigGrowSteps, 1);
      const twigLengthGrowth = Math.max(0, twigGrowth) * branchLengthFactor;
      const twigScaleMatrix = new THREE.Matrix4()
      twigScaleMatrix.makeScale(twigLengthGrowth, twigLengthGrowth, twigLengthGrowth)

      twigAnchorMatrix.compose(
        twigAnchor.position.clone().multiply(trunkAnchorScale),
        twigAnchor.quaternion,
        new THREE.Vector3(1,1,1)
      )
      twigMatrix.copy(twigAnchorMatrix).multiply(twigScaleMatrix)
      twigRef.current.setMatrixAt(twigIndex, twigMatrix)   
      twigRef.current.instanceMatrix.needsUpdate = true

      // Leaf
      const leafCount = Math.floor(Math.min(twigGrowth*maxTwigGrowSteps, (maxTwigGrowSteps - maxLeafGrowSteps)) / (maxTwigGrowSteps - maxLeafGrowSteps) * maxLeaves);

      leafAnchors.slice(0, Math.min(leafCount, maxLeaves)).map((leafAnchor, leafIndex) => {
        const leafGrowth = Math.min((twigGrowth*maxTwigGrowSteps - (leafIndex+1) * newLeafSteps) / maxLeafGrowSteps, 1);
        const leafScaleMatrix = new THREE.Matrix4()
        leafScaleMatrix.makeScale(leafGrowth, leafGrowth, leafGrowth)
        leafAnchorMatrix.compose(
          leafAnchor.position/* .clone().multiplyScalar(twigGrowth) */, // Position des Blattes basiert auf der Position des Twigs, skaliert mit twigGrowth, und der Position des Twigs, skaliert mit trunkGrowth, damit die Blätter auch wachsen, wenn der Stamm wächst.
          /* trunkQuaternion.clone().multiply(twigAnchor.quaternion).multiply */(leafAnchor.quaternion),
          new THREE.Vector3(1,1,1)
        )
        leafMatrix
          .copy(twigMatrix)/* .multiply(twigScaleMatrix) */
          .multiply(leafAnchorMatrix)
          .multiply(leafScaleMatrix)

        leafRef.current.setMatrixAt(allLeafIndex++, leafMatrix)
        // console.log(num, "Setting leaf matrix at index", allLeafIndex-1, "for leaf", leafIndex, "on twig", twigIndex, leafMatrix);
      })
      
      
    })
    leafRef.current.instanceMatrix.needsUpdate = true
  }, [trunkGrowth, trunkAnchorScale, twigRef, twigAnchors, twigCount, maxTwigs, newTwigSteps, maxTwigGrowSteps, leafRef, leafAnchors, maxLeaves, newLeafSteps, maxLeafGrowSteps, branchLengthFactor])

  return (
    <>
      {/* <mesh position={position} scale={growth} castShadow receiveShadow>
        <Sphere args={[1, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh> */}
      <group position={position} rotation={rotation} scale={[sizeFactor, sizeFactor, sizeFactor]} castShadow receiveShadow>
        <mesh
          geometry={trunkMesh.geometry}
          material={trunkMesh.material}
          scale={[
            Math.max(0.06, trunkGrowth),
            Math.max(0.06, trunkGrowth) * trunkHeightFactor,
            Math.max(0.06, trunkGrowth),
          ]}
          castShadow
          receiveShadow
        />
        
        <instancedMesh 
          ref={twigRef} 
          args={[
            twigMesh.geometry, 
            twigMesh.material, 
            maxTwigs]} 
          receiveShadow 
        />
        {/* {console.log("leafRef.current:", leafRef.current)} */}
        <instancedMesh
          ref={leafRef}
          args={[
            leafMesh.geometry,
            leafMaterial,
            maxLeaves * maxTwigs
          ]}
          receiveShadow
        />

        {/* {twigAnchors.slice(0, Math.min(twigCount, maxTwigs)).map((twigAnchor, twigIndex) => {
          <instancedMesh
          ref={leafRef}
          args={[
            leafMesh.geometry,
            leafMesh.material,
            maxLeaves
          ]}
          castShadow receiveShadow
        />
        })} */}

        {/* {twigs.map(twig => (
              <mesh 
                key={twig.twigAnchorIndex} 
                geometry={twigMesh.geometry} 
                material={twigMesh.material}
                position={twig.anchor.position.clone().multiplyScalar(trunkGrowth)} 
                rotation={twig.anchor.rotation} 
                scale={twig.growth} 
                castShadow 
                receiveShadow 
              />
        ))} */}
      </group>
    </>
  );
};


