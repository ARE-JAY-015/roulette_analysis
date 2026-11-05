
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import "./RouletteWheel.css";

const ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
  6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26,
];

const RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function colorOf(number) {
  if (number === 0) return "#00c853";
  return RED.has(number) ? "#d71935" : "#080b0a";
}

function createPocketGeometry() {
  const geometry = new THREE.BufferGeometry();
  const innerRadius = 1.76;
  const outerRadius = 2.17;
  const halfAngle = ((Math.PI * 2) / 37) * 0.43;
  const segments = 6;

  const positions = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const angle = -halfAngle + (2 * halfAngle * i) / segments;
    const x = Math.sin(angle);
    const z = Math.cos(angle);

    positions.push(
      innerRadius * x, 0, innerRadius * z,
      outerRadius * x, 0, outerRadius * z
    );
  }

  for (let i = 0; i < segments; i++) {
    const innerA = i * 2;
    const outerA = innerA + 1;
    const innerB = innerA + 2;
    const outerB = innerB + 1;

    indices.push(
      innerA, innerB, outerA,
      outerA, innerB, outerB
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

const POCKET_GEOMETRY = createPocketGeometry();

function WheelModel({ spinRef, onFinished }) {
  const wheel = useRef(null);
  const ball = useRef(null);
  const animation = useRef(null);
  const step = (Math.PI * 2) / 37;

  useFrame((_, delta) => {
    const state = spinRef.current;

    if (!state.spinning || !wheel.current || !ball.current) {
      return;
    }

    if (!animation.current) {
      animation.current = {
        elapsed: 0,
        startWheel: wheel.current.rotation.y,
        targetWheel: state.target,
        startBallAngle: Math.atan2(
          ball.current.position.x,
          ball.current.position.z
        ),
      };
    }

    const a = animation.current;

    // Clamp large frame delays to keep the animation stable.
    a.elapsed += Math.min(delta, 0.04);

    const duration = 5.5;
    const p = Math.min(a.elapsed / duration, 1);

    // Wheel eases out smoothly and stops at the selected pocket.
    const wheelProgress = 1 - Math.pow(1 - p, 4);

    wheel.current.rotation.y =
      a.startWheel +
      (a.targetWheel - a.startWheel) * wheelProgress;

    state.rotation = wheel.current.rotation.y;

    /*
     * BALL DIRECTION FIX
     *
     * The ball angle always decreases. It never blends toward
     * a moving target, so that blend cannot reverse its direction.
     *
     * Cubic ease-out makes its angular speed approach zero
     * smoothly at the end of the spin.
     */
    const ballProgress = 1 - Math.pow(1 - p, 3);
    const totalBallRotation = Math.PI * 14;

    const angle =
      a.startBallAngle - totalBallRotation * ballProgress;

    // Move inward toward the pockets without changing direction.
   
const dropProgress = THREE.MathUtils.clamp(
  (p - 0.52) / 0.48,
  0,
  1
);

const dropEase =
  dropProgress * dropProgress * (3 - 2 * dropProgress);

// The ball moves from the outer track into the pocket area.
// Small radial movements imitate contact with pocket dividers.
const landingBounce =
  Math.sin(dropProgress * Math.PI * 6) *
  0.045 *
  (1 - dropProgress);

const radius =
  THREE.MathUtils.lerp(2.5, 1.96, dropEase) +
  landingBounce;


    // Hops fade out smoothly as the ball settles.
   
const bounceProgress = THREE.MathUtils.clamp(
  (p - 0.65) / 0.35,
  0,
  1
);

// Several small hops that become lower and slower near landing.
const bounceAmplitude = 0.13 * Math.pow(1 - bounceProgress, 1.5);
const bounceFrequency = THREE.MathUtils.lerp(13, 7, bounceProgress);

const bounce =
  Math.abs(Math.sin(a.elapsed * bounceFrequency)) *
  bounceAmplitude;

const height = 0.22 + bounce;


    ball.current.position.set(
  Math.sin(angle) * radius,
  height,
  Math.cos(angle) * radius
);

    if (p >= 1) {
      // The total ball rotation is a whole number of revolutions,
      // so the final angle matches the front position exactly.
      const finalAngle = a.startBallAngle - totalBallRotation;

ball.current.position.set(
  Math.sin(finalAngle) * 1.96,
  0.22,
  Math.cos(finalAngle) * 1.96
);

      wheel.current.rotation.y = a.targetWheel;
      state.rotation = a.targetWheel;
      state.spinning = false;
      animation.current = null;

      // Preserve the existing result/history integration.
      onFinished(state.result);
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[2, 8, 3]}
        intensity={2.2}
        color="#ffe1aa"
        castShadow
      />

      <pointLight
        position={[-3, 3, -2]}
        intensity={18}
        color="#b8d9ff"
        distance={9}
      />

      <pointLight
        position={[3, 2, 2]}
        intensity={22}
        color="#ffc45c"
        distance={8}
      />

      <group ref={wheel}>
        {/* Outer dark base */}
        <mesh
          position={[0, -0.12, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[2.8, 2.8, 0.25, 64]} />
          <meshStandardMaterial
            color="#24160f"
            roughness={0.8}
          />
        </mesh>

        {/* Wooden playing surface */}
        <mesh
          position={[0, 0.02, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[2.35, 2.35, 0.12, 64]} />
          <meshStandardMaterial
            color="#38251a"
            roughness={0.85}
          />
        </mesh>

        {/* Numbered pockets and gold separators */}
        {ORDER.map((number, index) => {
          const angle = index * step;
          const halfAngle = step * 0.46;
          const separatorRadius = 1.965;

          return (
            <group key={number} rotation={[0, angle, 0]}>
              <mesh
                geometry={POCKET_GEOMETRY}
                position={[0, 0.108, 0]}
              >
                <meshStandardMaterial
                  color={colorOf(number)}
                  roughness={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>

              <mesh
                position={[
                  Math.sin(-halfAngle) * separatorRadius,
                  0.132,
                  Math.cos(-halfAngle) * separatorRadius,
                ]}
                rotation={[0, -halfAngle, 0]}
              >
                <boxGeometry args={[0.018, 0.018, 0.41]} />
                <meshStandardMaterial
                  color="#e4bd65"
                  metalness={0.75}
                  roughness={0.28}
                />
              </mesh>

              <mesh
                position={[
                  Math.sin(halfAngle) * separatorRadius,
                  0.132,
                  Math.cos(halfAngle) * separatorRadius,
                ]}
                rotation={[0, halfAngle, 0]}
              >
                <boxGeometry args={[0.018, 0.018, 0.41]} />
                <meshStandardMaterial
                  color="#e4bd65"
                  metalness={0.75}
                  roughness={0.28}
                />
              </mesh>

              <Text
                position={[0, 0.15, 1.96]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.12}
                color="#fffaf0"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.006}
                outlineColor="#b88632"
                textAlign="center"
              >
                {String(number)}
              </Text>
            </group>
          );
        })}

        {/* Gold accent rings */}
        {[2.3, 1.72, 1.5, 1.22, 0.7].map((r, i) => (
          <mesh
            key={r}
            position={[0, i === 0 ? 0.12 : 0.145, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry
              args={[r, i === 0 ? 0.045 : 0.014, 8, 96]}
            />
            <meshStandardMaterial
              color="#d5a94f"
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
        ))}

        {/* Sloped inner bowl */}
        <mesh position={[0, 0.105, 0]}>
          <cylinderGeometry
            args={[0.72, 1.45, 0.12, 64, 1, true]}
          />
          <meshStandardMaterial
            color="#6e4a24"
            metalness={0.65}
            roughness={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner bowl rim */}
        <mesh
          position={[0, 0.17, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.72, 0.025, 10, 64]} />
          <meshStandardMaterial
            color="#e4bd65"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.42, 0.48, 0.15, 32]} />
          <meshStandardMaterial
            color="#9c6b2d"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial
            color="#f4d58b"
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* Ball is outside the wheel group so it has its own motion. */}
      <mesh ref={ball} position={[0, 0.22, 2.5]}>
        <sphereGeometry args={[0.105, 24, 24]} />
        <meshStandardMaterial
          color="#fff9ed"
          roughness={0.2}
        />
      </mesh>
    </>
  );
}

export default function RouletteWheel({ onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const spinRef = useRef({
    spinning: false,
    rotation: 0,
  });

  function spin() {
    if (spinRef.current.spinning) return;

    const index = Math.floor(Math.random() * ORDER.length);
    const number = ORDER[index];
    const full = Math.PI * 2;
    const current = spinRef.current.rotation || 0;

    // Rotate the selected pocket to the front.
    const pocketAngle = index * full / ORDER.length;
    const desired = -pocketAngle;

    const align =
      ((desired - current) % full + full) % full;

    spinRef.current = {
      ...spinRef.current,
      spinning: true,
      result: number,
      target: current + full * 5 + align,
    };

    setSpinning(true);
    setLastResult(null);
  }

  function finish(number) {
    setSpinning(false);
    setLastResult(number);
    onResult?.(number);
  }

  return (
    <section className="wheel-panel">
      <div className="wheel-heading">
        <div>
          <p className="wheel-eyebrow">LIVE 3D EXPERIENCE</p>
          <h2>European Roulette</h2>
        </div>
        <span className="wheel-badge">37 POCKETS</span>
      </div>

      <div className="wheel-stage">
        <Canvas
          camera={{ position: [0, 10, 0.01], fov: 38 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          shadows
        >
          <color attach="background" args={["#0c1510"]} />
          <WheelModel
            spinRef={spinRef}
            onFinished={finish}
          />
        </Canvas>
      </div>

      <div className="wheel-controls">
        <div className="wheel-result">
          <span className="result-label">LAST RESULT</span>
          <strong>
            {lastResult === null ? "—" : lastResult}
          </strong>
        </div>

        <button
          className="wheel-spin-button"
          onClick={spin}
          disabled={spinning}
        >
          {spinning ? "WHEEL SPINNING..." : "✦ SPIN THE WHEEL"}
        </button>
      </div>

      <p className="wheel-disclaimer">
        Virtual demonstration · Results are random and not predictions.
      </p>
    </section>
  );
}



