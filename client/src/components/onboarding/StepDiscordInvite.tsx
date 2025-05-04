import React from "react";
import { motion } from "framer-motion";

interface StepDiscordInviteProps {
  onNext: () => void;
}

const StepDiscordInvite: React.FC<StepDiscordInviteProps> = ({ onNext }) => {
  const handleJoinDiscord = () => {
    window.open("https://discord.gg/xJSSYxWt", "_blank");
  };

  return (
    <motion.div
      className="max-w-xl mx-auto p-6 text-center space-y-6 bg-white rounded-xl shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-900">You're not building alone.</h2>
      <p className="text-gray-600">
        Join the Ascentul Discord to connect with other driven professionals, get support,
        share wins, and grow alongside a high-agency community.
      </p>

      <button
        onClick={handleJoinDiscord}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow"
      >
        Join the Ascentul Discord
      </button>

      <button
        onClick={onNext}
        className="mt-4 text-sm text-gray-500 underline hover:text-gray-700"
      >
        Not now, skip this step
      </button>
    </motion.div>
  );
};

export default StepDiscordInvite;