import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sphere, useGLTF, Sky, useHelper } from "@react-three/drei"
import * as THREE from "three"
import { DirectionalLightHelper, CameraHelper } from "three"


import ControllableTree from './ControllableTree';

export default function SceneController({ globalPoints, maxPoints, treeGrowSteps }) {
  const sunPosition = [0, 30, 10];
  const lightRef = useRef()
  // useHelper(lightRef, DirectionalLightHelper, 5)
  // useHelper(lightRef.current?.shadow?.camera, CameraHelper)

  // console.log("Controller globalPoints:", globalPoints);
  const ground = useGLTF("/models/ground2.glb")
  useEffect(() => {
    // console.log("Ground:", ground);
  }, [ground]);

  const treeAnchors = useMemo(() => {
    const arr = []
    ground.scene.traverse(o => {
      if (o.name.startsWith("treeAnchor")) arr.push(o)
    })
    // console.log("treeAnchors:", arr);
    return arr
  }, [ground])

  const groundMesh = useMemo(() => {
    return ground.scene.children.find(o => o.isMesh)
  }, [ground])

  const maxTrees = useMemo(() => {
    // console.log("maxTrees = treeAnchors.length:", treeAnchors.length);
    return treeAnchors.length
  }, [treeAnchors]);

  const pointSpan = useMemo(
    () => Math.max(1e-9, maxPoints - treeGrowSteps),
    [maxPoints, treeGrowSteps]
  );
  const newTreeSteps = useMemo(() => pointSpan / Math.max(maxTrees, 1), [pointSpan, maxTrees]);
  // Ohne Wald-Punkte war treeCount=0 → keine Bäume, nur Boden. Mindestens ein Baum, sobald Anker existieren.
  const treeCount = useMemo(() => {
    if (maxTrees === 0) return 0;
    const raw = Math.floor(
      (Math.min(globalPoints, pointSpan) / pointSpan) * maxTrees
    );
    return Math.min(maxTrees, Math.max(1, raw));
  }, [globalPoints, pointSpan, maxTrees]);
  
  // Liste der Bäume mit treeAnchorIndex und growth
  const trees = useMemo(() => {         // growth ist sprunghaft (je nach rundung). TODO: growth so anpassen, dass es linear mit den Punkten wächst, z.B. durch Berechnung des Wachstums basierend auf den Punkten und den Schritten zum Wachstum eines Baumes.
    // Berechne für jeden Baum den growth Parameter
    return treeAnchors.slice(0, treeCount).map((anchor, index) => {
      const growth = Math.max(
        0,
        Math.min((globalPoints - (index + 1) * newTreeSteps) / treeGrowSteps, 1)
      );
      return {
        treeAnchorIndex: index,
        growth,
        anchor
      };
    });
  }, [treeAnchors, treeCount, maxTrees, globalPoints, newTreeSteps, treeGrowSteps]);
  
  // // Debug-Ausgabe
  // useEffect(() => {
  //   console.log("trees array:", trees);
  // }, [trees]);
  // useEffect(() => {
  //   console.log("newTreeSteps:", newTreeSteps);
  //   // console.log("newTreePercentage:", newTreePercentage);
  // }, [newTreeSteps]);
  // console.log("globalPoints:", globalPoints, "treeCount:", treeCount);
  //  /* list of treeAnchors from gltf
  //       function growth(TreeX){
  //         const growth = Math.min(points - TreeX * newTreeSteps, treeGrowSteps); 
  //     } */

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.53}
        azimuth={0.25}
        turbidity={5}
        rayleigh={1.6}
      />
      <directionalLight
        ref={lightRef}
        position={sunPosition}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={50}
        // shadow-bias={0.00001}
      />
      <ambientLight intensity={0.78} />
      <hemisphereLight args={['#e8f6ff', '#d7ead1', 0.48]} />

      {/* 5 schwache Punktlichter im Kreis um den Ursprung */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 2 * Math.PI;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <directionalLight
            key={i}
            position={[x, 2, z]}
            intensity={0.2}
            castShadow={false}
          />
        );
      })}

      {/* Gelbe Kugel an der Lichtquelle */}
      <mesh position={sunPosition}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
      </mesh>
      <mesh geometry={groundMesh.geometry} material={groundMesh.material} position={[0, 0, 0]} /* rotation={[Math.PI/2,0,0]} */ castShadow receiveShadow />
      {/* <primitive object={ground.scene} position={[0, 0, 0]}  castShadow receiveShadow /> */}

      {trees.slice(0, treeCount).map((tree, i) => (
        <ControllableTree
            key={`tree-${i}-${tree.anchor.uuid ?? tree.anchor.id ?? i}`}
            position={tree.anchor.position} 
            rotation={tree.anchor.rotation}
            trunkQuaternion={tree.anchor.quaternion}
            growth={tree.growth} 
            maxTreeGrowSteps={treeGrowSteps}
            maxTrunkGrowth={1} 
            maxTwigGrowth={1} 
            num={i} 
          />
      ))}
    </>
  );
};


