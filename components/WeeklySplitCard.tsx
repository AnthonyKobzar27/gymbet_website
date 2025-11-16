interface WeeklySplitCardProps {
  hasActiveGame: boolean;
  weeklySchedule?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  currentDay: string;
  canLogWorkout: boolean;
  onPress?: () => void;
}

export default function WeeklySplitCard({
  hasActiveGame,
  weeklySchedule,
  currentDay,
  canLogWorkout,
  onPress,
}: WeeklySplitCardProps) {
  const days = ['M', 'T', 'W', 'TH', 'F', 'S', 'S'];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

  return (
    <div
      className={`border-4 border-black bg-white mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
        canLogWorkout && hasActiveGame && onPress
          ? 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          : ''
      }`}
      onClick={canLogWorkout && hasActiveGame ? onPress : undefined}
    >
      <div className="p-5">
        <div className="text-lg font-extrabold tracking-wide mb-4">WEEKLY SPLIT</div>
        <div className="h-4" />

        {!hasActiveGame ? (
          <div className="text-sm font-semibold text-gray-600 text-center py-6">
            Join a game to see your weekly split!
          </div>
        ) : weeklySchedule ? (
          <>
            <div className="flex justify-between mb-3">
              {days.map((dayLabel, index) => {
                const dayName = dayNames[index];
                const workout = weeklySchedule[dayName as keyof typeof weeklySchedule] || 'Rest';
                const isToday = index === todayIndex;

                return (
                  <div
                    key={index}
                    className={`flex-1 text-center py-2 px-0.5 border-2 mx-0.5 min-w-0 ${
                      isToday
                        ? 'border-black bg-black'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div
                      className={`text-[9px] font-bold mb-1 tracking-wide text-center w-full ${
                        isToday ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {dayLabel}
                    </div>
                    <div
                      className={`text-[10px] font-semibold text-center w-full ${
                        isToday ? 'text-white font-bold' : 'text-black'
                      }`}
                    >
                      {workout}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-0.5 bg-gray-200 my-3" />
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-[100px] max-w-[150px]">
                <div className="text-[10px] font-semibold text-gray-600 tracking-wider uppercase mb-1.5">
                  TODAY
                </div>
                <div className="text-4xl font-extrabold mb-1 min-h-[45px]">
                  {currentDay}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm font-semibold text-gray-600 text-center py-6">
            Loading schedule...
          </div>
        )}
      </div>
    </div>
  );
}

