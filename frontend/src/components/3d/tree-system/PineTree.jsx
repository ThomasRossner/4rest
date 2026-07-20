import React, { useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { Sphere, useGLTF } from "@react-three/drei"
import * as THREE from "three"

// 
export default function PineTree({
  position,
  rotation,
  trunkQuaternion,
  growth: trunkGrowth,
  sizeFactor = 1,
  trunkHeightFactor = 1,
  branchCountFactor = 1,
  branchLengthFactor = 1,
  maxTreeGrowSteps=10,
  maxTrunkGrowth=0.9,
  maxTwigGrowth=0.9,
  num
}) {
  const trunkAnchorScale = useMemo(
    () => new THREE.Vector3(trunkGrowth, trunkGrowth * trunkHeightFactor, trunkGrowth),
    [trunkGrowth, trunkHeightFactor]
  );


    // console.log("Controller globalPoints:", globalPoints);
  // console.log("ControllableTree props - num:", num, "growth*steps:", Math.floor(trunkGrowth * maxTreeGrowSteps));

  const tree = useGLTF("/models/newPine_s.glb")

  useEffect(() => {
    console.log(num, "Tree:", tree);
  }, [tree]);

  const trunkMeshes = useMemo(() => {
          const trunks = [];
          tree.scene.traverse((child) => {
              if (child.isObject3D && child.name.toLowerCase().includes("trunk")) {
                  trunks.push(child.clone());
              }
          });
          return trunks;
  }, [tree]);

  //twig stuff
  const twigAnchors = useMemo(() => {
		const anchors = [];
		tree.scene.traverse((child) => {
			if (child.isObject3D && child.name.startsWith("twigAnchor")) {
				anchors.push(child);
			}
		});
		return anchors;
	}, [tree]);

	const twigMeshes = useMemo(() => {
		const twigs = [];
		tree.scene.traverse((child) => {
			if (child.isMesh && child.name.toLowerCase().includes("twig")) {
				twigs.push(child.clone());
			}
		});
		return twigs;
	}, [tree]);

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

  const twigRefs = useRef([])

  useLayoutEffect(() => {

    if (!twigRefs.current || twigRefs.current.length === 0) return

    const hiddenMatrix = new THREE.Matrix4().makeScale(0,0,0)
    const twigMatrix = new THREE.Matrix4()
    const twigAnchorMatrix = new THREE.Matrix4()

    // hide all instances initially for each mesh
    for (let m = 0; m < twigRefs.current.length; m++) {
      const meshRef = twigRefs.current[m]
      if (!meshRef) continue
      for (let i = 0; i < maxTwigs; i++) {
        meshRef.setMatrixAt(i, hiddenMatrix)
      }
    }

    // Set instance matrices for the visible twigs
    twigAnchors.slice(0, Math.min(twigCount, maxTwigs)).forEach((twigAnchor, twigIndex) => {
      const twigGrowth = Math.min((trunkGrowth*maxTreeGrowSteps - (twigIndex+1) * newTwigSteps) / maxTwigGrowSteps, 1);
      const twigLengthGrowth = Math.max(0, twigGrowth) * branchLengthFactor * trunkGrowth;
      const twigScaleMatrix = new THREE.Matrix4()
      twigScaleMatrix.makeScale(twigLengthGrowth, twigLengthGrowth, twigLengthGrowth)

      twigAnchorMatrix.compose(
        twigAnchor.position.clone().multiply(trunkAnchorScale),
        twigAnchor.quaternion,
        new THREE.Vector3(1,1,1)
      )
      twigMatrix.copy(twigAnchorMatrix).multiply(twigScaleMatrix)

      // apply same instance matrix to all sub-mesh instancedMeshes
      for (let m = 0; m < twigRefs.current.length; m++) {
        const meshRef = twigRefs.current[m]
        if (!meshRef) continue
        meshRef.setMatrixAt(twigIndex, twigMatrix)
      }
    })

    // mark all instance matrices as needing update
    for (let m = 0; m < twigRefs.current.length; m++) {
      const meshRef = twigRefs.current[m]
      if (!meshRef) continue
      meshRef.instanceMatrix.needsUpdate = true
    }
  }, [trunkGrowth, trunkAnchorScale, twigRefs, twigAnchors, twigCount, maxTwigs, newTwigSteps, maxTwigGrowSteps, trunkQuaternion, branchLengthFactor])

  return (
    <>
      <group position={position} rotation={rotation} scale={[sizeFactor, sizeFactor, sizeFactor]} castShadow receiveShadow>
        {trunkMeshes.map((trunkMesh, index) => (
          <mesh
            key={`${trunkMesh.uuid}-${index}`}
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
				))}
        {twigMeshes.map((twigMesh, mIndex) => (
          <instancedMesh
            key={`twig-${mIndex}`}
            ref={el => (twigRefs.current[mIndex] = el)}
            args={[twigMesh.geometry, twigMesh.material, maxTwigs]}
            castShadow
            receiveShadow
          />
        ))}


        
      </group>
    </>
  );
};


