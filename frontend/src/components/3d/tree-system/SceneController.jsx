import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sphere, useGLTF, Sky, useHelper } from "@react-three/drei"
import { DirectionalLightHelper, CameraHelper, Color } from "three"
import { useThree } from '@react-three/fiber';


import ControllableTree from './ControllableTree';

export default function SceneController({ globalPoints, maxPoints, treeGrowSteps, plantedTrees, plantedAtList = [], dyad1Scale = 2, dyad2Scale = 2 }) {
  const DAILY_GROWTH_BONUS = 0.08;
  const BASE_TREE_SIZE_FACTOR = 1;
  const MIN_AGE_SIZE_FACTOR = 0.75;
  const MAX_AGE_SIZE_FACTOR = 1.25;
  const sunPosition = [0, 18, -35];
  const lightRef = useRef()
  const { scene } = useThree();
  // useHelper(lightRef, DirectionalLightHelper, 5)
  // useHelper(lightRef.current?.shadow?.camera, CameraHelper)

  // console.log("Controller globalPoints:", globalPoints);
  const ground = useGLTF("/models/ground2.glb")
  useEffect(() => {
    // console.log("Ground:", ground);
  }, [ground]);
  useEffect(() => {
    scene.background = new Color('#2f6fe4');
  }, [scene]);

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
  const normalizedPlantedTrees = Number(plantedTrees);
  const hasPlantedTreesOverride = Number.isFinite(normalizedPlantedTrees);
  // Wenn plantedTrees gesetzt ist, wird die sichtbare Baumanzahl exakt daran ausgerichtet.
  // Fallback bleibt die bisherige Punkteskalierung.
  const treeCount = useMemo(() => {
    if (maxTrees === 0) return 0;
    if (hasPlantedTreesOverride) {
      const requestedTrees = Math.floor(Math.max(0, normalizedPlantedTrees));
      return Math.min(maxTrees, requestedTrees);
    }
    const raw = Math.floor(
      (Math.min(globalPoints, pointSpan) / pointSpan) * maxTrees
    );
    return Math.min(maxTrees, Math.max(1, raw));
  }, [globalPoints, pointSpan, maxTrees, hasPlantedTreesOverride, normalizedPlantedTrees]);

  // Dyade 1: 0 = zielorientiert, 4 = erlebnisorientiert
  const clampedDyad1 = Math.max(0, Math.min(4, Number(dyad1Scale)));
  const goalOrientation = 1 - clampedDyad1 / 4;
  const experienceOrientation = clampedDyad1 / 4;
  const trunkHeightFactor = 1 + goalOrientation * 0.8;
  const branchCountFactor = 1 + experienceOrientation * 0.9;
  // Dyade 2: 0 = Struktur (homogen), 4 = Freiheit (chaotischer)
  const clampedDyad2 = Math.max(0, Math.min(4, Number(dyad2Scale)));
  const growthChaosStrength = (clampedDyad2 / 4) * 0.35;

  const ageSizeFactors = useMemo(() => {
    const list = Array.isArray(plantedAtList) ? plantedAtList : [];
    if (list.length <= 1) return list.map(() => 1);

    // Liste ist in ForestPage bereits nach Pflanzzeitpunkt aufsteigend sortiert (alt -> neu).
    return list.map((_, index) => {
      const normalizedAgeRank = 1 - index / (list.length - 1); // 1=ältester, 0=neuester
      return MIN_AGE_SIZE_FACTOR + normalizedAgeRank * (MAX_AGE_SIZE_FACTOR - MIN_AGE_SIZE_FACTOR);
    });
  }, [plantedAtList]);
  
  // Liste der Bäume mit treeAnchorIndex und growth
  const trees = useMemo(() => {         // growth ist sprunghaft (je nach rundung). TODO: growth so anpassen, dass es linear mit den Punkten wächst, z.B. durch Berechnung des Wachstums basierend auf den Punkten und den Schritten zum Wachstum eines Baumes.
    // Berechne für jeden Baum den growth Parameter
    return treeAnchors.slice(0, treeCount).map((anchor, index) => {
      const seedSource = `${anchor?.name ?? 'tree'}-${anchor?.uuid ?? index}`;
      const seed = Array.from(seedSource).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const normalized = Math.abs((Math.sin(seed * 12.9898) * 43758.5453) % 1);
      const chaosOffset = (normalized * 2 - 1) * growthChaosStrength;
      const ageFactor = ageSizeFactors[index] ?? 1;
      const sizeFactor = BASE_TREE_SIZE_FACTOR * ageFactor;
      const baseGrowth = Math.max(
        0,
        Math.min((globalPoints - (index + 1) * newTreeSteps) / treeGrowSteps, 1)
      );
      // Bonus nur fuer bereits gepflanzte/gerenderte Baeume anwenden
      const growth = Math.max(0, Math.min(1, baseGrowth + DAILY_GROWTH_BONUS + chaosOffset));
      return {
        treeAnchorIndex: index,
        growth,
        sizeFactor,
        anchor
      };
    });
  }, [treeAnchors, treeCount, maxTrees, globalPoints, newTreeSteps, treeGrowSteps, ageSizeFactors, growthChaosStrength]);
  
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
        inclination={0.5}
        azimuth={0.25}
        turbidity={2.0}
        rayleigh={2.6}
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
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshBasicMaterial color="#ffe7a6" toneMapped={false} />
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
            sizeFactor={tree.sizeFactor}
            trunkHeightFactor={trunkHeightFactor}
            branchCountFactor={branchCountFactor}
            maxTreeGrowSteps={treeGrowSteps}
            maxTrunkGrowth={1} 
            maxTwigGrowth={1} 
            num={i} 
          />
      ))}
    </>
  );
};


