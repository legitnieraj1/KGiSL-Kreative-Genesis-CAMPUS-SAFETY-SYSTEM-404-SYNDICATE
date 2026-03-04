"use client";

import { useSensorData } from "@/hooks/useSensorData";
import Header from "@/components/Header";
import StatusBanner from "@/components/StatusBanner";
import SeismicCard from "@/components/SeismicCard";
import GasCard from "@/components/GasCard";
import TempCard from "@/components/TempCard";
import HumidityCard from "@/components/HumidityCard";
import ZoneCard from "@/components/ZoneCard";
import LastUpdated from "@/components/LastUpdated";
import BottomNav from "@/components/BottomNav";
import AIInsightsCard from "@/components/AIInsightsCard";
import AIChatbot from "@/components/AIChatbot";
import NotificationPrompt from "@/components/NotificationPrompt";
import MotionCard from "@/components/MotionCard";

export default function Home() {
  const { zone, connection, alerts, seismicHistory, gasHistory, tempHistory, humidityHistory } = useSensorData();

  const isSeismicAlert = zone.data.seismic.magnitude >= 2.5;
  const isGasAlert = zone.data.gas.raw > 800;
  const isTempAlert = zone.data.temperature.celsius > 45;
  const isMotionAlert = zone.alert.type === "TRESPASSING";
  const hasAnyAlert = zone.alert.active;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] max-w-[32rem] mx-auto pb-24">
      <Header alerts={alerts} />
      <StatusBanner connection={connection} alert={zone.alert} sensorOnline={zone.sensorHealth.online} />

      <main className="px-4 space-y-4 mt-4">
        {/* Seismic — full width */}
        <SeismicCard
          magnitude={zone.data.seismic.magnitude}
          depth={zone.data.seismic.depth}
          history={seismicHistory}
          isAlert={isSeismicAlert}
        />

        {/* 2-column grid: Gas + Temp/Humidity */}
        <div className="grid grid-cols-2 gap-4">
          <GasCard
            raw={zone.data.gas.raw}
            status={zone.data.gas.status}
            ppm={zone.data.gas.ppm}
            history={gasHistory}
            isAlert={isGasAlert}
          />
          <div className="space-y-4">
            <TempCard
              fahrenheit={zone.data.temperature.fahrenheit}
              trend={zone.data.temperature.trend}
              history={tempHistory}
              isAlert={isTempAlert}
            />
            <HumidityCard
              percent={zone.data.humidity.percent}
              history={humidityHistory}
            />
          </div>
        </div>

        {/* Motion Detection */}
        <MotionCard
          motion={zone.data.motion ?? false}
          motionCount={zone.data.motionCount}
          isAlert={isMotionAlert}
        />

        {/* AI Insights */}
        <AIInsightsCard
          sensorData={zone.data}
          isAlert={hasAnyAlert}
          seismicHistory={seismicHistory}
          gasHistory={gasHistory}
          tempHistory={tempHistory}
        />

        {/* Zone Info */}
        <ZoneCard
          zoneName={zone.zoneName}
          sensorOnline={zone.sensorHealth.online}
        />

        <LastUpdated timestamp={zone.lastUpdate} />
      </main>

      <BottomNav />
      <NotificationPrompt />
      <AIChatbot />
    </div>
  );
}
