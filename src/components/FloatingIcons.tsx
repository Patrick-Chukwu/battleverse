import { motion } from "framer-motion";
// lucide-react icons removed (unused)

const floatingIcons = [
  { icon: "🚀", x: "10%", y: "20%", delay: 0, size: "text-3xl" },
  { icon: "🧠", x: "85%", y: "15%", delay: 1, size: "text-4xl" },
  { icon: "⚡", x: "75%", y: "70%", delay: 0.5, size: "text-2xl" },
  { icon: "💻", x: "15%", y: "75%", delay: 1.5, size: "text-3xl" },
  { icon: "🏆", x: "90%", y: "50%", delay: 2, size: "text-2xl" },
  { icon: "🎮", x: "5%", y: "45%", delay: 0.8, size: "text-2xl" },
  { icon: "🌟", x: "50%", y: "85%", delay: 1.2, size: "text-xl" },
  { icon: "🔥", x: "60%", y: "10%", delay: 0.3, size: "text-2xl" },
];

export function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className={`absolute ${item.size} opacity-20`}
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
}
