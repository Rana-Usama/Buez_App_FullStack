import React from "react";
import { ScrollView, StyleSheet } from "react-native";
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
      contentContainerStyle={styles.scrollViewContentContainer}
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

const styles = StyleSheet.create({
  scrollViewContentContainer: { alignItems: "center", marginTop: 18 },
});
