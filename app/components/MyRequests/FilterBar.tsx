import React from "react";
import { ScrollView } from "react-native";
import FilterButton from "../common/FilterButton";

type Props = {
  options: string[];
  active: string;
  onSelect: (title: string) => void;
};

export default function FilterBar({ options, active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: "center", marginTop: 18 }}
    >
      {options.map((title, idx) => (
        <FilterButton
          key={title}
          title={title}
          isActive={active === title}
          isFirst={idx === 0}
          onPress={() => onSelect(title)}
        />
      ))}
    </ScrollView>
  );
}