import React from "react";
import { Button } from "@/components/ui/button";

interface StepDiscordInviteProps {
  onNext: () => void;
  onSkip: () => void;
}

const StepDiscordInvite: React.FC<StepDiscordInviteProps> = ({ onNext, onSkip }) => {
  const handleJoinDiscord = () => {
    // First open Discord in new tab
    window.open("https://discord.gg/xJSSYxWt", "_blank");
    // Then immediately continue to next step (plan selection)
    onNext();
  };

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">You're not building alone.</h2>
        <p className="text-muted-foreground mb-8">
          Join the Ascentul Discord to connect with other driven professionals, get support,
          share wins, and grow alongside a high-agency community.
        </p>

        <Button
          onClick={handleJoinDiscord}
          className="w-full bg-[#1333c2] hover:bg-[#0f2aae] text-white font-semibold py-6 px-6 rounded-md"
          size="lg"
        >
          Join the Ascentul Discord
        </Button>

        <div className="mt-4">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Not now, skip this step
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDiscordInvite;
