import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCanvas3DProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  theme?: 'emerald' | 'cyan' | 'purple' | 'multi';
}

export const ThreeCanvas3D: React.FC<ThreeCanvas3DProps> = ({
  className = 'w-full h-full',
  particleCount = 75,
  interactive = true,
  theme = 'emerald'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Primary Theme Colors
    let primaryColor = 0x34C759; // emerald green (withU brand)
    let secondaryColor = 0x0ea5e9; // cyan blue
    let accentColor = 0xa855f7; // purple

    if (theme === 'cyan') {
      primaryColor = 0x06b6d4;
      secondaryColor = 0x3b82f6;
    } else if (theme === 'purple') {
      primaryColor = 0x8b5cf6;
      secondaryColor = 0xec4899;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(primaryColor, 2, 60);
    pointLight1.position.set(15, 15, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(secondaryColor, 1.8, 60);
    pointLight2.position.set(-15, -15, 15);
    scene.add(pointLight2);

    // 3D Geometric Floating Objects (Representing Multi-Services)
    const objectsGroup = new THREE.Group();

    // 1. Healthcare / Telemedicine Node (Wireframe Icosahedron)
    const geom1 = new THREE.IcosahedronGeometry(4.2, 1);
    const mat1 = new THREE.MeshStandardMaterial({
      color: primaryColor,
      wireframe: true,
      emissive: primaryColor,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.85
    });
    const mesh1 = new THREE.Mesh(geom1, mat1);
    mesh1.position.set(-12, 4, 0);
    objectsGroup.add(mesh1);

    // 2. Escrow Vault / Trust Node (Dodecahedron)
    const geom2 = new THREE.DodecahedronGeometry(3.6, 0);
    const mat2 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
      wireframe: true
    });
    const mesh2 = new THREE.Mesh(geom2, mat2);
    mesh2.position.set(12, -3, 2);
    objectsGroup.add(mesh2);

    // 3. Engineering & Architecture Blueprint Node (Torus Wireframe)
    const geom3 = new THREE.TorusGeometry(3.8, 1.2, 16, 50);
    const mat3 = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const mesh3 = new THREE.Mesh(geom3, mat3);
    mesh3.position.set(2, 8, -5);
    mesh3.rotation.x = Math.PI / 4;
    objectsGroup.add(mesh3);

    // 4. Central Multi-Service Core (Octahedron)
    const geom4 = new THREE.OctahedronGeometry(2.5, 0);
    const mat4 = new THREE.MeshStandardMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const mesh4 = new THREE.Mesh(geom4, mat4);
    mesh4.position.set(0, -6, -2);
    objectsGroup.add(mesh4);

    scene.add(objectsGroup);

    // Floating Particles Constellation
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 55;
      positions[i + 1] = (Math.random() - 0.5) * 45;
      positions[i + 2] = (Math.random() - 0.5) * 35;

      velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: primaryColor,
      size: 0.85,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera follow
      targetX += (mouseX * 4 - targetX) * 0.05;
      targetY += (mouseY * 4 - targetY) * 0.05;
      objectsGroup.rotation.y += 0.005;
      objectsGroup.rotation.x = targetY * 0.08;
      objectsGroup.rotation.y = targetX * 0.08;

      // Rotate sub-nodes
      mesh1.rotation.x += 0.01;
      mesh1.rotation.y += 0.012;

      mesh2.rotation.y += 0.009;
      mesh2.rotation.z += 0.008;

      mesh3.rotation.x += 0.007;
      mesh3.rotation.z += 0.01;

      mesh4.rotation.x += 0.012;
      mesh4.rotation.y += 0.015;

      // Animate Particles
      const pos = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] += velocities[i].x;
        pos[i3 + 1] += velocities[i].y;
        pos[i3 + 2] += velocities[i].z;

        // Boundary rebound
        if (pos[i3] < -30 || pos[i3] > 30) velocities[i].x *= -1;
        if (pos[i3 + 1] < -25 || pos[i3 + 1] > 25) velocities[i].y *= -1;
        if (pos[i3 + 2] < -20 || pos[i3 + 2] > 20) velocities[i].z *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geom1.dispose();
      geom2.dispose();
      geom3.dispose();
      geom4.dispose();
      mat1.dispose();
      mat2.dispose();
      mat3.dispose();
      mat4.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [particleCount, interactive, theme]);

  return <div ref={containerRef} className={`relative overflow-hidden pointer-events-none ${className}`} />;
};
