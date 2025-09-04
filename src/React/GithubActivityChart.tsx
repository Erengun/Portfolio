import React, { useEffect, useState } from "react";

interface GitHubCalendarProps {
  username: string;
  theme?: any;
  colorScheme?: "light" | "dark";
  transformData?: (data: any[]) => any[];
  fontSize?: number;
  blockSize?: number;
  blockMargin?: number;
  hideColorLegend?: boolean;
  hideTotalCount?: boolean;
  showWeekdayLabels?: boolean;
  style?: React.CSSProperties;
}

const GithubActivityChart: React.FC = () => {
  const [GitHubCalendar, setGitHubCalendar] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const { default: Calendar } = await import("react-github-calendar");
        setGitHubCalendar(() => Calendar);
      } catch (error) {
        console.error("Failed to load GitHub Calendar:", error);
      }
    };

    loadComponent();
  }, []);

  if (!GitHubCalendar) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="flex items-center justify-center p-4 w-full h-full">
          <div className="text-[#dfdfdf]">Loading GitHub Activity...</div>
        </div>
      </div>
    );
  }
  const theme = {
    light: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    dark: ["#161b22", "#5e4491", "#7952b3", "#A476FF", "#c9b3ff"],
  };

  const selectLastFullYear = (contributions: any[]) => {
    const currentYear = new Date().getFullYear();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentYear - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() + 1); // Start from one year ago + 1 day

    return contributions.filter((day) => {
      const date = new Date(day.date);
      return date >= oneYearAgo;
    });
  };

  const handleGitHubRedirect = () => {
    window.open('https://github.com/Erengun', '_blank');
  };

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div 
        className="flex items-center justify-center p-4 w-full h-full cursor-pointer hover:bg-[#ffffff08] transition-colors duration-200 rounded-lg"
        onClick={handleGitHubRedirect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleGitHubRedirect();
          }
        }}
        aria-label="View GitHub profile"
      >
        <GitHubCalendar
          username="Erengun"
          theme={theme}
          colorScheme="dark"
          transformData={selectLastFullYear}
          fontSize={12}
          blockSize={8}
          blockMargin={2}
          hideColorLegend={true}
          hideTotalCount={false}
          showWeekdayLabels={true}
          style={{
            color: "#dfdfdf",
          }}
        />
      </div>
    </div>
  );
};

export default GithubActivityChart;
