"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ฉากพื้นหลัง 3 มิติ: ปมทอรัสเส้นลวด + ทรงเรขาคณิตลอยได้ + ฝุ่นดาว
// ขยับตามเมาส์และการเลื่อนหน้า
export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1020, 0.045);

    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // ปมทอรัสกลางฉาก
    const knotGeo = new THREE.TorusKnotGeometry(2.2, 0.55, 220, 20);
    const knotMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.28,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(3.2, 0, -3);
    scene.add(knot);

    // ทรงเรขาคณิตลอยไปมา
    const shapeGeos = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TetrahedronGeometry(0.55, 0),
    ];
    const palette = [0x22d3ee, 0xa78bfa, 0xf472b6, 0xfbbf24];
    const shapes: { mesh: THREE.Mesh; speed: number; phase: number }[] = [];
    const shapeMats: THREE.Material[] = [];
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      shapeMats.push(mat);
      const mesh = new THREE.Mesh(shapeGeos[i % shapeGeos.length], mat);
      mesh.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 2
      );
      mesh.scale.setScalar(0.6 + Math.random() * 1.2);
      scene.add(mesh);
      shapes.push({ mesh, speed: 0.2 + Math.random() * 0.6, phase: Math.random() * 6 });
    }

    // ฝุ่นดาว
    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc7d2fe, size: 0.05, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // อินพุตจากผู้ใช้
    const mouse = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0, scroll: 0 };
    function onPointerMove(e: PointerEvent) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.render(scene, camera);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frame = 0;

    function render() {
      const t = clock.getElapsedTime();
      smooth.x += (mouse.x - smooth.x) * 0.04;
      smooth.y += (mouse.y - smooth.y) * 0.04;
      smooth.scroll += (window.scrollY - smooth.scroll) * 0.06;

      knot.rotation.x = t * 0.12 + smooth.y * 0.6;
      knot.rotation.y = t * 0.18 + smooth.x * 0.8;
      knot.position.y = Math.sin(t * 0.5) * 0.4 - smooth.scroll * 0.004;

      shapes.forEach(({ mesh, speed, phase }) => {
        mesh.rotation.x = t * speed;
        mesh.rotation.y = t * speed * 0.7;
        mesh.position.y += Math.sin(t * speed + phase) * 0.0025;
      });

      stars.rotation.y = t * 0.012 + smooth.x * 0.1;
      stars.rotation.x = smooth.y * 0.06;

      camera.position.x = smooth.x * 0.9;
      camera.position.y = -smooth.y * 0.6 - smooth.scroll * 0.002;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    function loop() {
      render();
      frame = requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      render();
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      knotGeo.dispose();
      knotMat.dispose();
      shapeGeos.forEach((g) => g.dispose());
      shapeMats.forEach((m) => m.dispose());
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="three-bg" aria-hidden="true" />;
}
