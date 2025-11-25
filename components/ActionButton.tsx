interface ActionButtonProps {
  text: string;
  primary?: boolean;
  onClick?: () => void;
}

export default function ActionButton({ text, primary = false, onClick }: ActionButtonProps) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-black border-4 border-black py-4.5 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="text-white text-center font-extrabold text-sm tracking-wider">
          {text}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border-4 border-black py-4.5 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="text-black text-center font-extrabold text-sm tracking-wider">
        {text}
      </div>
    </button>
  );
}





