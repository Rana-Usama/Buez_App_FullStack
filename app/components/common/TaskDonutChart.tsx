import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

export type DonutSegment = {
  value: number;
  color: string;
};

type Props = {
  segments: DonutSegment[];
  /** Base used for proportions (usually the total). Falls back to the sum. */
  total?: number;
  size?: number;
  strokeWidth?: number;
  centerValue?: number | string;
  centerLabel?: string;
  valueColor?: string;
  labelColor?: string;
  trackColor?: string;
};

/**
 * Lightweight, dependency-light donut chart built on react-native-svg.
 * Segments are drawn as arcs via strokeDasharray; the ring starts at 12 o'clock.
 * Fully theme-driven — all colours are passed in by the caller.
 */
const TaskDonutChart = ({
  segments,
  total,
  size = RFPercentage(24),
  strokeWidth,
  centerValue,
  centerLabel,
  valueColor = Colors.blackSolid,
  labelColor = "#666",
  trackColor = Colors.blackAlpha06,
}: Props) => {
  const sw = strokeWidth ?? Math.round(size * 0.13);
  const radius = (size - sw) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const sum = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const base = total && total > 0 ? total : sum > 0 ? sum : 1;

  let offsetAccumulator = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {/* Track ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={sw}
            fill="none"
          />
          {segments.map((segment, index) => {
            if (segment.value <= 0) return null;
            const arcLength = (segment.value / base) * circumference;
            const dashOffset = -offsetAccumulator;
            offsetAccumulator += arcLength;
            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={sw}
                fill="none"
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>

      {(centerValue !== undefined || centerLabel) && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          {centerValue !== undefined && (
            <Text style={[styles.centerValue, { color: valueColor }]}>
              {centerValue}
            </Text>
          )}
          {!!centerLabel && (
            <Text
              style={[styles.centerLabel, { color: labelColor }]}
              numberOfLines={2}
            >
              {centerLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(2),
  },
  centerValue: {
    fontSize: RFPercentage(3.6),
    fontFamily: "Poppins_700Bold",
    lineHeight: RFPercentage(4.2),
  },
  centerLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: RFPercentage(0.2),
  },
});

export default TaskDonutChart;
